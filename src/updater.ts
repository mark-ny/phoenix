import { check } from '@tauri-apps/plugin-updater';
import { isDesktopShell } from './native';

export async function installAvailableUpdate(): Promise<string> {
  if (!isDesktopShell()) {
    return 'Updates are available from the installed desktop app, not Browser Preview.';
  }

  try {
    const update = await check({ timeout: 30_000 });
    if (!update) return 'Phoenix is up to date.';
    await update.downloadAndInstall((event) => {
      if (event.event === 'Started') console.info(`Downloading Phoenix ${update.version}`);
      if (event.event === 'Finished') console.info('Phoenix update downloaded');
    });
    return `Phoenix ${update.version} installed. The app will restart to finish updating.`;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('REPLACE_WITH_TAURI_PUBLIC_KEY')) {
      return 'Updater is not configured yet. Add the Tauri public key to tauri.conf.json and the private key to GitHub Actions Secrets.';
    }
    return `Update check failed: ${message}`;
  }
}
