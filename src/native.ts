export type RuntimeInfo = {
  product: string;
  platform: string;
  nativeAdapter: string;
  destructiveOperationsEnabled: boolean;
  databasePath: string;
  adbAvailable: boolean;
  fastbootAvailable: boolean;
};

export type DeviceInventory = {
  devices: Array<{ serial: string; mode: string; authorization: string; manufacturer?: string; model?: string }>;
  source: string;
  nativeMonitorReady: boolean;
  adbAvailable: boolean;
  fastbootAvailable: boolean;
  warnings: string[];
};

type TauriInvoke = <T>(command: string, args?: Record<string, unknown>) => Promise<T>;

function getTauriInvoke(): TauriInvoke | null {
  const internals = (window as Window & { __TAURI_INTERNALS__?: { invoke?: TauriInvoke } }).__TAURI_INTERNALS__;
  return internals?.invoke ?? null;
}

export function isDesktopShell(): boolean {
  return Boolean(getTauriInvoke());
}

export async function getRuntimeInfo(): Promise<RuntimeInfo | null> {
  const invoke = getTauriInvoke();
  return invoke ? invoke<RuntimeInfo>('runtime_info') : null;
}

export async function listConnectedDevices(): Promise<DeviceInventory | null> {
  const invoke = getTauriInvoke();
  return invoke ? invoke<DeviceInventory>('list_connected_devices') : null;
}

export async function initializeLocalStore(): Promise<string | null> {
  const invoke = getTauriInvoke();
  return invoke ? invoke<string>('initialize_local_store') : null;
}

export async function verifyFirmwareFile(path: string, algorithm: string, expected: string): Promise<unknown | null> {
  const invoke = getTauriInvoke();
  return invoke ? invoke('verify_firmware_file', { path, algorithm, expected }) : null;
}
