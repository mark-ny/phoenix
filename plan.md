# Project Phoenix — Phase 0 Plan

## Scope

Project Phoenix is a desktop-style web prototype for the first public MVP of a Windows-oriented mobile-device servicing workstation. This implementation focuses on the technician workflow and honest system boundaries: device inventory and identification, compatibility lookup, firmware/image metadata and verification states, service history, logs/export affordances, and guarded future-operation surfaces. It does not execute USB commands, destructive erasure, firmware flashing, bootloader unlocking, password recovery, FRP bypass, Activation Lock bypass, credential extraction, or exploit-based access.

The UI will use clearly marked sample data so the prototype can be reviewed without implying that physical devices are connected. Any future operation that would alter a device stops at an unavailable/safety explanation state.

## Implementation approach

- Build a responsive React + TypeScript SPA with strict typing and a desktop-workstation layout.
- Keep product data in typed local fixtures and a small client-side state layer so the UI can later be replaced by Tauri/Rust commands and SQLite without changing the screen contracts.
- Model device facts with provenance (`verified`, `inferred`, `unavailable`) and model operations with explicit availability and safety reasons.
- Use a left navigation rail for the full product surface, with the dashboard as the primary screen and focused workspaces for USB devices, eraser, recovery, OS manager, firmware, diagnostics, customers, jobs, certificates, licensing, and settings.
- Use a staged safety drawer/modal for destructive-looking workflows. It identifies the exact target and explains the MVP limitation; it never reports execution or verification success.
- Keep the first build self-contained and offline-friendly. No cloud auth, database, payment provider, external firmware download, or real-device integration is enabled in this milestone.
- Add a route manifest and production build command so the app can be previewed and later published as a static artifact.

## Project structure

- `src/main.tsx` — application entry point.
- `src/App.tsx` — shell, navigation, route/view state, and workspace composition.
- `src/data/fixtures.ts` — typed sample devices, jobs, compatibility records, firmware packages, and audit events.
- `src/types.ts` — shared domain types and discriminated unions for availability/provenance.
- `src/styles.css` — design tokens, layout, responsive behavior, and component styling.
- `public/manus-routes.json` — declared page routes for the Webdev preview contract.
- `app.config.ts` — project metadata hook.
- `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `docs/` — product and engineering truth aligned to the implemented scope.

## Design read

- **Artifact:** desktop operations console / device-servicing dashboard.
- **Audience:** repair technicians, refurbishers, and lifecycle operators processing many devices daily.
- **Visual language:** industrial control-room calm with editorial clarity; more like a trusted service instrument than a consumer SaaS dashboard.
- **Mode:** greenfield, dark-first.
- **Visual variance:** 5/10.
- **Motion intensity:** 3/10.
- **Information density:** 8/10.
- **Asset dependence:** 1/10; this internal tool does not need decorative imagery.
- **Brand fidelity:** 4/10; codename-stage identity with a defined ownable signal color.

### Considered directions

1. **Instrument-panel noir — 0.06:** restrained charcoal surfaces, amber state accents, compact data rows, and deliberate operational language.
2. **Clinical systems blue — 0.04:** bright cyan/blue on slate with highly structured cards and a hospital-equipment tone.
3. **Workshop paper — 0.03:** warm gray canvas, red annotation marks, and dense ledger-inspired tables.

### Chosen direction: Instrument-panel noir

- **Design movement:** post-industrial control-room UI, refined with editorial hierarchy instead of sci-fi decoration.
- **Core principles:** evidence before confidence; calm under risk; dense but breathable; every action explains its consequence.
- **Color philosophy:** near-black graphite keeps attention on the device state; warm amber is the signature Phoenix signal for focus and queued work; mint means verified/healthy, red means blocked or attention required, and cool slate is reserved for neutral structure. The palette avoids blue-gradient “tech” defaults.
- **Layout paradigm:** persistent narrow navigation rail plus an asymmetrical command header and stacked evidence panels. The main workspace uses a wide primary column and a narrow operational rail rather than a uniform centered grid.
- **Signature elements:** amber “signal” underline on active navigation; provenance chips (`VERIFIED`, `SAMPLE`, `UNAVAILABLE`) attached to facts; monospaced device identifiers and operation timestamps.
- **Interaction philosophy:** hover and focus reveal context, not decoration. Risky actions are visually quiet but impossible to mistake; every unavailable action explains the missing capability.
- **Animation:** 140–220ms ease-out transitions for view changes and drawers; no looping decoration; progress indicators use a slow sweep only for active simulated UI states, never to imply real device progress.
- **Typography system:** `IBM Plex Sans` for UI copy, `IBM Plex Mono` for serials, versions, timestamps, and technical labels. Strong 12/14/16/24/32 hierarchy; compact uppercase labels for system metadata.
- **Brand essence:** a dependable evidence-first workstation for authorized mobile-device service — precise, candid, composed.
- **Brand voice:** concise and operational. Example lines: “No destructive operations are enabled in this MVP.” / “This record is sample data; connect a device to replace it with evidence.”
- **Wordmark & logo:** a small phoenix-feather signal mark formed by three rising amber bars beside the wordmark; in this prototype the mark is CSS-built as a UI glyph, not presented as a final commercial logo.
- **Signature brand color:** Phoenix Amber `#E8A64A`.

## Product boundaries

- Real USB monitoring and Tauri/Rust command execution are Phase 1 integration work, not simulated here.
- Device support claims are limited to visible sample catalogue entries and marked as sample/partially tested.
- Firmware verification is represented as metadata and status UI; no firmware file is downloaded, flashed, or cryptographically verified by this browser prototype.
- Sanitization, recovery, OS deployment, certificates, subscriptions, and settings screens are included as truthful workflow shells with disabled or planned states where the MVP cannot execute the underlying operation.

## Risks and unresolved decisions

| Risk / decision | Current treatment |
|---|---|
| Native USB and driver compatibility | Deferred to Tauri 2 + Rust Phase 1 adapter; browser UI exposes the future command boundary only. |
| Device identity safety after reconnect | UI requires explicit device selection; backend must bind jobs to stable identity and revalidate before execution. |
| Firmware provenance and redistribution | Prototype stores source/verification metadata only; official-source and licensing policy remains required. |
| Sanitization claims | No certificate issuance in this milestone; factory reset is not treated as verified sanitization. |
| Local encryption / SQLite | Architecture reserves a local persistence layer; SQLCipher vs OS-backed encryption remains an implementation decision for native Phase 1. |
| Cloud licensing and organizations | Not enabled; keep local workflow separable from future cloud entitlements. |
| Final commercial name and logo | Codename Project Phoenix retained until product naming is approved. |

## First-release acceptance criteria

The implemented slice is acceptable when:

- The application launches into a polished dark desktop workstation UI.
- Dashboard, USB Devices, Data Eraser, Device Recovery, OS Manager, Firmware Library, Diagnostics, Customers, Service Jobs, Certificates, Subscription and Workstations, and Settings are reachable from primary navigation.
- Sample data is visibly marked and no UI implies that a physical device is connected.
- Device details show identity, confidence/source, connection mode, protocol/authorization state, available facts, compatibility, prerequisites, warnings, history, and logs using provenance labels.
- Compatibility and operation states distinguish available, planned, unsupported, blocked, verified, sample, and unavailable information.
- Destructive-looking workflows explain target, consequences, prerequisites, and the MVP limitation, and cannot execute automatically or claim success.
- Firmware/image records expose source, version, checksum/signature status, compatibility, and verification limitations without pretending that a file was flashed.
- Service jobs, certificates, audit history, and diagnostic export surfaces communicate current and planned scope honestly.
- The project contains a route manifest, documentation, and a repeatable build command.

## Build workflow

1. Install the pinned Node toolchain and dependencies with reviewed lifecycle policy.
2. Run TypeScript diagnostics after each meaningful edit.
3. Run the production build and inspect the generated output.
4. Start the Preview service on the configured port and verify the route manifest endpoint.
5. Review the final source against this plan and TODO without inventing physical-device evidence.
6. Save a checkpoint once the implementation is buildable and documented.
