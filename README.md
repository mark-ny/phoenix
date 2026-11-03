# Project Phoenix

Project Phoenix is a desktop-style workstation for authorized mobile-device servicing. It now includes a Tauri 2 native desktop shell around the React + TypeScript workstation UI, with Windows NSIS/MSI bundle configuration and a narrow Rust command boundary for future USB/device adapters.

## Current status

Implemented in this milestone:

- Dark desktop workstation shell and primary navigation.
- Sample device intelligence, compatibility, firmware/image metadata, jobs, diagnostics, audit, and safe workflow surfaces.
- Tauri 2 desktop window configuration with Windows bundle targets.
- Rust commands for runtime information and an explicitly empty native device inventory.
- Browser-safe fallback so the hosted Preview remains functional.
- Honest provenance and availability labels throughout.

Not implemented:

- Real USB monitoring, ADB/Fastboot execution, firmware download/flash, destructive erasure, bootloader unlocking, password recovery, FRP/Activation Lock bypass, credential extraction, and exploit-based access.
- Local SQLite persistence, cloud accounts, subscriptions, PDF certificates, and physical-device validation.

## Development

```bash
pnpm install
pnpm dev              # browser Preview
pnpm desktop:dev      # Tauri desktop development window
pnpm build            # frontend production build
pnpm desktop:build    # Windows/Linux desktop bundle, on a native Tauri toolchain
```

The current sandbox has Node and pnpm but no Rust/Cargo or Windows packaging toolchain. The native shell configuration and Rust boundary are committed; run `pnpm desktop:build` on Windows to produce an installer.

## Safety position

USB connection alone must never trigger a destructive operation. Any future destructive operation must identify a stable target, explain consequences, validate prerequisites, require explicit confirmation, execute with structured progress, verify the outcome, and save evidence. The current shell does none of those device mutations and never claims that it did.
