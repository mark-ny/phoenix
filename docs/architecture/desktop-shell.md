# Desktop shell

Project Phoenix now has a Tauri 2 desktop shell in `src-tauri/`. The React/Vite application remains the UI layer and is loaded from the built `dist/` directory. The shell is configured for a 1440×920 resizable workstation window, Windows NSIS/MSI bundle targets, and a narrow command boundary.

The initial Rust commands are deliberately safe: `runtime_info` reports the host runtime and `list_connected_devices` returns an empty inventory because no USB adapter is configured. They do not invoke ADB, Fastboot, SetupAPI, libusb, udev, or any destructive operation. Future native work must add platform adapters behind typed commands, stable identity binding, compatibility checks, authorization checks, structured logs, and physical-device tests.

## Local development

```bash
pnpm install
pnpm desktop:dev
```

## Windows packaging

Run `pnpm desktop:build` on a Windows development machine with Rust, the Microsoft C++ Build Tools, WebView2, and the Tauri CLI prerequisites installed. The current Linux sandbox can validate the web build but does not contain Rust or Windows packaging dependencies.
