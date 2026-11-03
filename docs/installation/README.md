# Installation

Project Phoenix now includes a Tauri 2 desktop shell. The browser preview remains available for UI review, while the desktop app loads the same React/Vite frontend in a native window.

For browser development, use Node with pnpm, install dependencies, and run `pnpm dev`.

For desktop development, install Rust and the platform prerequisites for Tauri 2, then run `pnpm desktop:dev`. For Windows packaging, use `pnpm desktop:build` on a Windows development machine with Microsoft C++ Build Tools and WebView2 available. The Linux sandbox can validate the frontend build and source configuration but does not produce a Windows installer.

Native device enumeration, ADB/Fastboot integration, signed firmware operations, and destructive workflows remain disabled until their platform adapters and physical-device test evidence are implemented.
