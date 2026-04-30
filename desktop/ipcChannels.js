// Single source of truth for all IPC channel names.
// Import this in main.js (CommonJS) and mirror the same strings in
// client/src/shared/ipcChannels.js (ES module) so a typo in one place
// never silently breaks the other.
module.exports = {
  // Printer
  GET_PRINTERS: 'get-printers',
  PRINT_MANUAL: 'print-manual',
  PRINT_HTML_CONTENT: 'print-html-content',

  // App metadata
  GET_APP_VERSION: 'get-app-version',
  GET_APP_METADATA: 'get-app-metadata',
  GET_APP_PATH: 'get-app-path',

  // Auto-update (renderer → main)
  CHECK_FOR_UPDATES: 'check-for-updates',
  START_DOWNLOAD: 'start-download',
  RESTART_APP: 'restart-app',

  // Auto-update (main → renderer)
  UPDATE_AVAILABLE: 'update-available',
  UPDATE_DOWNLOADED: 'update-downloaded',
  UPDATE_NOT_AVAILABLE: 'update-not-available',
  UPDATE_ERROR: 'update-error',
  DOWNLOAD_PROGRESS: 'download-progress',

  // API bridge — generic IPC proxy from renderer to Express (production Electron only)
  API_BRIDGE: 'api-bridge',

  // Splash screen (main → splash renderer)
  SPLASH_STATUS: 'splash-status',
  SPLASH_VERSION: 'splash-version',
};
