# Automated Database Backup & Rotation Strategy

This document outlines the proposed implementation for an automated database backup system to prevent data loss and simplify recovery.

## Overview
The goal is to create a daily "snapshot" of the `pos.db` SQLite file. These snapshots will be stored in a user-accessible folder (ideally synced with OneDrive) with an automatic cleanup (retention) policy.

## Technical Architecture

### 1. Backup Location
*   **Default Path:** `%USERPROFILE%\Documents\BachatBazaar_Backups`
*   **Why:** Putting it in "Documents" ensures that most OneDrive/Google Drive configurations will automatically pick up the folder for cloud sync.

### 2. Implementation Logic (Electron Main Process)
The logic should reside in `desktop/main.js` and execute during the application bootstrap.

```javascript
const fs = require('fs');
const path = require('path');

async function performBackup(appDataPath, backupDir, retentionDays) {
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const dbPath = path.join(appDataPath, 'pos.db');
    const dateStr = new Date().toISOString().split('T')[0];
    const backupPath = path.join(backupDir, `backup_${dateStr}.db`);

    // 1. Perform today's backup if it doesn't exist
    if (fs.existsSync(dbPath) && !fs.existsSync(backupPath)) {
        fs.copyFileSync(dbPath, backupPath);
        console.log(`Backup created: ${backupPath}`);
    }

    // 2. Retention Logic (Cleanup old files)
    const files = fs.readdirSync(backupDir);
    const now = Date.now();
    const retentionMs = retentionDays * 24 * 60 * 60 * 1000;

    files.forEach(file => {
        if (file.startsWith('backup_') && file.endsWith('.db')) {
            const filePath = path.join(backupDir, file);
            const stats = fs.statSync(filePath);
            if (now - stats.mtimeMs > retentionMs) {
                fs.unlinkSync(filePath);
                console.log(`Old backup deleted: ${file}`);
            }
        }
    });
}
```

## User Configuration
The following settings should be added to the **Settings -> Display Settings** tab:
1.  **Enable Automated Backups:** (Toggle)
2.  **Retention Period:** (Number Input, default: 7 days)
3.  **Backup Folder Path:** (Text Input, defaults to Documents folder)

## Recovery Procedure
In the event of a database corruption or system failure:
1.  Close the application.
2.  Navigate to the backup folder.
3.  Find the most recent successful backup (e.g., `backup_2024-03-11.db`).
4.  Copy it to the application data folder (`%APPDATA%/Bachat Bazaar`).
5.  Rename it to `pos.db` (overwriting the corrupted one).
6.  Restart the application.

## Benefits
*   **Disaster Recovery:** Protects against hardware failure and accidental deletion.
*   **Low Storage Impact:** SQLite databases are small; even 30 days of backups usually take less than 100MB.
*   **Cloud Sync Ready:** Works out-of-the-box with OneDrive, Dropbox, and Google Drive.
