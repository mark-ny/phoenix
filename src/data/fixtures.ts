export type Provenance = 'VERIFIED' | 'SAMPLE' | 'INFERRED' | 'UNAVAILABLE';
export type Status = 'ready' | 'attention' | 'blocked' | 'complete' | 'planned';

export type Device = {
  id: string;
  manufacturer: string;
  model: string;
  codename: string;
  serial: string;
  mode: string;
  connection: string;
  android: string;
  architecture: string;
  storage: string;
  battery: string;
  adb: string;
  bootloader: string;
  confidence: string;
  lastSeen: string;
  status: Status;
  provenance: Provenance;
  note: string;
};

export type Job = {
  id: string;
  type: string;
  device: string;
  operator: string;
  status: Status;
  progress: number;
  timestamp: string;
  detail: string;
};

export type Firmware = {
  name: string;
  device: string;
  version: string;
  source: string;
  checksum: string;
  signature: string;
  status: Status;
  published: string;
};

export const devices: Device[] = [
  {
    id: 'PX-0421', manufacturer: 'Google', model: 'Pixel 8 Pro', codename: 'husky', serial: '9A281FFH3M',
    mode: 'ADB / authorized', connection: 'USB-C · 480 Mbps', android: 'Android 15 · AP4A.250205.002', architecture: 'arm64-v8a', storage: '128 GB · 71% used', battery: '86% · charging', adb: 'Authorized', bootloader: 'Locked', confidence: 'High · ADB + profile', lastSeen: 'Just now', status: 'ready', provenance: 'SAMPLE', note: 'Seeded sample record — connect a device to replace this evidence.',
  },
  {
    id: 'PX-0398', manufacturer: 'Samsung', model: 'Galaxy S23', codename: 'dm1q', serial: 'RFCR91W7Q8E',
    mode: 'Fastboot / bootloader', connection: 'USB-C · 480 Mbps', android: 'Android 14 · UP1A.231005.007', architecture: 'arm64-v8a', storage: '256 GB · unavailable', battery: '62% · external power', adb: 'Not applicable', bootloader: 'Unlocked', confidence: 'Medium · USB profile', lastSeen: '4 min ago', status: 'attention', provenance: 'SAMPLE', note: 'Bootloader mode detected; Android properties are not exposed in this mode.',
  },
  {
    id: 'PX-0407', manufacturer: 'Motorola', model: 'moto g84 5G', codename: 'bangkk', serial: 'ZDZL6Q0V4S',
    mode: 'USB / no protocol', connection: 'USB-C · 12 Mbps', android: 'Unavailable', architecture: 'Unavailable', storage: 'Unavailable', battery: 'Unavailable', adb: 'Not authorized', bootloader: 'Unavailable', confidence: 'Low · USB descriptor', lastSeen: '18 min ago', status: 'blocked', provenance: 'SAMPLE', note: 'USB debugging is disabled or not authorized. No servicing operation is available.',
  },
];

export const jobs: Job[] = [
  { id: 'JOB-0184', type: 'Device intake', device: 'Google Pixel 8 Pro', operator: 'M. Otieno', status: 'complete', progress: 100, timestamp: 'Today, 09:42', detail: 'Identity snapshot saved; no device mutation performed.' },
  { id: 'JOB-0183', type: 'Compatibility check', device: 'Samsung Galaxy S23', operator: 'A. Wanjiku', status: 'attention', progress: 68, timestamp: 'Today, 09:36', detail: 'Waiting for Android-mode evidence after bootloader reconnect.' },
  { id: 'JOB-0182', type: 'Firmware import', device: 'Pixel 8 Pro profile', operator: 'M. Otieno', status: 'complete', progress: 100, timestamp: 'Yesterday, 16:18', detail: 'Metadata imported; checksum present; signature not evaluated in MVP.' },
  { id: 'JOB-0181', type: 'Recovery guidance', device: 'moto g84 5G', operator: 'K. Njoroge', status: 'blocked', progress: 22, timestamp: 'Yesterday, 15:50', detail: 'Stopped: USB debugging is not authorized and ownership route is required.' },
];

export const firmware: Firmware[] = [
  { name: 'Pixel 8 Pro · AP4A.250205.002', device: 'husky', version: 'AP4A.250205.002', source: 'developers.google.com/android/images', checksum: 'SHA-256 present', signature: 'Not evaluated', status: 'ready', published: '2025-02-03' },
  { name: 'Galaxy S23 · S911BXXU7DXA1', device: 'dm1q', version: 'S911BXXU7DXA1', source: 'samsung.com/support', checksum: 'Not imported', signature: 'Not evaluated', status: 'planned', published: '2025-01-12' },
  { name: 'moto g84 · T1TES34.111-22-7', device: 'bangkk', version: 'T1TES34.111-22-7', source: 'motorola.com/support', checksum: 'Not imported', signature: 'Not evaluated', status: 'blocked', published: '2024-11-08' },
];

export const audit = [
  ['09:42:18', 'Device snapshot created', 'JOB-0184', 'M. Otieno'],
  ['09:39:05', 'Compatibility rule evaluated', 'JOB-0183', 'A. Wanjiku'],
  ['09:36:44', 'Bootloader mode detected', 'PX-0398', 'System'],
  ['09:12:07', 'Operator session started', 'WS-KE-04', 'M. Otieno'],
];
