# Windows installer

The repository now contains a repeatable Windows packaging path:

```powershell
pnpm install --frozen-lockfile
./scripts/package-windows.ps1
```

The script builds the Tauri NSIS installer, copies it to `release-output/Phoenix-Pro-Setup.exe`, optionally copies the MSI package, and writes a SHA-256 sidecar file for every artifact. Tauri's NSIS bundle provides the standard installation-directory selection, Start Menu integration, uninstall support, upgrade handling, and install progress/completion flow. The Windows-specific config installs WebView2 through Microsoft's official bootstrapper when it is missing, bundles the MSVC runtime, rejects downgrades, uses the Phoenix icon, and includes the provisional preview license.

The GitHub Actions workflow at `.github/workflows/windows-installer.yml` runs when a GitHub Release is published, builds on `windows-latest`, and uploads the installer and checksum files to that release.

For one-click in-app updates triggered by pushed version tags, follow [the updater setup guide](./updater.md). It requires a Tauri signing key pair and two GitHub Actions secrets.

This is packaging automation, not evidence that the product is ready for production. The installer has not been tested in this Linux sandbox on clean Windows machines. Before a production release, verify installation, launch, upgrade, uninstall/data preservation, WebView2 behavior, code signing, and USB/ADB/Fastboot operation on a documented Windows test matrix.
