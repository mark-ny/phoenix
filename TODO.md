# Project Phoenix — TODO

## Desktop shell conversion

- [x] Add a Tauri 2 desktop shell that loads the React/Vite workstation UI in a resizable native window and is configured for Windows NSIS/MSI bundle targets.
- [x] Keep browser Preview functional with a browser-safe fallback and expose only narrow Rust commands for runtime information and an explicitly empty device inventory.
- [x] Add Windows-specific WebView2/MSVC/NSIS configuration, a provisional installer license, repeatable packaging/checksum scripts, and GitHub Actions release automation.
- [x] Add cross-platform local SQLite initialization, official ADB/Fastboot tool detection, non-destructive device-list parsing, and SHA-256/SHA-512 file verification commands.
- [ ] Install and validate the native Rust/Tauri toolchain on Windows, produce a real installer, and sign the release binary.
- [ ] Implement Windows USB/SetupAPI and Android ADB/Fastboot adapters behind the Rust command boundary after physical-device testing and security review.

## Release gates

- [x] Document the current release-readiness verdict and distinguish validated source/build checks from unverified Windows and physical-device behavior.
- [ ] Complete native device intelligence, persistence, firmware integrity, safe operation state machines, business records, and evidence-backed reporting before production release.
- [ ] Run the clean Windows install/launch/upgrade/uninstall matrix and physical-device test matrix before calling the installer production-ready.

## Delivered MVP workstation shell

- [x] Launch into a polished, professional desktop-style interface with a restrained dark theme, clear contrast, readable typography, consistent spacing, a persistent navigation rail, and responsive behavior.
- [x] Provide primary navigation for Dashboard, USB Devices, Data Eraser, Device Recovery, OS Manager, Firmware Library, Diagnostics, Customers, Service Jobs, Certificates, Subscription and Workstations, and Settings.
- [x] Clearly label seeded records as sample data; do not imply that sample records are currently connected physical devices.

## Device intelligence and compatibility surfaces

- [x] Show device identity, confidence/source, connection mode, available protocols and authorization status, available hardware/software facts, compatibility, prerequisites/warnings, operation history, logs, and verification-oriented evidence fields.
- [x] Distinguish verified facts, inferred information, unavailable information, sample data, planned support, and unsupported operations in the interface.
- [x] Support a multiple-device list and explicit device targeting in the UI so commands cannot be implied to target an ambiguous device.
- [ ] Implement real USB connection monitoring, connect/disconnect events, ADB/Fastboot tool detection, and device identification through Tauri 2/Rust adapters on Windows.

## Firmware and image catalogue

- [x] Provide a firmware/image library surface with device matching, source URL metadata, release/version information, checksum/signature status, compatibility status, and verification limitations.
- [x] Explain that this browser MVP does not download or flash firmware and never reports deployment success.
- [ ] Implement resumable official-source downloads, SHA-256/SHA-512 verification, signature verification where provided, exact-device preflight validation, disconnect detection, and post-operation verification after device-specific physical testing.

## Safe operation guardrails

- [x] Provide staged-looking Data Eraser, Device Recovery, and OS Manager workflows that identify an exact sample target, explain data-loss/security consequences, show prerequisites, and stop with a clear MVP safety boundary.
- [x] Add a customer-consent gate for Data Eraser and Device Recovery that captures customer name, exact device identifier, typed acknowledgement, explicit consent, creates a pending-admin-review request ID, and keeps the operation locked. Provide JSON export addressed to `markomodho@gmail.com` while automatic email delivery is not connected.
- [x] Do not enable commercial destructive erasure, firmware flashing, bootloader unlocking, password recovery, universal lock-screen bypasses, FRP bypass, Activation Lock bypass, credential extraction, or exploit-based access.
- [ ] Implement native operation state machines with stable device identity binding, revalidation, safe transitions, cancellation/timeout handling, structured logs, disconnect handling, and verified completion before activation.
- [x] Implement the testable local approval backend: SQLite approval requests, administrator PIN authentication, Ed25519-signed one-device/job-bound licenses, seven-day expiry validation, revocation, and audit events. The signing key is local-test infrastructure and must move to an offline/admin service before production use.

## Jobs, evidence, and business surfaces

- [x] Show sample service jobs, operation history, certificates/reporting status, diagnostics, audit history, customer records, workstation/subscription status, and settings as truthful MVP surfaces.
- [x] Provide a diagnostic-export affordance and explain when evidence is sample or unavailable.
- [ ] Implement configurable retention, PDF service reports, verified-sanitization certificates, and role-based organization separation; approval records and license/audit records now persist locally in SQLite.
- [ ] Connect approval-request export to authenticated Gmail/Outlook delivery or an equivalent backend mail relay; do not place mail credentials in the client.
- [ ] Implement cloud authentication, organization membership, subscriptions, workstation licensing, offline grace policy, and audited administration after local MVP validation.

## Documentation and engineering hygiene

- [x] Maintain README.md, CONTRIBUTING.md, SECURITY.md, architecture/security/device-support/installation/testing documentation, and CHANGELOG.md aligned with the actual implementation.
- [x] Provide a route manifest and repeatable build command.
- [ ] Add Rust unit/integration tests, frontend-to-Rust boundary tests, physical-device matrix coverage, corrupted/wrong-image rejection tests, disconnect/restart handling tests, tenant-isolation tests, and CI vulnerability/build checks as native phases are implemented.
