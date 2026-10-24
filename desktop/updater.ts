// Auto-update wiring for the packaged app.
//
// Beyond the startup check this does two things:
//
// 1. Re-checks periodically, so a shop that leaves Trovix open for days still
//    picks up a release. electron-updater only installs on quit, so the
//    download just waits for the next normal close.
//
// 2. Lets a release that fails to start repair itself. When startup fails,
//    the main window never appears, and electron-updater's install-on-quit
//    needs a quit the person cannot trigger from a window they cannot see
//    (killing the process does not run it). Worse, the invisible process keeps
//    the single-instance lock, so relaunching just focuses the hidden window.
//    recoverFromStartupFailure() therefore looks for a newer release, installs
//    it and relaunches if one downloads, and otherwise quits, so the shop is
//    never left with an app that can neither run nor update.
//
// Kept free of `electron` imports (everything comes in through deps) so it can
// be exercised with a fake updater outside Electron.
import type { AppUpdater } from 'electron-updater';
import IPC = require('./ipcChannels');

type Updater = Pick<
  AppUpdater,
  'on' | 'checkForUpdates' | 'checkForUpdatesAndNotify' | 'quitAndInstall'
>;

interface WindowLike {
  isDestroyed(): boolean;
  webContents: { send(channel: string, ...args: unknown[]): void };
}

export interface AutoUpdateDeps {
  updater: Updater;
  getWindow: () => WindowLike | null;
  quit: () => void;
  /** True once the main window is on screen, i.e. a slow boot recovered on its own. */
  isAppUsable: () => boolean;
  log: (message: string) => void;
  /** False in development: electron-updater has no feed to read there. */
  enabled: boolean;
  setTimeout?: (fn: () => void, ms: number) => unknown;
  clearTimeout?: (handle: unknown) => void;
  setInterval?: (fn: () => void, ms: number) => unknown;
}

export const FIRST_CHECK_DELAY_MS = 5_000;
export const PERIODIC_CHECK_MS = 4 * 60 * 60 * 1000;
/** A failed startup waits this long to learn whether a newer release exists. */
export const RECOVERY_CHECK_TIMEOUT_MS = 60_000;
/** ...and this long for it to download (a ~220 MB installer on a slow shop connection). */
export const RECOVERY_DOWNLOAD_TIMEOUT_MS = 15 * 60_000;

export interface AutoUpdate {
  recoverFromStartupFailure(): void;
}

export const initAutoUpdate = (deps: AutoUpdateDeps): AutoUpdate => {
  const later = deps.setTimeout ?? ((fn, ms) => setTimeout(fn, ms));
  const cancel = deps.clearTimeout ?? ((handle) => clearTimeout(handle as NodeJS.Timeout));
  const every = deps.setInterval ?? ((fn, ms) => setInterval(fn, ms));

  // An update has been found and is downloading or downloaded. Checking again
  // in that state would start a second download of the same file.
  let updatePending = false;
  let downloaded = false;
  let recovering = false;
  let deadline: unknown = null;

  const forward = (channel: string, ...args: unknown[]): void => {
    const window = deps.getWindow();
    if (window && !window.isDestroyed()) window.webContents.send(channel, ...args);
  };

  const runCheck = (check: () => Promise<unknown> | null): void => {
    try {
      // Failures also arrive as the 'error' event; this only stops them
      // becoming unhandled rejections.
      check()?.catch((err: unknown) => deps.log(`[Updater] check failed: ${String(err)}`));
    } catch (err) {
      deps.log(`[Updater] check threw: ${String(err)}`);
      if (recovering) endRecovery('the update check could not run');
    }
  };

  const clearDeadline = (): void => {
    if (deadline !== null) cancel(deadline);
    deadline = null;
  };

  const armDeadline = (ms: number, reason: string): void => {
    clearDeadline();
    deadline = later(() => endRecovery(reason), ms);
  };

  // Ends recovery without an update: quit, unless the app came up after all.
  const endRecovery = (reason: string): void => {
    clearDeadline();
    if (!recovering) return;
    recovering = false;
    if (deps.isAppUsable()) {
      deps.log(`[Updater] startup recovered on its own (${reason}); not quitting`);
      return;
    }
    deps.log(`[Updater] no fix available after startup failure (${reason}); quitting`);
    deps.quit();
  };

  const installNow = (): void => {
    clearDeadline();
    recovering = false;
    // A boot that finished late is in use: leave the download for the normal
    // install-on-quit instead of restarting under the cashier.
    if (deps.isAppUsable()) {
      deps.log('[Updater] update downloaded, app is running; installing on next quit');
      return;
    }
    deps.log('[Updater] installing downloaded update to recover from startup failure');
    deps.updater.quitAndInstall(true, true);
  };

  if (deps.enabled) {
    try {
      deps.updater.on('update-available', () => {
        updatePending = true;
        forward(IPC.UPDATE_AVAILABLE);
        if (recovering) armDeadline(RECOVERY_DOWNLOAD_TIMEOUT_MS, 'download timed out');
      });
      deps.updater.on('update-downloaded', () => {
        downloaded = true;
        forward(IPC.UPDATE_DOWNLOADED);
        if (recovering) installNow();
      });
      deps.updater.on('update-not-available', () => {
        forward(IPC.UPDATE_NOT_AVAILABLE);
        if (recovering) endRecovery('already on the latest version');
      });
      deps.updater.on('error', (err: Error) => {
        // A failed download can be retried by the next check.
        if (!downloaded) updatePending = false;
        forward(IPC.UPDATE_ERROR, err?.message);
        if (recovering) endRecovery(`updater error: ${err?.message}`);
      });
      deps.updater.on('download-progress', (progress: { percent: number }) => {
        forward(IPC.DOWNLOAD_PROGRESS, progress?.percent);
      });

      // Recovery runs its own check, so the scheduled ones stand aside meanwhile.
      const scheduledCheck = (): void => {
        if (!updatePending && !recovering) {
          runCheck(() => deps.updater.checkForUpdatesAndNotify());
        }
      };
      later(scheduledCheck, FIRST_CHECK_DELAY_MS);
      every(scheduledCheck, PERIODIC_CHECK_MS);
    } catch (err) {
      deps.log(`[Updater] setup failed: ${String(err)}`);
    }
  }

  return {
    recoverFromStartupFailure(): void {
      if (recovering) return;
      if (!deps.enabled) {
        if (!deps.isAppUsable()) deps.quit();
        return;
      }
      recovering = true;
      if (downloaded) {
        installNow();
        return;
      }
      if (updatePending) {
        deps.log('[Updater] startup failed while an update downloads; waiting for it');
        armDeadline(RECOVERY_DOWNLOAD_TIMEOUT_MS, 'download timed out');
        return;
      }
      deps.log('[Updater] startup failed; looking for an update that fixes it');
      armDeadline(RECOVERY_CHECK_TIMEOUT_MS, 'update check timed out');
      runCheck(() => deps.updater.checkForUpdates());
    },
  };
};
