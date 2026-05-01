# Trovix — POS Application

Electron desktop POS (Point of Sale) — "Where Retail Meets Intelligence". Packages a React frontend, Express/Prisma/SQLite backend, and an Electron shell into a single installable app distributed via GitHub Releases with auto-update.

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
│       ├── domains/
│       │   ├── pos/
│       │   │   ├── components/
│       │   │   │   ├── POS.jsx                  Main POS screen — state, handlers, layout
│       │   │   │   ├── POSDialogManager.jsx      All POS dialogs (batch, receipt, qty, loose, calc, numpad)
│       │   │   │   ├── BatchSelectionDialog.jsx  Batch picker (mode: 'batch' or 'price')
│       │   │   │   ├── TransactionPanel.jsx
│       │   │   │   ├── CartTable.jsx
│       │   │   │   ├── Receipt.jsx
│       │   │   │   ├── ReceiptPreviewDialog.jsx
│       │   │   │   └── receiptUtils.js           getSafePrintableWidth, getReceiptCalculations, getReceiptTheme
│       │   │   ├── hooks/
│       │   │   │   ├── usePOSData.js             Products + settings fetch, retry, mountedRef guard
│       │   │   │   ├── usePOSSale.js             handlePay + handlePayAndPrint (isPaying guard on both)
│       │   │   │   ├── usePOSSearch.js           Autocomplete — precomputed searchIndex, no state mutation
│       │   │   │   ├── usePOSTabs.js             Multi-tab cart state (sessionStorage)
│       │   │   │   ├── usePOSPromotions.js       Promo price resolution
│       │   │   │   ├── usePOSLayout.js           Panel sizing
│       │   │   │   └── usePOSShortcuts.js        Keyboard shortcuts
│       │   │   └── pages/POSPage.jsx
│       │   ├── inventory/
│       │   │   ├── components/
│       │   │   │   ├── ProductList.jsx           Thin orchestrator (forwardRef + layout)
│       │   │   │   ├── useProductList.js         All ProductList state + handlers
│       │   │   │   ├── useInventoryLayout.js     Panel resize state
│       │   │   │   ├── useCategoryManagement.js  Category CRUD, handleCategorySelect, handleCategorySortToggle
│       │   │   │   ├── useProductActions.js      Edit/delete/add-stock handlers
│       │   │   │   ├── useProductSelection.js    Row selection
│       │   │   │   ├── ProductListTable.jsx      Virtualized table (owns tableContainerRef + useVirtualizer)
│       │   │   │   ├── ProductListToolbar.jsx    Stock filter toggle, reset, category toggle
│       │   │   │   ├── CategorySidebar.jsx       Category tree with drag-drop
│       │   │   │   ├── ProductDetailPanel.jsx    Right panel — batch table, actions
│       │   │   │   ├── ProductBatchTable.jsx     Batch list with edit/delete per batch
│       │   │   │   ├── AddProductForm.jsx        Thin form shell
│       │   │   │   ├── useAddProductForm.js      Barcode checking, validation, submit
│       │   │   │   ├── ProductInitialBatchSection.jsx  Initial stock & pricing (shows batch code + expiry only when batchTrackingEnabled)
│       │   │   │   ├── AddStockDialog.jsx        Add stock to existing product
│       │   │   │   ├── EditBatchDialog.jsx       Edit individual batch
│       │   │   │   ├── EditProductDialog.jsx     Edit product metadata
│       │   │   │   ├── QuickInventoryDialog.jsx  Fast qty adjustment
│       │   │   │   ├── BarcodePrintDialog.jsx    Dialog shell + IPC print call (stays here)
│       │   │   │   ├── BarcodeSettingsPanel.jsx  Left-side settings (qty, size, margins, content)
│       │   │   │   ├── BarcodePreviewGrid.jsx    Label preview grid
│       │   │   │   ├── barcodeSizePresets.js     DEFAULT_SIZES (pure data)
│       │   │   │   ├── PriceListPanel.jsx        Dialog shell + IPC print-html-content call (stays here)
│       │   │   │   ├── usePriceList.js           Price list state + handlers
│       │   │   │   └── paperSizePresets.js       PAPER_PRESETS + utility functions (pure)
│       │   │   └── pages/InventoryPage.jsx
│       │   ├── dashboard/
│       │   │   ├── components/               Stat cards, charts (daily/monthly/hourly)
│       │   │   ├── hooks/useDashboardData.js
│       │   │   └── pages/
│       │   ├── reporting/
│       │   │   ├── components/               AnalyticsPanel, SalesHistory, ExpiryReport, LowStock, etc.
│       │   │   └── hooks/useReportingData.js
│       │   ├── expenses/
│       │   │   ├── components/
│       │   │   │   ├── ExpenseManagement.jsx     Thin orchestrator (tabs + dialogs)
│       │   │   │   ├── useExpenseManagement.js   All expense/purchase state + handlers
│       │   │   │   ├── ExpenseListTab.jsx
│       │   │   │   └── PurchaseListTab.jsx
│       │   │   └── ...
│       │   ├── onboarding/
│       │   │   └── components/
│       │   │       ├── OnboardingWizard.jsx   2-step wizard shell (Shop Profile → Admin Password)
│       │   │       ├── useOnboarding.js       All wizard state, pre-fill from existing settings, submit
│       │   │       ├── ShopProfileStep.jsx    Step 1 — shopName (required), address, phone, phone2, email, gst
│       │   │       └── AdminPasswordStep.jsx  Step 2 — adminPassword + confirmPassword with PasswordStrength bar
│       │   ├── auth/
│       │   │   ├── components/               LoginPage, AdminElevationDialog, UserManagementDialog
│       │   │   └── hooks/useAuth.js          currentUser, admin elevation, auto-logout timer
│       │   ├── settings/
│       │   │   ├── components/
│       │   │   │   ├── AccountDetailsDialog.jsx  Shop info, wipe-database (requires password + confirmPhrase)
│       │   │   │   ├── WipeDatabaseConfirmation.jsx  Wipe UI — password + typed phrase "WIPE ALL DATA"
│       │   │   │   └── ...
│       │   │   └── hooks/useSettings.js
│       │   ├── promotions/
│       │   ├── refund/
│       │   └── saleHistory/
│       └── shared/
│           ├── api/
│           │   ├── api.js               axios instance (baseURL: http://localhost:5001)
│           │   ├── authService.js       completeOnboarding (POST /api/auth/complete-onboarding)
│           │   ├── inventoryService.js
│           │   ├── posService.js
│           │   ├── dashboardService.js
│           │   └── settingsService.js
│           ├── components/              AppLayout, GlobalAppBar, CustomDialog, GlobalErrorBoundary
│           ├── hooks/                   useCustomDialog, useSettings (shared)
│           ├── utils/                   responseGuards, paymentSettings, refundStatus
│           └── ipcChannels.js           ES module mirror of desktop/ipcChannels.js
├── server/           Express API (runs inside Electron, port 5001)
│   ├── index.js      Boot: migrations, DB backup, password migration, seed
│   ├── seed.js       Default users (passwords bcrypt-hashed at seed time) + sample data
│   ├── prisma/       Schema + migrations, SQLite database
│   └── src/
│       ├── app.js    Express app: helmet, CORS (localhost-only), rate-limit, localhost guard, router mount
│       ├── config/
│       │   └── constants.js  DEFAULT_RECEIPT_SETTINGS (authoritative source)
│       └── domains/  Domain-driven modules — auth, product, sale, category,
│                     purchase, expense, promotion, report, setting, batch,
│                     loose-sale, stock-movement, customer
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

### Security model
The Express server binds exclusively to `127.0.0.1:5001` — it is never reachable from other machines on the network. Two layers enforce this:

1. **Bind address** — `server/index.js` calls `app.listen(PORT, '127.0.0.1', ...)`. Do not remove the second argument.
2. **Localhost middleware** — `server/src/app.js` rejects any request whose `req.ip` is not `127.0.0.1` / `::1` / `::ffff:127.0.0.1`. This is defence-in-depth.
3. **CORS** — restricted to `null` origin (Electron production renderer uses `file://`) and `http://localhost:*` (Vite dev server). All other origins are rejected.

Because the server is localhost-only, there is **no JWT/session middleware** on API routes — auth is UI-enforced in the renderer. Do not add network-facing endpoints without also adding authentication middleware.

### Single-instance lock
`desktop/main.js` calls `app.requestSingleInstanceLock()` immediately after `app.setAppUserModelId`. If the lock is not granted the process quits; if a second instance is launched while the first is running, the `second-instance` event brings the existing window to the foreground. Do not remove this lock.

### Print flow (critical — handle with care)
Both receipt and barcode printing use the same `print-manual` IPC channel. The flow is **always silent** (no OS print dialog) and **always direct** (no pop-ups for the cashier).

```
User clicks Pay & Print / Print Label
  │
  ├─ Resolve printer name:
  │    receiptSettings.printerType   (user-configured, stored in DB)
  │    → defaultPrinter              (system default from getPrintersAsync)
  │    → printers[0]                 (first available, virtual printers filtered out)
  │    → error snackbar if none found
  │
  ├─ window.electron.ipcRenderer.invoke('print-manual', { printerName })
  │
  └─ main.js: mainWindow.webContents.print({ silent: true, ... })
       └─ returns { success, error } back to renderer
            └─ describePrintError() maps Chromium error codes to user-readable messages
            └─ error snackbar on failure (transaction already saved — never rolled back)
```

For barcode labels specifically, `document.body.classList.add('is-printing-labels')` must fire **before** the invoke so `@media print` CSS hides everything except `.printable-area`. The 100 ms setTimeout in `BarcodePrintDialog.jsx` is intentional.

**IPC/print code location rule:** `ipcRenderer.invoke` calls for printing must never be moved out of their current file:
- Receipt print (Pay & Print / Last Receipt) → `usePOSSale.js` (`handlePayAndPrint`, `handlePrintLastReceipt`)
- Receipt print (Sales History) → `SaleHistory.jsx` (`handlePrintReceipt`)
- Receipt print (Bill Settings test) → `receiptPreviewDialogUtils.js` (`handleManualPrint`)
- Barcode label print → `BarcodePrintDialog.jsx` (`handlePrint`)
- Price list print → `PriceListPanel.jsx` (`handlePrint`)

**Critical:** Always use `ipcRenderer.invoke()` (not `ipcRenderer.send()`) for `print-manual`. The Electron main process registers the handler with `ipcMain.handle()`, which only responds to `invoke` — `send` silently does nothing.

### Double-payment guard
`POS.jsx` uses an `isPaying` state flag set at the top of both `handlePay` and `handlePayAndPrint` and cleared in `finally`. The flag is propagated to `TransactionPanel → TransactionActionButtons` to disable the Pay button during an in-flight transaction. Never remove this guard — rapid double-taps would create duplicate sales.

### Batch system
Products have a `batchTrackingEnabled` flag that controls two separate flows:

**Batch tracking OFF (default):** One logical batch per product. `addBatch` accumulates quantity into the existing batch record. The POS shows a price-selection dialog (`mode: 'price'`) if multiple MRP tiers exist.

**Batch tracking ON:** Each stock addition creates a distinct `Batch` record with a unique auto-generated `batchCode` (format `B-YYYYMMDDHHMMSSmmm`). The POS shows a batch-selection dialog (`mode: 'batch'`) when multiple batches have stock. All sales record the exact `batchId` consumed; returns restore stock to the original batch.

Key invariants to preserve:
- `addBatch` and `createOrUpdateProduct` are always wrapped in `prisma.$transaction()` — batch creation and stock movement are atomic.
- `deleteBatch` is blocked if any `SaleItem` references the batch (sales history must not be erased). To retire a batch, set its quantity to 0 instead.
- `processSale` (`sale.service.js`) rejects expired batches (`expiryDate < now`) before touching stock — the error message includes the product name and expiry date.
- `updateBatch` validates wholesale pricing constraints (wholesalePrice ≤ sellingPrice) — pass `wholesaleEnabled` and `wholesalePrice` when calling `validatePricing`.
- Toggling `batchTrackingEnabled` from OFF → ON via `updateProduct` auto-assigns `batchCode` values to any existing batches that lack one.

### Settings storage (two layers — keep in sync)
Receipt settings live in two places:
1. **Backend DB** (primary) — `Setting` table, key `posReceiptSettings`, JSON value
2. **localStorage** (cache/fallback) — key `posReceiptSettings`

`useSettings.js → handleSaveBillSettings` writes to both on every save. On load, the DB value wins (fetched with 3 retries); localStorage is a fallback if the API is unreachable during startup. The authoritative default shape is `server/src/config/constants.js → DEFAULT_RECEIPT_SETTINGS`.

Shop metadata (name, address, phone, GST, etc.) is stored as flat `Setting` keys (`posShopName`, `shopAddress`, `shopMobile`, `shopMobile2`, `shopEmail`, `shopGST`, `shopLogo`). These are the single source of truth read by `AccountDetailsDialog`, receipts, and the POS. The `Shop` model in Prisma is a structured mirror written in parallel — do not read shop data from the `Shop` model in the client.

### Database bootstrap and migrations
On every startup:
1. `desktop/main.js` copies bundled `pos.db` to `~/{userData}/pos.db` if missing or <5 KB
2. `DATABASE_URL` env var is set before the server starts
3. `server/index.js` calls `backupDatabase()` → copies `pos.db` to `pos.db.bak`
4. `runPrismaMigrations()` runs `prisma migrate deploy` (60 s timeout)
5. `migratePasswordsToHash()` bcrypt-hashes any remaining plaintext passwords on every boot
6. `checkAndSeed()` seeds default settings + admin user if DB is empty

Default users seeded on first boot: `admin / admin123`, `cashier / cashier123`, `salesman / salesman123`. Passwords are bcrypt-hashed at seed time (not plaintext). Change the admin password before deploying to a production machine.

### First-run onboarding
On first launch, `App.jsx` checks the `onboardingVersion` Setting key. If it is absent or below `REQUIRED_ONBOARDING_VERSION = 1`, the `OnboardingWizard` is shown instead of the login screen. The wizard collects shop details and a new admin password, then calls `POST /api/auth/complete-onboarding`. That endpoint atomically:
- Upserts the `Shop` record
- Re-hashes the admin password
- Writes `onboardingVersion = 1` to the Setting table
- Writes flat metadata keys (`posShopName`, `shopAddress`, `shopMobile`, `shopMobile2`, `shopEmail`, `shopGST`) so `AccountDetailsDialog` and receipts are populated immediately
- Seeds `posReceiptSettings` with `customShopName` and `customHeader` (address), preserving any prior receipt customisations

`seed.js → seedEssential()` upserts `onboardingVersion = 1` so that dev/test databases skip the wizard on first run. Password minimum length for new users and password changes is **8 characters** (enforced in `auth.validation.js`).

### Wipe-database flow
Settings → Account Details → Wipe Database requires **two** inputs before the server accepts the request:
1. The admin's current password
2. The confirmation phrase typed exactly as `WIPE ALL DATA`

The Joi schema (`auth.validation.js → wipeDatabaseBodySchema`) enforces `confirmPhrase` server-side, so the check cannot be bypassed by manipulating the UI.

### Crash prevention (main process)
`desktop/main.js` registers `process.on('uncaughtException')` and `process.on('unhandledRejection')` at the top of the file. Both handlers write to the log file and show a `dialog.showErrorBox` to the user instead of silently crashing. `waitForServer` timeout is 90 s (covers the full migration + listen cycle). `server/index.js` registers `app.on('error')` to handle `EADDRINUSE` and other listen errors with a clean `process.exit(1)`.

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
| `ProductList.jsx` | `useProductList.js` | Shell keeps `forwardRef`/`useImperativeHandle` + layout; hook owns all state, effects, handlers. Spreads `useCategoryManagement`, `useInventoryLayout`, `useProductSelection`, `useProductActions`. |
| `useCategoryManagement.js` | (sub-hook of useProductList) | Category fetch, CRUD, `handleCategorySelect`, `handleCategorySortToggle`. All returned and spread via useProductList. |
| `InventoryTree.jsx` | `useInventoryTree.js` | Shell keeps `forwardRef` + JSX; hook owns fetch, CRUD, drag-drop |
| `PriceListPanel.jsx` | `usePriceList.js` | Shell keeps IPC print call + dialog; hook owns state, computed values, handlers |
| `ExpenseManagement.jsx` | `useExpenseManagement.js` | Shell renders tabs + dialogs; hook owns all expense/purchase state |
| `AddProductForm.jsx` | `useAddProductForm.js` | Shell renders form sections; hook owns barcode checking, validation, submit |

**Rules for future work:**
- New files go in the **same folder** as their parent component — no folder moves without updating all import chains.
- `forwardRef` on `ProductList` and `InventoryTree` must be preserved — parent pages call `ref.current.refresh()` on them.
- `ProductListTable.jsx` owns its own `tableContainerRef` and `useVirtualizer` — do not lift the ref to the parent.
- Pure data (presets, column configs) belongs in `*.js` config/preset files, not inside components or hooks.
- `useProductList` returns everything via spread (`...categoriesContext`, `...layout`, `...selection`, `...actions`). When adding new handlers to sub-hooks, ensure they are included in that sub-hook's return object.

---

## Key Conventions

### Adding a new domain (backend)
Create `server/src/domains/<name>/` with four files:
- `<name>.router.js` — Express routes mounted in `server/src/app.js`
- `<name>.controller.js` — HTTP handlers, import `logger` (not `console.error`)
- `<name>.service.js` — Business logic, Prisma queries, transactions
- `<name>.validation.js` — Joi schemas

Use `asyncHandler` wrapper in controllers. Throw `createHttpError(status, message)` from services. Map Prisma errors via `toAppError`. Wrap multi-step DB operations in `prisma.$transaction()`.

### Adding a new IPC channel
1. Add the constant to `desktop/ipcChannels.js`
2. Add the same constant to `client/src/shared/ipcChannels.js`
3. Register the handler in `desktop/main.js` with `ipcMain.handle` (not `ipcMain.on`) so the renderer always gets a response
4. Use `ipcRenderer.invoke` in the renderer (not `send`)

### Adding a new receipt setting field
1. Add the field + default to `server/src/config/constants.js → DEFAULT_RECEIPT_SETTINGS`
2. Add the same field + default to `client/src/domains/pos/components/posReceiptSettings.js → DEFAULT_RECEIPT_SETTINGS`
3. Use it in `client/src/domains/pos/components/Receipt.jsx`
4. Wire a control in `client/src/domains/pos/components/ReceiptPreviewDialog.jsx`

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

When `updateProduct` is tested, mock `prisma.$transaction` with `mockImplementationOnce((cb) => cb(prisma))` so the callback actually executes against the mocked Prisma client.

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
- **Server binds to 127.0.0.1** — `app.listen(PORT, '127.0.0.1', ...)` in `server/index.js`. Do not change to `0.0.0.0` or remove the host argument. A localhost-only guard middleware in `app.js` enforces this as a second layer.
- **No JWT/session middleware** — because the server is localhost-only, API routes rely on UI-enforced auth. If the server ever needs to be network-accessible, add authentication middleware before exposing any routes.
- **Print CSS** — receipt printing forces `color: #000000 !important` and `-webkit-print-color-adjust: exact` on all elements. Do not add colour-dependent logic to receipt rendering. Use camelCase for CSS-in-JS properties (`WebkitPrintColorAdjust`, not `'-webkit-print-color-adjust'`).
- **IPC print location** — `ipcRenderer.invoke` for `print-manual` and `print-html-content` must stay in the component files listed above. Moving them breaks the `is-printing-labels` / `is-printing-price-labels` CSS class timing that hides the UI during print capture.
- **waitForServer timeout** — set to 90 s in `desktop/main.js` to cover the full Prisma migration + `app.listen()` cycle. Do not reduce this below the longest expected migration time.
- **MUI v6 Grid** — use `<Grid size={{ xs: n, md: m }}>` syntax. The deprecated `item`, `xs`, `md` props have been removed. Fractional grid sizes are not supported; round to the nearest integer.
- **axios params serializer** — the axios instance has a known incompatibility with ISO date strings in `params` objects in certain Vite-bundled environments. Build query strings with native `URLSearchParams` and append them to the URL directly (see `dashboardService.js`).
- **server/node_modules must be bundled explicitly** — `server/node_modules/**/*` is listed in both `files` and `asarUnpack` in `package.json`. electron-builder does not automatically bundle nested node_modules directories the same way it handles the root one. The build workflow must run `npm ci` inside `server/` for these to exist at build time.
- **Build workflow must install server deps** — `build-mac` and `build-win` jobs in `build-release.yml` must each run `npm ci` in the `server/` directory before packaging. Skipping this means `server/node_modules` is empty and server-only packages are missing from the installer.
- **Releases are tag-triggered** — `build-release.yml` only runs on `v*` tag pushes or manual dispatch. Push a tag (`git tag vX.Y.Z && git push origin vX.Y.Z`) to cut a release. Quality workflows (`client-quality`, `server-quality`) run on every main push but do not trigger builds.
- **macOS virtual printers** — macOS exposes virtual "Save PDF to ..." printers (e.g. "Save PDF to Notes") in the system printer list. If selected as the device, `webContents.print()` silently routes the job to an app instead of a physical printer. Always configure a real printer in Bill Settings (`receiptSettings.printerType`). The printer list in `useSettings.js` is fetched via `get-printers` IPC and should only show physical devices.
- **LoginPage has no demo accounts** — the login screen shows a single username/password form. Demo credential buttons were removed; use the seeded `admin / admin123` credentials in development.
