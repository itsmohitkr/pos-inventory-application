// Chromium discovery and on-demand install for WhatsApp.
//
// We use chrome-headless-shell (~150 MB) instead of full Chrome (~600 MB) since
// WhatsApp Web only needs a rendering engine — not the browser UI. Downloaded
// to {userData}/puppeteer-cache/ so it persists across app updates and is
// scoped per-user, not per-machine.

const fs = require('fs');
const path = require('path');
const browsers = require('@puppeteer/browsers');
const { PUPPETEER_REVISIONS } = require('puppeteer-core/internal/revisions.js');
const logger = require('../../shared/utils/logger');

const BROWSER = browsers.Browser.CHROMEHEADLESSSHELL;
const BUILD_ID = PUPPETEER_REVISIONS['chrome-headless-shell'];

// Where Puppeteer's @puppeteer/browsers caches downloads. desktop/main.js sets
// PUPPETEER_CACHE_DIR to {userData}/puppeteer-cache so installs survive app
// updates. Falls back to a tmp dir in test/dev when the env var isn't set.
function getCacheDir() {
  return process.env.PUPPETEER_CACHE_DIR || path.join(require('os').tmpdir(), 'trovix-puppeteer');
}

// Tracks an in-progress install so concurrent UI polls / button clicks don't
// kick off duplicate downloads. install() is idempotent across processes via
// @puppeteer/browsers' lockfile, but we still want a clean per-process gate.
let installState = {
  inProgress: false,
  progress: 0, // 0–100
  bytesDownloaded: 0,
  bytesTotal: 0,
  error: null,
};

// Returns the path to an installed chrome-headless-shell, or null if not present.
// We check the filesystem directly rather than calling getInstalledBrowsers(),
// because that helper is async and we want a synchronous check for status polling.
function getInstalledExecutablePath() {
  try {
    const cacheDir = getCacheDir();
    if (!fs.existsSync(cacheDir)) return null;
    const exePath = browsers.computeExecutablePath({
      cacheDir,
      browser: BROWSER,
      buildId: BUILD_ID,
    });
    return fs.existsSync(exePath) ? exePath : null;
  } catch (err) {
    logger.warn({ err: err.message }, '[CHROMIUM] Failed to compute executable path');
    return null;
  }
}

function isInstalled() {
  return getInstalledExecutablePath() !== null;
}

function getInstallStatus() {
  if (isInstalled() && !installState.inProgress) {
    return { status: 'ready', progress: 100, error: null };
  }
  if (installState.inProgress) {
    return {
      status: 'installing',
      progress: installState.progress,
      bytesDownloaded: installState.bytesDownloaded,
      bytesTotal: installState.bytesTotal,
      error: null,
    };
  }
  if (installState.error) {
    return { status: 'error', progress: 0, error: installState.error };
  }
  return { status: 'missing', progress: 0, error: null };
}

// Kicks off a download. Resolves when complete; subsequent calls while one is
// in progress are no-ops (return the existing promise). UI polls
// getInstallStatus() to render progress.
let activeInstall = null;

async function installBrowser() {
  if (activeInstall) return activeInstall;

  if (isInstalled()) {
    return getInstalledExecutablePath();
  }

  installState = { inProgress: true, progress: 0, bytesDownloaded: 0, bytesTotal: 0, error: null };

  activeInstall = (async () => {
    try {
      const cacheDir = getCacheDir();
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      logger.info({ cacheDir, browser: BROWSER, buildId: BUILD_ID }, '[CHROMIUM] Installing...');

      const installed = await browsers.install({
        cacheDir,
        browser: BROWSER,
        buildId: BUILD_ID,
        downloadProgressCallback: (downloadedBytes, totalBytes) => {
          installState.bytesDownloaded = downloadedBytes;
          installState.bytesTotal = totalBytes;
          installState.progress = totalBytes > 0
            ? Math.min(100, Math.round((downloadedBytes / totalBytes) * 100))
            : 0;
        },
      });

      installState.progress = 100;
      installState.inProgress = false;
      logger.info({ path: installed.executablePath }, '[CHROMIUM] Install complete');
      return installed.executablePath;
    } catch (err) {
      installState.inProgress = false;
      installState.error = err.message || 'Browser install failed';
      logger.error({ err: err.message }, '[CHROMIUM] Install failed');
      throw err;
    } finally {
      activeInstall = null;
    }
  })();

  return activeInstall;
}

module.exports = {
  isInstalled,
  getInstalledExecutablePath,
  getInstallStatus,
  installBrowser,
};
