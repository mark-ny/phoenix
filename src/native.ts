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

export type ApprovalRequestRecord = { id: string; status: string; createdAt: string; adminEmail: string };
export type LicenseRecord = { id: string; requestId: string; jobId?: string; deviceSerial: string; operation: string; issuedAt: string; expiresAt: string; token: string; publicKey: string };

export async function createApprovalRequest(input: { customerName: string; deviceSerial: string; operation: string; consentText: string; signature: string; jobId?: string }): Promise<ApprovalRequestRecord | null> {
  const invoke = getTauriInvoke();
  return invoke ? invoke<ApprovalRequestRecord>('create_approval_request', input) : null;
}

export async function configureAdminPin(pin: string): Promise<void> {
  const invoke = getTauriInvoke();
  if (invoke) await invoke('configure_admin_pin', { pin });
}

export async function approveApprovalRequest(approvalId: string, adminPin: string): Promise<LicenseRecord | null> {
  const invoke = getTauriInvoke();
  return invoke ? invoke<LicenseRecord>('approve_approval_request', { approvalId, adminPin }) : null;
}

export async function revokeLicense(licenseId: string, adminPin: string, reason: string): Promise<void> {
  const invoke = getTauriInvoke();
  if (invoke) await invoke('revoke_license', { licenseId, adminPin, reason });
}
