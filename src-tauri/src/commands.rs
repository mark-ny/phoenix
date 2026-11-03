use crate::{storage, verification};
use serde::Serialize;
#[cfg(windows)]
use std::os::windows::process::CommandExt;
use std::path::PathBuf;
use std::process::Command;

fn hidden_command(program: &str) -> Command {
    #[cfg(not(windows))]
    let command = Command::new(program);
    #[cfg(windows)]
    let mut command = Command::new(program);
    #[cfg(windows)]
    command.creation_flags(0x08000000);
    command
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeInfo {
    pub product: &'static str,
    pub platform: &'static str,
    pub native_adapter: &'static str,
    pub destructive_operations_enabled: bool,
    pub database_path: String,
    pub adb_available: bool,
    pub fastboot_available: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectedDevice {
    pub id: String,
    pub serial: String,
    pub mode: String,
    pub authorization: String,
    pub manufacturer: Option<String>,
    pub model: Option<String>,
    pub source: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceInventory {
    pub devices: Vec<ConnectedDevice>,
    pub source: String,
    pub native_monitor_ready: bool,
    pub adb_available: bool,
    pub fastboot_available: bool,
    pub warnings: Vec<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VerificationResult {
    pub algorithm: String,
    pub expected: String,
    pub actual: Option<String>,
    pub matches: bool,
    pub signature_status: &'static str,
}

fn tool_available(tool: &str) -> bool {
    hidden_command(tool).arg("version").output().is_ok()
}

fn parse_adb(output: &str) -> Vec<ConnectedDevice> {
    output
        .lines()
        .skip(1)
        .filter_map(|line| {
            let mut parts = line.split_whitespace();
            let serial = parts.next()?.to_string();
            let state = parts.next().unwrap_or("unknown").to_string();
            if serial.is_empty() {
                return None;
            }
            let mut manufacturer = None;
            let mut model = None;
            for token in parts {
                if let Some(value) = token.strip_prefix("manufacturer:") {
                    manufacturer = Some(value.replace('_', " "));
                }
                if let Some(value) = token.strip_prefix("model:") {
                    model = Some(value.replace('_', " "));
                }
            }
            Some(ConnectedDevice {
                id: format!("adb:{serial}"),
                serial,
                mode: "ADB".to_string(),
                authorization: if state == "device" {
                    "authorized".to_string()
                } else {
                    state
                },
                manufacturer,
                model,
                source: "adb devices -l".to_string(),
            })
        })
        .collect()
}

fn parse_fastboot(output: &str) -> Vec<ConnectedDevice> {
    output
        .lines()
        .filter_map(|line| {
            let serial = line.split_whitespace().next()?.to_string();
            if serial.is_empty() {
                return None;
            }
            Some(ConnectedDevice {
                id: format!("fastboot:{serial}"),
                serial,
                mode: "Fastboot".to_string(),
                authorization: "not_applicable".to_string(),
                manufacturer: None,
                model: None,
                source: "fastboot devices".to_string(),
            })
        })
        .collect()
}

/// Reports real tool presence and initializes local persistence without mutating a device.
#[tauri::command]
pub fn runtime_info() -> RuntimeInfo {
    let path = storage::initialize().unwrap_or_else(|_| PathBuf::from("unavailable"));
    RuntimeInfo {
        product: "Project Phoenix",
        platform: std::env::consts::OS,
        native_adapter: "tool-backed-discovery",
        destructive_operations_enabled: false,
        database_path: path.display().to_string(),
        adb_available: tool_available("adb"),
        fastboot_available: tool_available("fastboot"),
    }
}

/// Enumerates ADB/Fastboot-visible devices when official tools are installed.
/// It does not flash, erase, unlock, reset, or bypass any device security control.
#[tauri::command]
pub fn list_connected_devices() -> DeviceInventory {
    let adb_available = tool_available("adb");
    let fastboot_available = tool_available("fastboot");
    let mut devices = Vec::new();
    let mut warnings = Vec::new();
    if adb_available {
        match hidden_command("adb").args(["devices", "-l"]).output() {
            Ok(output) if output.status.success() => {
                devices.extend(parse_adb(&String::from_utf8_lossy(&output.stdout)))
            }
            Ok(_) => warnings.push("ADB returned a non-success status.".to_string()),
            Err(error) => warnings.push(format!("ADB could not be started: {error}")),
        }
    } else {
        warnings.push("ADB is not installed or not on PATH.".to_string());
    }
    if fastboot_available {
        match hidden_command("fastboot").arg("devices").output() {
            Ok(output) if output.status.success() => {
                devices.extend(parse_fastboot(&String::from_utf8_lossy(&output.stdout)))
            }
            Ok(_) => warnings.push("Fastboot returned a non-success status.".to_string()),
            Err(error) => warnings.push(format!("Fastboot could not be started: {error}")),
        }
    } else {
        warnings.push("Fastboot is not installed or not on PATH.".to_string());
    }
    let _ = storage::initialize();
    DeviceInventory {
        devices,
        source: "official-platform-tools".to_string(),
        native_monitor_ready: adb_available || fastboot_available,
        adb_available,
        fastboot_available,
        warnings,
    }
}

/// Initializes or upgrades the local SQLite store and returns its path.
#[tauri::command]
pub fn initialize_local_store() -> Result<String, String> {
    storage::initialize()
        .map(|path| path.display().to_string())
        .map_err(|error| error.to_string())
}

/// Verifies a local file checksum. Signature verification remains an explicit future adapter.
#[tauri::command]
pub fn verify_firmware_file(
    path: String,
    algorithm: String,
    expected: String,
) -> Result<VerificationResult, String> {
    let file = PathBuf::from(path);
    let actual =
        verification::checksum_file(&file, &algorithm).map_err(|error| error.to_string())?;
    Ok(VerificationResult {
        algorithm,
        expected: expected.clone(),
        matches: actual.eq_ignore_ascii_case(expected.trim()),
        actual: Some(actual),
        signature_status: "not_evaluated",
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            runtime_info,
            list_connected_devices,
            initialize_local_store,
            verify_firmware_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running Phoenix desktop application");
}

#[cfg(test)]
mod tests {
    use super::{parse_adb, parse_fastboot};

    #[test]
    fn parses_authorized_adb_device() {
        let devices = parse_adb("List of devices attached\nABC123\tdevice product:oriole model:Pixel_6 manufacturer:Google\n");
        assert_eq!(devices.len(), 1);
        assert_eq!(devices[0].serial, "ABC123");
        assert_eq!(devices[0].authorization, "authorized");
        assert_eq!(devices[0].manufacturer.as_deref(), Some("Google"));
    }

    #[test]
    fn parses_fastboot_device() {
        let devices = parse_fastboot("ABC123\tfastboot\n");
        assert_eq!(devices.len(), 1);
        assert_eq!(devices[0].mode, "Fastboot");
        assert_eq!(devices[0].authorization, "not_applicable");
    }
}
