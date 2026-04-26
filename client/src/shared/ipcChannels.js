// Mirror of desktop/ipcChannels.js for use in React components.
// Keep these strings in sync with the desktop file.
export const IPC = {
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
};
