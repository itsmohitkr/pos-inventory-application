# Windows SQLite Troubleshooting: Error 14

This document captures the root causes and definitive fixes for the "Unable to open database file" (Error 14) encountered on Windows during the development and distribution of the Bachat Bazaar POS application.

---

## 1. Problem Description 🚨
**Error**: `PrismaClientInitializationError: Error querying the database: Error code 14: Unable to open the database file`.

This error typically occurs when the Prisma engine (or the underlying SQLite library) cannot locate or gain write access to the database file specified in the `DATABASE_URL`.

---

## 2. Root Causes 🕵️‍♂️

### A. Initialization Order (The "UserData" Trap)
On Windows, Electron's `app.getPath('userData')` depends on the application name. If `app.setName()` is not called at the very beginning of the process, Electron may resolve the path to a default generic folder (e.g., `%APPDATA%\Electron`) instead of the intended application folder (e.g., `%APPDATA%\Bachat Bazaar`).
- **Result**: The app looks for the database in a folder that doesn't exist or doesn't have the bootstrapped `.db` file.

### B. Environment Variable Conflicts (`.env` Leaks)
`dotenv` is often used in server-side development. If `.env` files are included in the production installer, they can overwrite the dynamic environment variables set by the Electron main process.
- **Scenario**: A `.env` file containing a hardcoded Mac path (`/Users/.../pos.db`) is included in the Windows build.
- **Result**: Prisma tries to open a Mac-style path on Windows, leading to immediate failure.

### C. URI Formatting Ambiguity
SQLite URIs on Windows are sensitive to slash counts.
- `file:///C:/path/...` (3 slashes) is the RFC standard.
- `file:C:/path/...` (1 slash) is often more robust for library engines that handle spaces in paths differently.
- **Result**: Using the wrong format for the specific OS can lead to path mangling, especially with spaces.

---

## 3. The Definitive Solution 🛠️

### Step 1: Force Early Initialization
Move app identification to the first line of `main.js`.
```javascript
// main.js - CRITICAL: FIRST LINES
const { app } = require('electron');
app.setName('Your App Name');
app.setAppUserModelId('com.your.id');
// ... other imports
```

### Step 2: Build-Time Exclusion
Exclude all `.env` files from the `electron-builder` configuration in `package.json`.
```json
"build": {
  "files": [
    "**/*",
    "!.env",
    "!server/.env",
    "!client/.env"
  ]
}
```

### Step 3: Robust Path Formatting
Use platform-aware URI construction in the main process.
```javascript
const formattedDbPath = dbFile.replace(/\\/g, '/');
process.env.DATABASE_URL = process.platform === 'win32' 
  ? `file:${formattedDbPath}` 
  : `file://${formattedDbPath}`;
```

### Step 4: Protective Server Loading
Ensure the server does not overwrite the path if it's already set by Electron.
```javascript
// server/src/config/prisma.js
if (!process.env.DATABASE_URL) {
    require('dotenv').config();
}
```

---

## 4. Verification Checklist ✅
- [x] **appDataPath**: Check if it correctly resolves to `Roaming/Bachat Bazaar`.
- [x] **Database File**: Verify `pos.db` is successfully bootstrapped (copied) to that folder.
- [x] **DATABASE_URL**: Use a "System Diagnostic" menu to verify the URL starts with `file:C:/` on Windows.
- [x] **ASAR check**: Ensure no `.env` files exist in the unpacked `resources/app` folder.
