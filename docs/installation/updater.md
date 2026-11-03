# Phoenix Pro in-app updates

Phoenix uses Tauri's signed updater. The app does not rebuild source code on the user's computer. Instead, GitHub Actions builds signed Windows artifacts when a version tag is pushed, publishes them to a GitHub Release, and the app's **Check for updates** button downloads and installs the newer signed release.

## One-time signing setup

On a trusted machine, generate the Tauri signing key pair:

```powershell
pnpm.cmd exec tauri signer generate -w "$HOME\.tauri\phoenix.key"
```

Keep the private key file and its password safe. Never commit it or paste it into chat. Copy the generated public key into `src-tauri/tauri.conf.json`, replacing `REPLACE_WITH_TAURI_PUBLIC_KEY`.

In GitHub, open **Settings → Secrets and variables → Actions** and add:

- `TAURI_SIGNING_PRIVATE_KEY`: the contents of the private key file.
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: the password used when generating the key, or an empty secret if no password was chosen.

The repository is public, so the updater can use:

```text
https://github.com/mark-ny/phoenix/releases/latest/download/latest.json
```

## Publishing an update

Before creating a tag, update the `version` in `src-tauri/tauri.conf.json` to a version higher than the installed version. Commit and push that change. Then push a matching tag:

```powershell
git add src-tauri/tauri.conf.json
git commit -m "Release Phoenix Pro 0.2.0"
git push origin main
git tag v0.2.0
git push origin v0.2.0
```

GitHub Actions creates the release, builds the NSIS and MSI installers, creates the signed updater artifacts and `latest.json`, and uploads them to the release. Installed Phoenix users can click **Check for updates** and install the signed update without opening terminals.

The updater cannot work until the public key is placed in the config and the private-key secrets are configured in GitHub Actions. A missing or invalid signature is rejected rather than installed.

## Official references

- Tauri updater plugin: https://v2.tauri.app/plugin/updater/
- Tauri updater JavaScript API: https://v2.tauri.app/reference/javascript/updater/
- Tauri GitHub Actions releases: https://v2.tauri.app/distribute/pipelines/github/
