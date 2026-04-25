# Bachat Bazaar — POS Application

Electron desktop POS (Point of Sale) for Bachat Bazaar. Packages a React frontend, Express/Prisma/SQLite backend, and an Electron shell into a single installable app distributed via GitHub Releases with auto-update.

---

## Project Structure

```
/
├── desktop/          Electron main process, preload, splash screen
│   ├── main.js       App entry, IPC handlers, DB bootstrap, auto-update
│   ├── preload.js    Context bridge — exposes ipcRenderer to renderer
│   ├── ipcChannels.js  IPC channel name constants (single source of truth)
│   └── server-wrapper.js  Loads the Express server inside Electron
├── client/           React frontend (Vite)
│   └── src/
│       ├── components/
│       │   ├── POS/
│       │   │   ├── POS.jsx                  Main POS screen — state, handlers, layout
│       │   │   ├── POSDialogManager.jsx      All POS dialogs (batch, receipt, qty, loose, calc, numpad)
│       │   │   ├── TransactionPanel.jsx
│       │   │   ├── CartTable.jsx
│       │   │   ├── Receipt.jsx
│       │   │   ├── ReceiptPreviewDialog.jsx
│       │   │   └── ...
│       │   ├── Inventory/
│       │   │   ├── ProductList.jsx           Thin orchestrator (forwardRef + layout)
│       │   │   ├── useProductList.js         All ProductList state + handlers
│       │   │   ├── ProductListTable.jsx      Virtualized table (owns tableContainerRef + useVirtualizer)
│       │   │   ├── ProductListToolbar.jsx    Stock filter toggle, reset, category toggle
│       │   │   ├── productListConfig.js      Column definitions (pure data)
│       │   │   ├── AddProductForm.jsx        Thin form shell
│       │   │   ├── useAddProductForm.js      Add-product state + barcode checking + submit
│       │   │   ├── ProductBarcodeSection.jsx Barcode field + chip display
│       │   │   ├── ProductInitialBatchSection.jsx  Initial stock & pricing fields
│       │   │   ├── BarcodePrintDialog.jsx    Dialog shell + IPC print call (stays here)
│       │   │   ├── BarcodeSettingsPanel.jsx  Left-side settings (qty, size, margins, content)
│       │   │   ├── BarcodePreviewGrid.jsx    Label preview grid
│       │   │   ├── barcodeSizePresets.js     DEFAULT_SIZES (pure data)
│       │   │   ├── PriceListPanel.jsx        Dialog shell + IPC print-html-content call (stays here)
│       │   │   ├── usePriceList.js           Price list state + handlers
│       │   │   ├── paperSizePresets.js       PAPER_PRESETS + utility functions (pure)
│       │   │   ├── InventoryTree.jsx         Thin forwardRef shell
│       │   │   ├── useInventoryTree.js       Tree data, selection, CRUD handlers
│       │   │   ├── InventoryTreeToolbar.jsx  Search field + category heading
│       │   │   └── ...
│       │   ├── Reporting/
│       │   │   ├── AnalyticsPanel.jsx        Thin orchestrator
│       │   │   ├── analyticsUtils.js         buildCashFlowItems, buildCategorySegments (pure)
│       │   │   ├── AnalyticsCashFlowTable.jsx
│       │   │   ├── AnalyticsPayoutSection.jsx
│       │   │   └── AnalyticsCategoryBreakdown.jsx
│       │   ├── Expenses/
│       │   │   ├── ExpenseManagement.jsx     Thin orchestrator (tabs + dialogs)
│       │   │   ├── useExpenseManagement.js   All expense/purchase state + handlers
│       │   │   ├── ExpenseListTab.jsx        Expense table + filters
│       │   │   └── PurchaseListTab.jsx       Purchase table + filters
│       │   └── common/
│       ├── hooks/
│       │   └── useSettings.js  Settings + printer list state management
│       └── shared/
│           └── ipcChannels.js  ES module mirror of desktop/ipcChannels.js
├── server/           Express API (runs inside Electron, port 5001)
│   ├── index.js      Boot: migrations, DB backup, password migration, seed
│   ├── prisma/       Schema + migrations, SQLite database
│   └── src/
│       ├── app.js    Express app: helmet, CORS, rate-limit, router mount
│       ├── config/
│       │   └── constants.js  DEFAULT_RECEIPT_SETTINGS (authoritative source)
│       └── domains/  Domain-driven modules — auth, product, sale, category,
│                     purchase, expense, promotion, report, setting, batch,
│                     loose-sale, stock-movement
│                     Each: *.controller.js, *.service.js, *.router.js, *.validation.js
├── scripts/
│   ├── post-build.js     Copies .prisma engine binary after electron-builder
│   └── sync-version.js   Syncs root package.json version → client + server
├── assets/           App icons
├── .github/workflows/
│   ├── build-release.yml  Triggered on v* tags — builds macOS + Windows
│   ├── client-quality.yml  Lint + unit + E2E (Chromium) on client changes
│   ├── server-quality.yml  Jest tests on server changes
│   └── client-nightly.yml  Full-browser E2E nightly
└── Documents/        Operational guides (backup strategy, DB troubleshooting)
```

---

## Development Commands

### Full stack (recommended)
```bash
npm run dev          # Starts Vite dev server + Express server concurrently
npm run electron-dev # Starts client dev server + Electron shell
```

### Individual layers
```bash
# Client
cd client && npm run dev        # Vite dev server → http://localhost:5173
cd client && npm run test:unit  # Vitest unit tests
cd client && npm run test:e2e   # Playwright E2E (needs preview server running)

# Server
cd server && npm run dev        # nodemon
cd server && npm test           # Jest
cd server && npm run test:coverage

# Electron
npm run electron-pack           # Build without publishing
npm run electron-publish        # Build and publish to GitHub Releases
npm run sync-version            # Sync version across all package.json files
```

### Release
Push a `v*` tag (e.g. `git tag v1.2.0 && git push origin v1.2.0`). The `build-release.yml` workflow runs quality gates, then builds macOS (DMG + ZIP) and Windows (NSIS x64) installers and uploads them to GitHub Releases. Auto-update feed is served from GitHub Releases via `latest.yml` / `latest-mac.yml`.

---

## Architecture

### Communication layers
- **Renderer → Main (Electron IPC):** All IPC channel names are defined in `desktop/ipcChannels.js` (CommonJS) and mirrored in `client/src/shared/ipcChannels.js` (ES module). **Never use raw string literals for channel names.**
- **Renderer → Server:** REST API calls to `http://localhost:5001/api/*`
- **Main → Server:** Server runs in the same Node.js process via `require(wrapperPath)`

### Print flow (critical — handle with care)
Both receipt and barcode printing use the same `print-manual` IPC channel. The flow is **always silent** (no OS print dialog) and **always direct** (no pop-ups for the cashier).

```
User clicks Pay & Print / Print Label
  │
  ├─ Resolve printer name:
  │    receiptSettings.printerType   (user-configured, stored in DB)
  │    → defaultPrinter              (system default from getPrintersAsync)
  │    → printers[0]                 (first available)
  │    → error snackbar if none found
  │
  ├─ window.electron.ipcRenderer.invoke('print-manual', { printerName })
  │
  └─ main.js: mainWindow.webContents.print({ silent: true, ... })
       └─ returns { success, error } back to renderer
            └─ error snackbar on failure (transaction already saved — never rolled back)
```

For barcode labels specifically, `document.body.classList.add('is-printing-labels')` must fire **before** the invoke so `@media print` CSS hides everything except `.printable-area`. The 100 ms setTimeout in `BarcodePrintDialog.jsx` is intentional.

**IPC/print code location rule:** `ipcRenderer.invoke` calls for printing must never be moved out of their current file:
- Receipt print → `POS.jsx` (`handlePayAndPrint`)
- Barcode label print → `BarcodePrintDialog.jsx` (`handlePrint`)
- Price list print → `PriceListPanel.jsx` (`handlePrint`)

### Double-payment guard
`POS.jsx` uses an `isPaying` state flag set at the top of `handlePayAndPrint` and cleared in `finally`. The flag is propagated to `TransactionPanel → TransactionActionButtons` to disable the Pay button during an in-flight transaction. Never remove this guard — rapid double-taps would create duplicate sales.

### Settings storage (two layers — keep in sync)
Receipt settings live in two places:
1. **Backend DB** (primary) — `Setting` table, key `posReceiptSettings`, JSON value
2. **localStorage** (cache/fallback) — key `posReceiptSettings`

`useSettings.js → handleSaveBillSettings` writes to both on every save. On load, the DB value wins (fetched with 3 retries); localStorage is a fallback if the API is unreachable during startup. The authoritative default shape is `server/src/config/constants.js → DEFAULT_RECEIPT_SETTINGS`.

### Database bootstrap and migrations
On every startup:
1. `desktop/main.js` copies bundled `pos.db` to `~/{userData}/pos.db` if missing or <5 KB
2. `DATABASE_URL` env var is set before the server starts
3. `server/index.js` calls `backupDatabase()` → copies `pos.db` to `pos.db.bak`
4. `runPrismaMigrations()` runs `prisma migrate deploy` (60 s timeout)
5. `migratePasswordsToHash()` bcrypt-hashes any remaining plaintext passwords
6. `checkAndSeed()` seeds default settings + admin user if DB is empty

### Crash prevention (main process)
`desktop/main.js` registers `process.on('uncaughtException')` and `process.on('unhandledRejection')` at the top of the file. Both handlers write to the log file and show an `dialog.showErrorBox` to the user instead of silently crashing. `waitForServer` timeout is 90 s (covers the full migration + listen cycle). `server/index.js` registers `app.on('error')` to handle `EADDRINUSE` and other listen errors with a clean `process.exit(1)`.

### Prisma engine in packaged builds
The native Prisma query engine binary lives in `node_modules/.prisma/client/`. electron-builder skips dot-folders by default, so it is handled two ways:
- `asarUnpack` in `package.json` includes `"node_modules/.prisma/**/*"`
- `extraFiles` copies `node_modules/.prisma` → `app.asar.unpacked/node_modules/.prisma`
- `scripts/post-build.js` copies it again as a safety net

`desktop/main.js` checks for the platform-specific binary filename in this order: `libquery_engine-darwin-arm64.dylib.node` (Apple Silicon), `libquery_engine-darwin-x64.dylib.node` (Intel Mac), `libquery_engine-darwin.dylib.node` (legacy), then Windows variants. If none is found it logs `CRITICAL: Prisma Query Engine not found` and shows an error dialog.

---

## Frontend Component Architecture (SRP pattern)

Large components follow a **hook + shell** pattern. The parent file is a thin orchestrator; all state and logic live in a co-located `use*.js` hook.

| Shell component | Hook | Responsibility split |
|---|---|---|
| `ProductList.jsx` | `useProductList.js` | Shell keeps `forwardRef`/`useImperativeHandle` + layout; hook owns all 30+ state vars, effects, and handlers |
| `InventoryTree.jsx` | `useInventoryTree.js` | Shell keeps `forwardRef` + JSX; hook owns fetch, CRUD, drag-drop |
| `PriceListPanel.jsx` | `usePriceList.js` | Shell keeps IPC print call + dialog; hook owns state, computed values, handlers |
| `ExpenseManagement.jsx` | `useExpenseManagement.js` | Shell renders tabs + dialogs; hook owns all expense/purchase state |
| `AddProductForm.jsx` | `useAddProductForm.js` | Shell renders form sections; hook owns barcode checking, validation, submit |

**Rules for future work:**
- New files go in the **same folder** as their parent component — no folder moves without updating all import chains.
- `forwardRef` on `ProductList` and `InventoryTree` must be preserved — parent pages call `ref.current.refresh()` on them.
- `ProductListTable.jsx` owns its own `tableContainerRef` and `useVirtualizer` — do not lift the ref to the parent.
- Pure data (presets, column configs) belongs in `*.js` config/preset files, not inside components or hooks.

---

## Key Conventions

### Adding a new domain (backend)
Create `server/src/domains/<name>/` with four files:
- `<name>.router.js` — Express routes mounted in `server/src/app.js`
- `<name>.controller.js` — HTTP handlers, import `logger` (not `console.error`)
- `<name>.service.js` — Business logic, Prisma queries, transactions
- `<name>.validation.js` — Joi schemas

Use `asyncHandler` wrapper in controllers. Throw `createHttpError(status, message)` from services. Map Prisma errors via `toAppError`.

### Adding a new IPC channel
1. Add the constant to `desktop/ipcChannels.js`
2. Add the same constant to `client/src/shared/ipcChannels.js`
3. Register the handler in `desktop/main.js` with `ipcMain.handle` (not `ipcMain.on`) so the renderer always gets a response
4. Use `ipcRenderer.invoke` in the renderer (not `send`)

### Adding a new receipt setting field
1. Add the field + default to `server/src/config/constants.js → DEFAULT_RECEIPT_SETTINGS`
2. Add the same field + default to `client/src/components/POS/posReceiptSettings.js → DEFAULT_RECEIPT_SETTINGS`
3. Use it in `client/src/components/POS/Receipt.jsx`
4. Wire a control in `client/src/components/POS/ReceiptPreviewDialog.jsx`

### Database migrations
```bash
cd server
npx prisma migrate dev --name describe_your_change
```
Migrations run automatically on startup via `migrate deploy`. Always test on a DB with existing data before releasing.

---

## Testing

| Layer | Tool | Command |
|---|---|---|
| Server unit | Jest + jest-mock-extended (mocked Prisma) | `cd server && npm test` |
| Client unit | Vitest | `cd client && npm run test:unit` |
| Client E2E | Playwright (Chromium on PR, all browsers nightly) | `cd client && npm run test:e2e` |

E2E tests run against `vite preview` (port 4173), not the dev server. The backend must be running separately for E2E tests that hit the API.

---

## Environment Variables

Set automatically by `desktop/main.js` at runtime. For standalone server development, create `server/.env`:

| Variable | Set by | Purpose |
|---|---|---|
| `DATABASE_URL` | `desktop/main.js` | Prisma SQLite path (`file:/path/to/pos.db`) |
| `PRISMA_CLIENT_ENGINE_TYPE` | `desktop/main.js` | Must be `library` |
| `PRISMA_QUERY_ENGINE_LIBRARY` | `desktop/main.js` | Absolute path to `.dylib.node` / `.dll.node` |
| `PORT` | `desktop/main.js` | Express port (default 5001) |
| `NODE_ENV` | `desktop/main.js` | `development` or `production` |
| `LOG_LEVEL` | optional | Pino log level (default `info`) |

---

## Known Constraints

- **SQLite only** — single file, no concurrent write processes. The server and the Electron main process must never open the DB simultaneously (server handles all DB access).
- **Windows path** — `DATABASE_URL` uses `file:C:/path` (not `file:///C:/path`) on Windows. The forward-slash format is intentional. Do not change this.
- **Spaces in AppData path** — handled by literal path formatting in `desktop/main.js`. Do not switch to `pathToFileURL`.
- **No authentication middleware** — the Express server only listens on `127.0.0.1:5001` (localhost). Route-level auth is UI-enforced, not server-enforced. Adding JWT would require a coordinated frontend + backend change.
- **Print CSS** — receipt printing forces `color: #000000 !important` and `-webkit-print-color-adjust: exact` on all elements. Do not add colour-dependent logic to receipt rendering.
- **IPC print location** — `ipcRenderer.invoke` for `print-manual` and `print-html-content` must stay in the component files listed above. Moving them breaks the `is-printing-labels` / `is-printing-price-labels` CSS class timing that hides the UI during print capture.
- **waitForServer timeout** — set to 90 s in `desktop/main.js` to cover the full Prisma migration + `app.listen()` cycle. Do not reduce this below the longest expected migration time.
