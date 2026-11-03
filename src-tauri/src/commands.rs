use crate::{storage, verification};
use ed25519_dalek::{Signature, Signer, SigningKey, Verifier, VerifyingKey};
use rand_core::OsRng;
use rusqlite::{params, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::fs;
#[cfg(windows)]
use std::os::windows::process::CommandExt;
use std::path::PathBuf;
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

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

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApprovalRequestInput {
    pub customer_name: String,
    pub device_serial: String,
    pub operation: String,
    pub consent_text: String,
    pub signature: String,
    pub job_id: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApprovalRequestRecord {
    pub id: String,
    pub status: String,
    pub created_at: String,
    pub admin_email: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LicenseRecord {
    pub id: String,
    pub request_id: String,
    pub job_id: Option<String>,
    pub device_serial: String,
    pub operation: String,
    pub issued_at: String,
    pub expires_at: String,
    pub token: String,
    pub public_key: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LicenseValidation {
    pub valid: bool,
    pub reason: String,
    pub license_id: Option<String>,
    pub expires_at: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProtectedOperationResult {
    pub allowed: bool,
    pub reason: String,
    pub audit_reference: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LicensePayload {
    license_id: String,
    request_id: String,
    job_id: Option<String>,
    device_serial: String,
    operation: String,
    issued_at: String,
    expires_at: String,
}

fn tool_available(tool: &str) -> bool {
    hidden_command(tool).arg("version").output().is_ok()
}

fn now_seconds() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}

fn request_id(prefix: &str) -> String {
    format!("{prefix}-{}", now_seconds())
}

fn audit(
    connection: &rusqlite::Connection,
    event: &str,
    reference: &str,
    actor: &str,
) -> Result<(), String> {
    connection
        .execute(
            "INSERT INTO audit_logs (event, reference, actor) VALUES (?1, ?2, ?3)",
            params![event, reference, actor],
        )
        .map(|_| ())
        .map_err(|error| error.to_string())
}

fn signing_key() -> Result<SigningKey, String> {
    let path = storage::default_data_dir().join("phoenix-license-signing.key");
    if let Ok(bytes) = fs::read(&path) {
        let raw: [u8; 32] = bytes
            .try_into()
            .map_err(|_| "Invalid local signing key length".to_string())?;
        return Ok(SigningKey::from_bytes(&raw));
    }
    let key = SigningKey::generate(&mut OsRng);
    fs::create_dir_all(storage::default_data_dir()).map_err(|error| error.to_string())?;
    fs::write(&path, key.to_bytes()).map_err(|error| error.to_string())?;
    Ok(key)
}

fn admin_hash(salt: &str, pin: &str) -> String {
    use sha2::{Digest, Sha256};
    let mut digest = Sha256::new();
    digest.update(salt.as_bytes());
    digest.update(b":");
    digest.update(pin.as_bytes());
    hex::encode(digest.finalize())
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

#[tauri::command]
pub fn create_approval_request(
    input: ApprovalRequestInput,
) -> Result<ApprovalRequestRecord, String> {
    let path = storage::initialize().map_err(|error| error.to_string())?;
    let connection = storage::open_existing(&path).map_err(|error| error.to_string())?;
    let id = request_id("APR");
    let payload = serde_json::to_string(&input).map_err(|error| error.to_string())?;
    connection.execute("INSERT INTO approval_requests (id, job_id, customer_name, device_serial, operation, consent_text, signature, status, payload_json) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'pending_admin_review', ?8)", params![id, input.job_id, input.customer_name, input.device_serial, input.operation, input.consent_text, input.signature, payload]).map_err(|error| error.to_string())?;
    audit(&connection, "approval_request_created", &id, "technician")?;
    Ok(ApprovalRequestRecord {
        id,
        status: "pending_admin_review".to_string(),
        created_at: now_seconds().to_string(),
        admin_email: "markomodho@gmail.com".to_string(),
    })
}

#[tauri::command]
pub fn configure_admin_pin(pin: String) -> Result<(), String> {
    if pin.trim().len() < 8 {
        return Err("Administrator PIN must be at least 8 characters for testing.".to_string());
    }
    let path = storage::initialize().map_err(|error| error.to_string())?;
    let connection = storage::open_existing(&path).map_err(|error| error.to_string())?;
    let salt = format!("{}-{}", now_seconds(), request_id("SALT"));
    let hash = admin_hash(&salt, &pin);
    connection.execute("INSERT INTO admin_credentials (id, salt, password_hash) VALUES (1, ?1, ?2) ON CONFLICT(id) DO UPDATE SET salt=excluded.salt, password_hash=excluded.password_hash, updated_at=CURRENT_TIMESTAMP", params![salt, hash]).map_err(|error| error.to_string())?;
    audit(
        &connection,
        "admin_credentials_configured",
        "local-admin",
        "administrator",
    )?;
    Ok(())
}

#[tauri::command]
pub fn approve_approval_request(
    approval_id: String,
    admin_pin: String,
) -> Result<LicenseRecord, String> {
    let path = storage::initialize().map_err(|error| error.to_string())?;
    let connection = storage::open_existing(&path).map_err(|error| error.to_string())?;
    let credentials: Option<(String, String)> = connection
        .query_row(
            "SELECT salt, password_hash FROM admin_credentials WHERE id = 1",
            [],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .optional()
        .map_err(|error| error.to_string())?;
    let (salt, expected_hash) =
        credentials.ok_or_else(|| "Administrator credentials are not configured.".to_string())?;
    if admin_hash(&salt, &admin_pin) != expected_hash {
        audit(
            &connection,
            "admin_approval_failed",
            &approval_id,
            "administrator",
        )?;
        return Err("Administrator authentication failed.".to_string());
    }
    let request: (Option<String>, String, String, String, String) = connection.query_row("SELECT job_id, device_serial, operation, status, id FROM approval_requests WHERE id = ?1", params![approval_id], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?))).map_err(|error| error.to_string())?;
    if request.3 != "pending_admin_review" {
        return Err(format!("Approval request is not pending: {}", request.3));
    }
    let license_id = request_id("LIC");
    let issued_at = now_seconds();
    let expires_at = issued_at + 7 * 24 * 60 * 60;
    let payload = LicensePayload {
        license_id: license_id.clone(),
        request_id: request.4.clone(),
        job_id: request.0.clone(),
        device_serial: request.1.clone(),
        operation: request.2.clone(),
        issued_at: issued_at.to_string(),
        expires_at: expires_at.to_string(),
    };
    let payload_bytes = serde_json::to_vec(&payload).map_err(|error| error.to_string())?;
    let key = signing_key()?;
    let signature = key.sign(&payload_bytes);
    let token = format!(
        "v1.{}.{}",
        hex::encode(&payload_bytes),
        hex::encode(signature.to_bytes())
    );
    let public_key = hex::encode(key.verifying_key().to_bytes());
    connection.execute("INSERT INTO licenses (id, request_id, job_id, device_serial, operation, issued_at, expires_at, token, public_key) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)", params![license_id, request.4, request.0, request.1, request.2, issued_at.to_string(), expires_at.to_string(), token, public_key]).map_err(|error| error.to_string())?;
    connection.execute("UPDATE approval_requests SET status='approved', reviewed_at=CURRENT_TIMESTAMP, reviewer='administrator' WHERE id=?1", params![approval_id]).map_err(|error| error.to_string())?;
    audit(&connection, "license_issued", &license_id, "administrator")?;
    Ok(LicenseRecord {
        id: license_id,
        request_id: request.4,
        job_id: request.0,
        device_serial: request.1,
        operation: request.2,
        issued_at: issued_at.to_string(),
        expires_at: expires_at.to_string(),
        token,
        public_key,
    })
}

#[tauri::command]
pub fn validate_license(
    token: String,
    job_id: Option<String>,
    device_serial: String,
    operation: String,
) -> Result<LicenseValidation, String> {
    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() != 3 || parts[0] != "v1" {
        return Ok(LicenseValidation {
            valid: false,
            reason: "Malformed license token".to_string(),
            license_id: None,
            expires_at: None,
        });
    }
    let payload_bytes =
        hex::decode(parts[1]).map_err(|_| "Malformed license payload".to_string())?;
    let signature_bytes =
        hex::decode(parts[2]).map_err(|_| "Malformed license signature".to_string())?;
    let signature = Signature::from_slice(&signature_bytes)
        .map_err(|_| "Malformed license signature".to_string())?;
    let path = storage::initialize().map_err(|error| error.to_string())?;
    let connection = storage::open_existing(&path).map_err(|error| error.to_string())?;
    let public_key_hex: String = connection
        .query_row(
            "SELECT public_key FROM licenses WHERE token=?1",
            params![token],
            |row| row.get(0),
        )
        .map_err(|_| "License not found".to_string())?;
    let public_key_bytes =
        hex::decode(public_key_hex).map_err(|_| "Invalid license public key".to_string())?;
    let public_key_array: [u8; 32] = public_key_bytes
        .try_into()
        .map_err(|_| "Invalid license public key".to_string())?;
    VerifyingKey::from_bytes(&public_key_array)
        .map_err(|_| "Invalid license public key".to_string())?
        .verify(&payload_bytes, &signature)
        .map_err(|_| "License signature verification failed".to_string())?;
    let payload: LicensePayload = serde_json::from_slice(&payload_bytes)
        .map_err(|_| "Invalid license payload".to_string())?;
    let expires = payload
        .expires_at
        .parse::<i64>()
        .map_err(|_| "Invalid license expiry".to_string())?;
    let revoked: Option<String> = connection
        .query_row(
            "SELECT revoked_at FROM licenses WHERE token=?1",
            params![token],
            |row| row.get(0),
        )
        .map_err(|error| error.to_string())?;
    if revoked.is_some() {
        return Ok(LicenseValidation {
            valid: false,
            reason: "License revoked".to_string(),
            license_id: Some(payload.license_id),
            expires_at: Some(payload.expires_at),
        });
    }
    if expires <= now_seconds() {
        return Ok(LicenseValidation {
            valid: false,
            reason: "License expired".to_string(),
            license_id: Some(payload.license_id),
            expires_at: Some(payload.expires_at),
        });
    }
    if payload.job_id != job_id
        || payload.device_serial != device_serial
        || payload.operation != operation
    {
        return Ok(LicenseValidation {
            valid: false,
            reason: "License is not bound to this job, device, and operation".to_string(),
            license_id: Some(payload.license_id),
            expires_at: Some(payload.expires_at),
        });
    }
    Ok(LicenseValidation {
        valid: true,
        reason: "License signature, expiry, and device/job binding verified".to_string(),
        license_id: Some(payload.license_id),
        expires_at: Some(payload.expires_at),
    })
}

#[tauri::command]
pub fn revoke_license(license_id: String, admin_pin: String, reason: String) -> Result<(), String> {
    let path = storage::initialize().map_err(|error| error.to_string())?;
    let connection = storage::open_existing(&path).map_err(|error| error.to_string())?;
    let credentials: Option<(String, String)> = connection
        .query_row(
            "SELECT salt, password_hash FROM admin_credentials WHERE id = 1",
            [],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .optional()
        .map_err(|error| error.to_string())?;
    let (salt, expected_hash) =
        credentials.ok_or_else(|| "Administrator credentials are not configured.".to_string())?;
    if admin_hash(&salt, &admin_pin) != expected_hash {
        return Err("Administrator authentication failed.".to_string());
    }
    connection.execute("UPDATE licenses SET revoked_at=CURRENT_TIMESTAMP, revoked_reason=?1 WHERE id=?2 AND revoked_at IS NULL", params![reason, license_id]).map_err(|error| error.to_string())?;
    audit(&connection, "license_revoked", &license_id, "administrator")?;
    Ok(())
}

#[tauri::command]
pub fn execute_protected_operation(
    token: String,
    job_id: Option<String>,
    device_serial: String,
    operation: String,
) -> Result<ProtectedOperationResult, String> {
    let validation = validate_license(token, job_id, device_serial, operation.clone())?;
    let reference = request_id("OP");
    let path = storage::initialize().map_err(|error| error.to_string())?;
    let connection = storage::open_existing(&path).map_err(|error| error.to_string())?;
    if !validation.valid {
        audit(
            &connection,
            "protected_operation_denied",
            &reference,
            "technician",
        )?;
        return Ok(ProtectedOperationResult {
            allowed: false,
            reason: validation.reason,
            audit_reference: reference,
        });
    }
    audit(
        &connection,
        "protected_operation_blocked_no_native_adapter",
        &reference,
        "technician",
    )?;
    Ok(ProtectedOperationResult { allowed: false, reason: format!("License verified, but {operation} remains disabled until a device-specific native adapter passes physical safety testing."), audit_reference: reference })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            runtime_info,
            list_connected_devices,
            initialize_local_store,
            verify_firmware_file,
            create_approval_request,
            configure_admin_pin,
            approve_approval_request,
            validate_license,
            revoke_license,
            execute_protected_operation
        ])
        .run(tauri::generate_context!())
        .expect("error while running Phoenix desktop application");
}

#[cfg(test)]
mod tests {
    use super::{admin_hash, parse_adb, parse_fastboot};
    use ed25519_dalek::{Signer, SigningKey, Verifier};
    use rand_core::OsRng;

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

    #[test]
    fn signs_and_verifies_license_payload() {
        let key = SigningKey::generate(&mut OsRng);
        let payload = b"phoenix-license-test";
        let signature = key.sign(payload);
        assert!(key.verifying_key().verify(payload, &signature).is_ok());
        assert!(key.verifying_key().verify(b"tampered", &signature).is_err());
    }

    #[test]
    fn administrator_hash_is_stable_for_same_salt_and_pin() {
        assert_eq!(
            admin_hash("salt", "secret-pin"),
            admin_hash("salt", "secret-pin")
        );
        assert_ne!(
            admin_hash("salt", "secret-pin"),
            admin_hash("salt", "wrong-pin")
        );
    }
}
