import { useEffect, useMemo, useState } from 'react';
import { audit, devices, firmware, jobs, type Device, type Firmware, type Job, type Provenance, type Status } from './data/fixtures';
import { getRuntimeInfo, listConnectedDevices, type RuntimeInfo } from './native';
import type { NavItem, ViewKey } from './types';

const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: '⌂', group: 'work' },
  { key: 'devices', label: 'USB Devices', icon: '⌁', group: 'work' },
  { key: 'eraser', label: 'Data Eraser', icon: '⊘', group: 'work' },
  { key: 'recovery', label: 'Device Recovery', icon: '↯', group: 'work' },
  { key: 'os-manager', label: 'OS Manager', icon: '◈', group: 'work' },
  { key: 'firmware', label: 'Firmware Library', icon: '▣', group: 'work' },
  { key: 'diagnostics', label: 'Diagnostics', icon: '⌬', group: 'work' },
  { key: 'customers', label: 'Customers', icon: '◌', group: 'records' },
  { key: 'jobs', label: 'Service Jobs', icon: '≡', group: 'records' },
  { key: 'certificates', label: 'Certificates', icon: '◇', group: 'records' },
  { key: 'subscription', label: 'Subscription & Workstations', icon: '◆', group: 'system' },
  { key: 'settings', label: 'Settings', icon: '⚙', group: 'system' },
];

const viewMeta: Record<ViewKey, { eyebrow: string; title: string; description: string }> = {
  dashboard: { eyebrow: 'Operations overview', title: 'Good morning, technician.', description: 'A calm view of connected evidence, work in motion, and anything that needs a decision.' },
  devices: { eyebrow: 'Device intelligence', title: 'USB devices', description: 'Every identity is scoped to a connection, a mode, and an evidence source.' },
  eraser: { eyebrow: 'Controlled workflow', title: 'Data eraser', description: 'Sanitization planning is available; device mutation is intentionally locked in this MVP.' },
  recovery: { eyebrow: 'Authorized servicing', title: 'Device recovery', description: 'Guidance for legitimate recovery paths without bypassing security controls.' },
  'os-manager': { eyebrow: 'Images & deployment', title: 'OS manager', description: 'Match images to exact hardware before a native deployment adapter exists.' },
  firmware: { eyebrow: 'Evidence library', title: 'Firmware library', description: 'Track official-source metadata, integrity signals, and compatibility posture.' },
  diagnostics: { eyebrow: 'Test bench', title: 'Diagnostics', description: 'Separate automated evidence from technician-assisted inspection.' },
  customers: { eyebrow: 'Business records', title: 'Customers', description: 'Keep the minimum customer information needed to support an auditable job.' },
  jobs: { eyebrow: 'Work queue', title: 'Service jobs', description: 'A record of intent, device binding, evidence, and outcome.' },
  certificates: { eyebrow: 'Evidence output', title: 'Certificates', description: 'Only issue a certificate when the evidence supports the stated result.' },
  subscription: { eyebrow: 'Workspace controls', title: 'Subscription & workstations', description: 'Licensing is separate from device security and manufacturer restrictions.' },
  settings: { eyebrow: 'System preferences', title: 'Settings', description: 'Local-first defaults, privacy, retention, and toolchain readiness.' },
};

function App() {
  const [view, setView] = useState<ViewKey>('dashboard');
  const [selectedId, setSelectedId] = useState(devices[0].id);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [runtime, setRuntime] = useState<RuntimeInfo | null>(null);
  const selectedDevice = devices.find((device) => device.id === selectedId) ?? devices[0];
  const meta = viewMeta[view];

  useEffect(() => {
    void getRuntimeInfo().then(setRuntime);
  }, []);

  const scanDevices = async () => {
    setNotice('Scanning with official ADB/Fastboot tools…');
    const inventory = await listConnectedDevices();
    if (!inventory) {
      setNotice('Device scanning is available in the desktop app. Browser Preview cannot access USB tools.');
      return;
    }
    setNotice(inventory.devices.length > 0
      ? `Scan complete: ${inventory.devices.length} device${inventory.devices.length === 1 ? '' : 's'} detected (${inventory.devices.map((device) => `${device.serial} / ${device.mode}`).join(', ')}).`
      : `Scan complete: no devices detected. ${inventory.warnings.join(' ')}`);
  };

  const runDiagnostics = async () => {
    setNotice('Running non-destructive runtime and toolchain diagnostics…');
    const [info, inventory] = await Promise.all([getRuntimeInfo(), listConnectedDevices()]);
    if (!info || !inventory) {
      setNotice('Diagnostics require the installed desktop app; Browser Preview cannot inspect the local toolchain.');
      return;
    }
    setNotice(`Diagnostics complete: SQLite ready, ADB ${info.adbAvailable ? 'available' : 'missing'}, Fastboot ${info.fastbootAvailable ? 'available' : 'missing'}, ${inventory.devices.length} device${inventory.devices.length === 1 ? '' : 's'} visible. No device mutation was attempted.`);
  };

  const importFirmware = async (file: File) => {
    setNotice(`Verifying ${file.name}…`);
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
    const checksum = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    setNotice(`Imported ${file.name} for local review. SHA-256: ${checksum}. Signature status: not evaluated. No device deployment was attempted.`);
  };

  const go = (next: ViewKey) => {
    setView(next);
    setNotice('');
  };

  const requestAction = (label: string) => {
    setNotice(`${label} is not enabled in this MVP. No device command was sent.`);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup" onClick={() => go('dashboard')} role="button" tabIndex={0}>
          <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
          <div><strong>PHOENIX</strong><small>service workstation</small></div>
        </div>
        <div className="workspace-selector"><span className="status-dot live" /> <span>Workshop / Nairobi</span><span className="chevron">⌄</span></div>
        <nav className="main-nav" aria-label="Primary navigation">
          {(['work', 'records', 'system'] as const).map((group) => (
            <div className="nav-group" key={group}>
              <div className="nav-group-label">{group === 'work' ? 'WORKSPACE' : group === 'records' ? 'RECORDS' : 'SYSTEM'}</div>
              {navItems.filter((item) => item.group === group).map((item) => (
                <button className={`nav-item ${view === item.key ? 'active' : ''}`} key={item.key} onClick={() => go(item.key)}>
                  <span className="nav-icon">{item.icon}</span><span>{item.label}</span>
                  {item.key === 'devices' && <span className="nav-count">3</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="connection-card"><div className="eyebrow">LOCAL ENGINE</div><div className="engine-line"><span className={`status-dot ${runtime ? 'live' : 'amber-dot'}`} /> {runtime ? 'Native runtime connected' : 'Browser preview / sample mode'}</div><div className="muted tiny">{runtime ? `${runtime.adbAvailable ? 'ADB' : 'No ADB'} · ${runtime.fastbootAvailable ? 'Fastboot' : 'No Fastboot'}` : 'No USB commands are active'}</div></div>
          <div className="profile-row"><div className="avatar">MO</div><div><strong>M. Otieno</strong><span>Technician</span></div><button className="icon-button" aria-label="Open profile">•••</button></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs"><span>PHOENIX</span><b>/</b><span className="current-crumb">{meta.title.toUpperCase()}</span></div>
          <div className="topbar-actions"><div className="sync-status"><span className="status-dot live" /> Local workspace <span className="divider" /> <span className="muted">Synced just now</span></div><button className="icon-button bell" aria-label="Notifications">♢<span /></button><button className="help-button">? <span>Help</span></button></div>
        </header>

        <div className="content-wrap">
          <section className="page-heading"><div><div className="eyebrow amber">{meta.eyebrow}</div><h1>{meta.title}</h1><p>{meta.description}</p></div><div className="heading-actions"><span className="sample-badge"><span className="status-dot amber-dot" /> SAMPLE DATA</span>{view === 'dashboard' && <button className="button ghost" onClick={() => requestAction('Connect device')}>+ Connect device</button>}</div></section>
          {notice && <div className="notice-banner"><span className="notice-mark">i</span><span>{notice}</span><button onClick={() => setNotice('')}>×</button></div>}
          {view === 'dashboard' && <Dashboard onNavigate={go} onAction={requestAction} />}
          {view === 'devices' && <Devices selectedDevice={selectedDevice} selectedId={selectedId} setSelectedId={setSelectedId} query={query} setQuery={setQuery} onAction={requestAction} onScan={scanDevices} />}
          {view === 'firmware' && <FirmwareLibrary onAction={requestAction} onImport={importFirmware} />}
          {view === 'jobs' && <Jobs onAction={requestAction} />}
          {view === 'diagnostics' && <Diagnostics onAction={requestAction} onRun={runDiagnostics} />}
          {(['eraser', 'recovery', 'os-manager', 'certificates', 'customers', 'subscription', 'settings'] as ViewKey[]).includes(view) && <PlaceholderView view={view} onAction={requestAction} />}
        </div>
      </main>
    </div>
  );
}

function Dashboard({ onNavigate, onAction }: { onNavigate: (view: ViewKey) => void; onAction: (label: string) => void }) {
  return <>
    <section className="metrics-grid">
      <Metric label="CONNECTED DEVICES" value="3" delta="sample records" accent="amber" action={() => onNavigate('devices')} />
      <Metric label="ACTIVE JOBS" value="01" delta="1 awaiting evidence" accent="blue" action={() => onNavigate('jobs')} />
      <Metric label="COMPLETED TODAY" value="12" delta="sample history" accent="mint" action={() => onNavigate('jobs')} />
      <Metric label="NEEDS ATTENTION" value="02" delta="review before action" accent="red" action={() => onNavigate('diagnostics')} />
    </section>
    <div className="dashboard-grid">
      <section className="panel device-panel"><PanelHeader eyebrow="LIVE INVENTORY" title="Connected devices" action="View all" onClick={() => onNavigate('devices')} /><div className="device-list">{devices.map((device) => <DeviceRow key={device.id} device={device} />)}</div><div className="panel-footer"><span className="muted">Sample records shown · native USB monitor not enabled</span><button className="text-button" onClick={() => onAction('Native USB monitor')}>Why?</button></div></section>
      <section className="panel readiness-panel"><PanelHeader eyebrow="SYSTEM READINESS" title="Safe to operate" /><div className="readiness-score"><div className="score-ring"><strong>82</strong><span>/100</span></div><div><strong>Preflight posture</strong><p>Good foundation. Two records need evidence before a technician can proceed.</p></div></div><div className="readiness-list"><Readiness label="Target identity" status="ready" detail="3 scoped devices" /><Readiness label="Native tools" status="planned" detail="ADB / Fastboot adapter" /><Readiness label="Destructive operations" status="blocked" detail="Disabled in MVP" /></div></section>
      <section className="panel jobs-panel"><PanelHeader eyebrow="RECENT ACTIVITY" title="Service jobs" action="Open queue" onClick={() => onNavigate('jobs')} /><div className="job-list">{jobs.slice(0, 3).map((job) => <JobRow key={job.id} job={job} />)}</div></section>
      <section className="panel audit-panel"><PanelHeader eyebrow="AUDIT TRAIL" title="Latest events" action="Export log" onClick={() => onAction('Diagnostic export')} /><div className="audit-list">{audit.map(([time, event, ref, who]) => <div className="audit-row" key={`${time}-${event}`}><time>{time}</time><div><strong>{event}</strong><span>{ref} · {who}</span></div><span className="audit-chevron">›</span></div>)}</div><div className="panel-footer"><span className="muted">Privacy-conscious log · no credentials or personal data</span></div></section>
    </div>
  </>;
}

function Devices({ selectedDevice, selectedId, setSelectedId, query, setQuery, onAction, onScan }: { selectedDevice: Device; selectedId: string; setSelectedId: (id: string) => void; query: string; setQuery: (query: string) => void; onAction: (label: string) => void; onScan: () => void }) {
  const filtered = devices.filter((device) => `${device.manufacturer} ${device.model} ${device.serial}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="devices-layout"><section className="panel devices-index"><div className="toolbar"><div className="search-field"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search devices, serials, codenames" /></div><button className="button ghost" onClick={onScan}>Scan now</button></div><div className="list-header"><span>DEVICE / IDENTITY</span><span>MODE</span><span>STATUS</span></div>{filtered.map((device) => <button className={`device-index-row ${selectedId === device.id ? 'selected' : ''}`} key={device.id} onClick={() => setSelectedId(device.id)}><div className="device-leading"><div className="device-glyph">{device.manufacturer.slice(0, 1)}</div><div><strong>{device.manufacturer} {device.model}</strong><span>{device.id} · {device.codename}</span></div></div><div><strong>{device.mode}</strong><span>{device.connection}</span></div><div><StatusPill status={device.status} /></div></button>)}{filtered.length === 0 && <div className="empty-state">No sample devices match that search.</div>}<div className="panel-footer"><span className="muted">Identity binding is required before any future operation.</span></div></section><DeviceDetail device={selectedDevice} onAction={onAction} /></div>;
}

function DeviceDetail({ device, onAction }: { device: Device; onAction: (label: string) => void }) {
  return <section className="device-detail"><div className="detail-hero"><div className="hero-device-icon">{device.manufacturer.slice(0, 1)}</div><div><div className="eyebrow amber">{device.id} · {device.lastSeen}</div><h2>{device.manufacturer} {device.model}</h2><div className="hero-subline"><span>{device.codename}</span><span className="dot-separator" /> <span>{device.mode}</span><ProvenanceChip value={device.provenance} /></div></div><button className="icon-button detail-menu">•••</button></div><div className="detail-alert"><span className="alert-icon">!</span><div><strong>Sample record — not a connected device</strong><p>{device.note}</p></div></div><div className="fact-section"><div className="section-title-row"><div><div className="eyebrow">IDENTITY & CONNECTION</div><h3>What Phoenix knows</h3></div><span className="confidence-tag">{device.confidence}</span></div><div className="facts-grid"><Fact label="Serial number" value={device.serial} mono provenance={device.provenance} /><Fact label="Connection" value={device.connection} provenance={device.provenance} /><Fact label="Android version" value={device.android} provenance={device.android === 'Unavailable' ? 'UNAVAILABLE' : device.provenance} /><Fact label="Architecture" value={device.architecture} provenance={device.architecture === 'Unavailable' ? 'UNAVAILABLE' : device.provenance} /><Fact label="Storage" value={device.storage} provenance={device.storage === 'Unavailable' ? 'UNAVAILABLE' : device.provenance} /><Fact label="Battery" value={device.battery} provenance={device.battery === 'Unavailable' ? 'UNAVAILABLE' : device.provenance} /></div></div><div className="fact-section"><div className="section-title-row"><div><div className="eyebrow">PROTOCOL POSTURE</div><h3>Available paths</h3></div></div><div className="protocol-row"><Protocol label="ADB" value={device.adb} state={device.adb === 'Authorized' ? 'ready' : 'blocked'} /><Protocol label="Fastboot" value={device.mode.includes('Fastboot') ? 'Detected' : 'Not detected'} state={device.mode.includes('Fastboot') ? 'ready' : 'planned'} /><Protocol label="Bootloader" value={device.bootloader} state={device.bootloader === 'Unavailable' ? 'blocked' : 'planned'} /></div></div><div className="detail-actions"><button className="button primary" onClick={() => onAction('Device diagnostics')}>Run diagnostics <span>→</span></button><button className="button ghost" onClick={() => onAction('Device action menu')}>View compatible operations</button></div><div className="detail-note"><span>i</span><p>Operations only appear after a compatibility profile confirms the exact model, mode, prerequisites, and evidence path. Security controls are never bypassed.</p></div></section>;
}

function FirmwareLibrary({ onAction, onImport }: { onAction: (label: string) => void; onImport: (file: File) => void }) {
  return <div className="stack-layout"><section className="panel"><div className="toolbar"><div><div className="eyebrow">CATALOGUE STATUS</div><h3>Official image records</h3></div><label className="button primary">+ Import image<input type="file" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) onImport(file); event.currentTarget.value = ''; }} /></label></div><div className="firmware-table"><div className="table-header"><span>IMAGE / DEVICE</span><span>INTEGRITY</span><span>COMPATIBILITY</span><span>RELEASED</span></div>{firmware.map((item) => <FirmwareRow key={item.name} item={item} />)}</div><div className="panel-footer"><span className="muted">Local SHA-256 verification is active · signature evaluation and deployment remain disabled</span><button className="text-button" onClick={() => onAction('Firmware verification')}>Verification policy ↗</button></div></section><section className="two-column"><InfoCard eyebrow="SOURCE DISCIPLINE" title="Official before convenient" body="Every image record keeps its source URL, release version, publication date, checksum state, and signature state. The UI never silently substitutes a different model or variant." /><InfoCard eyebrow="SAFE BOUNDARY" title="Integrity before deployment" body="Phoenix can now hash a local file for review. It still will not flash or deploy an image, and signatures are explicitly marked as not evaluated." /></section></div>;
}

function Jobs({ onAction }: { onAction: (label: string) => void }) {
  return <div className="stack-layout"><section className="panel"><div className="toolbar"><div><div className="eyebrow">LOCAL HISTORY</div><h3>Service job queue</h3></div><div className="toolbar-actions"><button className="button ghost" onClick={() => onAction('Export jobs')}>Export</button><button className="button primary" onClick={() => onAction('Create service job')}>+ New job</button></div></div><div className="job-table"><div className="table-header job-cols"><span>JOB</span><span>WORKFLOW</span><span>DEVICE</span><span>STATUS</span><span>UPDATED</span></div>{jobs.map((job) => <div className="job-table-row job-cols" key={job.id}><div><strong>{job.id}</strong><span>{job.operator}</span></div><div><strong>{job.type}</strong><span>{job.detail}</span></div><div><strong>{job.device}</strong><span>Identity bound</span></div><div><StatusPill status={job.status} /><div className="mini-progress"><span style={{ width: `${job.progress}%` }} /></div></div><time>{job.timestamp}</time></div>)}</div></section><div className="notice-panel"><div className="notice-mark">i</div><div><strong>Jobs are evidence containers, not command runners.</strong><p>A job can record intent and results, but this MVP cannot mutate a connected device. Future destructive steps must be separately confirmed and verified.</p></div></div></div>;
}

function Diagnostics({ onAction, onRun }: { onAction: (label: string) => void; onRun: () => void }) {
  const tests = [['Identity snapshot', 'Automated', 'ready', 'Uses the connection profile and known catalogue evidence.'], ['ADB authorization', 'Automated when exposed', 'attention', 'The sample Pixel is authorized; other modes may not expose this state.'], ['Display / camera / sensors', 'Technician-assisted', 'planned', 'Requires a human inspection path and recorded result.'], ['Battery health', 'Unavailable in browser MVP', 'blocked', 'Do not infer hardware health from a missing protocol.']];
  return <div className="stack-layout"><section className="panel"><div className="toolbar"><div><div className="eyebrow">EVIDENCE COLLECTION</div><h3>Diagnostic plan</h3></div><button className="button primary" onClick={onRun}>Run selected tests</button></div><div className="diagnostic-list">{tests.map(([name, mode, state, detail]) => <div className="diagnostic-row" key={name}><div className="check-box">{state === 'ready' ? '✓' : ''}</div><div className="diagnostic-copy"><strong>{name}</strong><span>{mode}</span><p>{detail}</p></div><StatusPill status={state as Status} /></div>)}</div><div className="panel-footer"><span className="muted">Runtime/toolchain checks produce an in-app result; physical inspection remains technician-assisted.</span><button className="text-button" onClick={() => onAction('Diagnostic export')}>Export diagnostic bundle</button></div></section><section className="two-column"><InfoCard eyebrow="GRADING" title="Condition, not guesswork" body="Refurbishment grading should combine reliable automated evidence with a technician's recorded inspection. Missing data stays missing." /><InfoCard eyebrow="PRIVACY" title="Keep the log useful" body="Logs capture operation state and evidence references, not credentials, tokens, private keys, or unnecessary customer data." /></section></div>;
}

function PlaceholderView({ view, onAction }: { view: ViewKey; onAction: (label: string) => void }) {
  const content: Record<string, { label: string; title: string; body: string; action: string }> = {
    eraser: { label: 'SAFE SANITIZATION', title: 'Plan a method before touching data', body: 'Clear, purge, and destroy are different outcomes. This MVP can explain the policy, but cannot execute a sanitization method or issue a verified certificate.', action: 'Start erasure assessment' },
    recovery: { label: 'OFFICIAL PATHS ONLY', title: 'Recovery without bypass', body: 'Use manufacturer recovery documentation, authorized ADB assistance, and ownership records. FRP, Activation Lock, and lock-screen bypasses are not supported.', action: 'Review recovery checklist' },
    'os-manager': { label: 'DEVICE-SPECIFIC DEPLOYMENT', title: 'Match the image to the hardware', body: 'OS deployment stays planned until exact model, codename, variant, prerequisites, checksums, signatures, and post-operation verification are all available.', action: 'Open preflight checklist' },
    certificates: { label: 'EVIDENCE OUTPUT', title: 'No certificate without evidence', body: 'A normal factory reset is not verified sanitization. Certificate generation remains disabled until an evidence-backed workflow exists.', action: 'Review certificate policy' },
    customers: { label: 'MINIMUM DATA', title: 'Customer records stay lean', body: 'The future customer workspace will store only the identity and authorization evidence needed for the job, with configurable retention.', action: 'Plan customer record' },
    subscription: { label: 'LOCAL-FIRST LICENSING', title: 'Entitlements never override safety', body: 'Plans, workstation activation, grace periods, and organization roles are planned. Device security controls remain independent of subscription status.', action: 'Review licensing model' },
    settings: { label: 'WORKSTATION DEFAULTS', title: 'Make safe behavior the default', body: 'Configure retention, privacy-conscious logging, tool paths, update channels, and offline policy when the native workstation layer is connected.', action: 'Review settings' },
  };
  const item = content[view];
  return <div className="empty-workspace"><div className="empty-orbit"><span>◈</span></div><div className="eyebrow amber">{item.label}</div><h2>{item.title}</h2><p>{item.body}</p><div className="empty-actions"><button className="button primary" onClick={() => onAction(item.action)}>{item.action} <span>→</span></button><span className="planned-tag">PLANNED / SAFE PREVIEW</span></div><div className="empty-footnote">This screen is an honest workflow shell. It does not imply that the underlying native operation is implemented.</div></div>;
}

function Metric({ label, value, delta, accent, action }: { label: string; value: string; delta: string; accent: string; action: () => void }) { return <button className={`metric-card ${accent}`} onClick={action}><span className="metric-label">{label}</span><strong>{value}</strong><span className="metric-delta">{delta} <b>↗</b></span></button>; }
function PanelHeader({ eyebrow, title, action, onClick }: { eyebrow: string; title: string; action?: string; onClick?: () => void }) { return <div className="panel-header"><div><div className="eyebrow">{eyebrow}</div><h3>{title}</h3></div>{action && <button className="text-button" onClick={onClick}>{action} ↗</button>}</div>; }
function DeviceRow({ device }: { device: Device }) { return <div className="device-row"><div className="device-leading"><div className="device-glyph">{device.manufacturer.slice(0, 1)}</div><div><strong>{device.manufacturer} {device.model}</strong><span>{device.id} · {device.serial}</span></div></div><div className="device-mode"><span className="status-dot live" />{device.mode}<small>{device.connection}</small></div><StatusPill status={device.status} /></div>; }
function JobRow({ job }: { job: Job }) { return <div className="job-row"><div className="job-marker"><span /></div><div className="job-copy"><strong>{job.type}</strong><span>{job.device} · {job.id}</span></div><div className="job-status"><StatusPill status={job.status} /><span>{job.progress}%</span></div></div>; }
function Readiness({ label, status, detail }: { label: string; status: Status; detail: string }) { return <div className="readiness-row"><div><strong>{label}</strong><span>{detail}</span></div><StatusPill status={status} /></div>; }
function Fact({ label, value, provenance, mono = false }: { label: string; value: string; provenance: Provenance; mono?: boolean }) { return <div className="fact"><span>{label}</span><strong className={mono ? 'mono' : ''}>{value}</strong><ProvenanceChip value={provenance} /></div>; }
function Protocol({ label, value, state }: { label: string; value: string; state: Status }) { return <div className="protocol"><div className="protocol-icon">{label.slice(0, 1)}</div><div><strong>{label}</strong><span>{value}</span></div><StatusPill status={state} /></div>; }
function FirmwareRow({ item }: { item: Firmware }) { return <div className="firmware-row"><div><strong>{item.name}</strong><span>{item.device} · {item.version}</span></div><div><strong>{item.checksum}</strong><span>{item.signature}</span></div><StatusPill status={item.status} /><time>{item.published}</time></div>; }
function InfoCard({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) { return <section className="panel info-card"><div className="eyebrow amber">{eyebrow}</div><h3>{title}</h3><p>{body}</p><span className="info-line">PHOENIX POLICY <b>↗</b></span></section>; }
function ProvenanceChip({ value }: { value: Provenance }) { return <span className={`provenance ${value.toLowerCase()}`}>{value}</span>; }
function StatusPill({ status }: { status: Status | string }) { const label = status === 'ready' ? 'Ready' : status === 'attention' ? 'Attention' : status === 'blocked' ? 'Blocked' : status === 'complete' ? 'Complete' : 'Planned'; return <span className={`status-pill ${status}`}><i />{label}</span>; }

export default App;
