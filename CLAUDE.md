# Trovix — POS Application

Electron desktop POS (Point of Sale) — "Where Retail Meets Intelligence". Packages a React frontend, Express/Prisma/SQLite backend, and an Electron shell into a single installable app distributed via GitHub Releases with auto-update.

---

## Project Structure

```
/
├── desktop/          Electron main process, preload, splash screen (TypeScript, compiles to desktop/dist/)
│   ├── main.ts       App entry, IPC handlers, DB bootstrap, auto-update
│   ├── preload.ts    Context bridge — exposes ipcRenderer to renderer
│   ├── ipcChannels.ts  IPC channel name constants (single source of truth)
│   └── server-wrapper.ts  Loads the Express server inside Electron
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
│           │   ├── inventoryService.js
│           │   ├── posService.js
│           │   ├── dashboardService.js
│           │   └── settingsService.js
│           ├── components/              AppLayout, GlobalAppBar, CustomDialog, GlobalErrorBoundary
│           ├── hooks/                   useCustomDialog, useSettings (shared)
│           ├── utils/                   responseGuards, paymentSettings, refundStatus
│           └── ipcChannels.js           ES module mirror of desktop/ipcChannels.ts
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
- **Renderer → Main (Electron IPC):** All IPC channel names are defined in `desktop/ipcChannels.ts` (CommonJS) and mirrored in `client/src/shared/ipcChannels.ts` (ES module). **Never use raw string literals for channel names.**
- **Renderer → Server:** REST API calls to `http://localhost:5001/api/*`
- **Main → Server:** Server runs in the same Node.js process via `require(wrapperPath)`

### Security model
The Express server binds exclusively to `127.0.0.1:5001` — it is never reachable from other machines on the network. Two layers enforce this:

1. **Bind address** — `server/index.js` calls `app.listen(PORT, '127.0.0.1', ...)`. Do not remove the second argument.
2. **Localhost middleware** — `server/src/app.js` rejects any request whose `req.ip` is not `127.0.0.1` / `::1` / `::ffff:127.0.0.1`. This is defence-in-depth.
3. **CORS** — restricted to `null` origin (Electron production renderer uses `file://`) and `http://localhost:*` (Vite dev server). All other origins are rejected.

Because the server is localhost-only, there is **no JWT/session middleware** on API routes — auth is UI-enforced in the renderer. Do not add network-facing endpoints without also adding authentication middleware.

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
            └─ describePrintError() maps Chromium error codes to user-readable messages
            └─ error snackbar on failure (transaction already saved — never rolled back)
```

For barcode labels specifically, `document.body.classList.add('is-printing-labels')` must fire **before** the invoke so `@media print` CSS hides everything except `.printable-area`. The 100 ms setTimeout in `BarcodePrintDialog.jsx` is intentional.

**IPC/print code location rule:** `ipcRenderer.invoke` calls for printing must never be moved out of their current file:
- Receipt print (Pay & Print / Last Receipt) → `usePOSSale.ts` (`handlePayAndPrint`, `handlePrintLastReceipt`)
- Receipt print (Sales History) → `SaleHistory.tsx` (`handlePrintReceipt`)
- Receipt print (Bill Preview dialog) → `ReceiptPreviewDialog.tsx` (`printPreview`)
- Barcode label print → `BarcodePrintDialog.tsx` (`handlePrint`)
- Price list print → `PriceListPanel.tsx` (`handlePrint`)

The rule constrains the **invoke**, not the logic around it. Pure helpers may
and should be shared — printer *resolution* lives in
`client/src/shared/utils/resolvePrinterName.ts` and the cached `get-printers`
call lives in `client/src/shared/hooks/usePrinters.ts`. What must stay in the
component is the `invoke` itself, so the `is-printing-*` class timing stays
next to the call it gates.

**Printer resolution is shared, and validates against the live list.** Use
`resolvePrinterName({ receiptSettings, printers, defaultPrinter })` for
receipts: saved printer (only if still present in the live list) → system
default → first `isDefault` → first available. The list check matters — a
renamed or unplugged printer sent to main is rejected as an unknown device,
so skipping it turns a recoverable situation into a hard failure. Barcode and
price-list printing deliberately do *not* use this: they keep their own
per-dialog printer choice in `localStorage`.

**Both print handlers return `{ success, error }` and never throw.** Callers
must check `result.success`; a rejected `invoke` means something unexpected,
not an ordinary print failure. `get-printers` likewise always resolves to an
array. This uniformity is load-bearing — the handlers previously disagreed
(one returned, one threw, one did both) and callers each guessed differently.

**A print failure is not a payment failure.** In `handlePayAndPrint` the sale
commits *before* printing, so the print block has its own `try/catch`. Never
let a print error reach the outer handler: a cashier told "Payment failed"
for a committed sale will re-ring it and double-charge the customer. Print
failure messages must say the sale was saved and point at Sale History.

**Critical:** Always use `ipcRenderer.invoke()` (not `ipcRenderer.send()`) for `print-manual`. The Electron main process registers the handler with `ipcMain.handle()`, which only responds to `invoke` — `send` silently does nothing.

**Print jobs are guarded by a 30 s timeout** (`printWithTimeout` in
`desktop/main.ts`). Chromium's print callback does not always fire — a stalled
spooler can swallow it — and without the guard the renderer's `await invoke`
never settles, leaving `isPaying` stuck `true` and the Pay button disabled
until restart. Do not remove it, and keep new print paths going through that
helper.

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

### Database bootstrap and migrations
On every startup:
1. `desktop/main.ts` copies bundled `pos.db` to `~/{userData}/pos.db` if missing or <5 KB
2. `DATABASE_URL` env var is set before the server starts
3. `server/index.js` calls `backupDatabase()` → copies `pos.db` to `pos.db.bak`
4. `runPrismaMigrations()` runs `prisma migrate deploy` (60 s timeout)
5. `migratePasswordsToHash()` bcrypt-hashes any remaining plaintext passwords on every boot
6. `checkAndSeed()` seeds default settings + admin user if DB is empty

Default users seeded on first boot: `admin / admin123`, `cashier / cashier123`, `salesman / salesman123`. Passwords are bcrypt-hashed at seed time (not plaintext). Change the admin password before deploying to a production machine.

### Wipe-database flow
Settings → Account Details → Wipe Database requires **two** inputs before the server accepts the request:
1. The admin's current password
2. The confirmation phrase typed exactly as `WIPE ALL DATA`

The Joi schema (`auth.validation.js → wipeDatabaseBodySchema`) enforces `confirmPhrase` server-side, so the check cannot be bypassed by manipulating the UI.

### Crash prevention (main process)
`desktop/main.ts` registers `process.on('uncaughtException')` and `process.on('unhandledRejection')` at the top of the file. Both handlers write to the log file and show a `dialog.showErrorBox` to the user instead of silently crashing. `waitForServer` timeout is 90 s (covers the full migration + listen cycle). `server/index.js` registers `app.on('error')` to handle `EADDRINUSE` and other listen errors with a clean `process.exit(1)`.

### Prisma engine in packaged builds
The native Prisma query engine binary lives in `node_modules/.prisma/client/`. electron-builder skips dot-folders by default, so it is handled two ways:
- `asarUnpack` in `package.json` includes `"node_modules/.prisma/**/*"`
- `extraFiles` copies `node_modules/.prisma` → `app.asar.unpacked/node_modules/.prisma`
- `scripts/post-build.js` copies it again as a safety net

`desktop/main.ts` checks for the platform-specific binary filename in this order: `libquery_engine-darwin-arm64.dylib.node` (Apple Silicon), `libquery_engine-darwin-x64.dylib.node` (Intel Mac), `libquery_engine-darwin.dylib.node` (legacy), then Windows variants. If none is found it logs `CRITICAL: Prisma Query Engine not found` and shows an error dialog.

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
1. Add the constant to `desktop/ipcChannels.ts`
2. Add the same constant to `client/src/shared/ipcChannels.ts`
3. Register the handler in `desktop/main.ts` with `ipcMain.handle` (not `ipcMain.on`) so the renderer always gets a response
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

Set automatically by `desktop/main.ts` at runtime. For standalone server development, create `server/.env`:

| Variable | Set by | Purpose |
|---|---|---|
| `DATABASE_URL` | `desktop/main.ts` | Prisma SQLite path (`file:/path/to/pos.db`) |
| `PRISMA_CLIENT_ENGINE_TYPE` | `desktop/main.ts` | Must be `library` |
| `PRISMA_QUERY_ENGINE_LIBRARY` | `desktop/main.ts` | Absolute path to `.dylib.node` / `.dll.node` |
| `PORT` | `desktop/main.ts` | Express port (default 5001) |
| `NODE_ENV` | `desktop/main.ts` | `development` or `production` |
| `LOG_LEVEL` | optional | Pino log level (default `info`) |

---

## TypeScript strictness — current state

Deliberate, not half-finished. Both `server/tsconfig.json` and
`client/tsconfig.json` now set `strict: true` and `allowJs: false` outright
(the full strict family, and no more untyped `.js` anywhere in either
package — source or tests). Server crossed the line first; client followed
once its 54 strict-mode errors were fixed. Flags are set per-package rather
than in `tsconfig.base.json` because a flag can only be turned on for a
package once that package's count reaches zero.

`desktop/` is now TypeScript too (`main.ts`, `preload.ts`,
`server-wrapper.ts`, `ipcChannels.ts`), but deliberately without `strict` —
this was a mechanical, types-only conversion (no behavior change), not a
strictness push, given the package has zero automated test coverage and
holds the Prisma engine path resolution and Windows `DATABASE_URL`
formatting. It still inherits `tsconfig.base.json`'s loose settings. Since
Electron's main process is loaded via plain Node `require()`, not
ts-node/tsx, `desktop/` now compiles to `desktop/dist/*.js` before
`electron .` runs — `desktop/tsconfig.json` stays `noEmit: true` (used by
the root `typecheck` script), and a new `desktop/tsconfig.build.json`
(mirrors `server/tsconfig.build.json`'s split) does the actual emit via the
new `desktop-build` npm script, wired in before both `electron-dev` and
`electron-build`. Root `package.json`'s `"main"` now points at
`desktop/dist/main.js`, and electron-builder's `files` ships
`desktop/dist/**/*` + `desktop/splash/**/*` instead of raw `desktop/**/*`.
Every `__dirname`-relative path in `main.ts`/`server-wrapper.ts` (splash
screen, preload script, app icon, `server/.env`, the bundled `pos.db`
template, the Prisma engine directory, `client/dist/index.html`) needed an
extra `../` to account for `dist/` sitting one directory deeper — each is
marked with a `NOTE` comment at the call site. Converting it surfaced one
real bug: `server-wrapper.ts`'s unpacked-`node_modules` path calculation
needed a third `..` for the same reason, or packaged-app module resolution
would have silently pointed at the wrong directory. Verified via a full
local `electron-dev` run and an unsigned `electron-pack` (macOS) — the
Windows-specific `file:C:/path` format and `.dll.node` engine lookup are
unchanged but still need verification on an actual Windows machine before
this merges, since there is no Windows CI or test coverage for them.

Test files converted last, once source was fully clean — they are the net
that verifies the migration, so they had to keep passing throughout:
- Server: all 14 files under `server/tests/` (13 Jest domain suites +
  `tests/setup/prisma-mock.ts`) are now `.ts`. `server/tsconfig.json`
  includes `tests/**/*` so `tsc --noEmit` enforces strict mode on them too;
  a separate `server/tsconfig.build.json` (excludes `tests/`) is what
  `npm run build`/`npm run dev` actually use, so test files never land in
  `dist/`.
- Client: all 9 Vitest unit test files and all 38 Playwright E2E files
  (spec + support/page-object files) are now `.ts`/`.tsx`. E2E type-checks
  under a separate `client/tsconfig.e2e.json` (Node/Playwright types
  conflict with the browser-facing main config) rather than the main
  `client/tsconfig.json`.

Converting the tests under `strict` surfaced real bugs beyond missing
annotations, the same pattern seen converting source: a mistyped Prisma
mock delegate (`purchase.test.ts` mocked a nonexistent `prisma.payment`
instead of `prisma.purchasePayment` — invisible in JS because
`jest-mock-extended`'s `mockDeep` proxy auto-mocks any property access, real
or not), two client source bugs in date-range and response-envelope null
handling (`saleHistoryDateUtils.ts`, `responseGuards.ts`) that strict typing
on their *tests* exposed, and one dead E2E helper calling a Playwright API
that never existed (`.getByTypography(...)`).

Everything measured, not guessed:

| Flag | Server | Client | Desktop | State |
|---|---|---|---|---|
| `strict` (all flags) | 0 | 0 | not enabled | **on** (server + client only) |
| explicit return types | ~174 | ~192 | not measured | rule not enabled |
| `allowJs` | — | — | `true` (inherited) | **off** (server + client), still on for desktop |

Re-measure with, e.g., `cd client && npx tsc --noEmit --strict`.

`strict` on the server found two more real bugs beyond missing annotations:
`useUnknownInCatchVariables` (part of `strict`) caught a handful of
`catch (err) { ...err.message }` sites that would throw *inside* the error
handler itself if something non-`Error` were ever thrown — see the new
`shared/utils/errorMessage.ts` helper and its call sites. It also caught a
few `const x = []` "evolving array" declarations whose inferred `never[]`
type had been silently accepted; each now has an explicit element type.

`strict` on the client was almost entirely the same `useUnknownInCatchVariables`
pattern — dozens of `catch (err) { err.response?.data?.error || err.message }`
sites across POS, inventory, auth, refund, and settings components, all now
routed through the existing `getApiErrorMessage(error, fallback)` helper
(`client/src/shared/api/api.ts`) instead of ad hoc property access; a few
sites that needed the raw `.status`/`.response` (404/409 branching) cast
through the existing `ApiError` interface instead. `AccountDetailsDialog.tsx`
also had `strictFunctionTypes` catches on four Electron IPC listener
callbacks, whose params are typed `unknown` by `IpcListener`
(`client/src/types/electron.d.ts`) — fixed by widening the listener
signatures and coercing (`String(msg)`, `Number(percent)`) at the call site
rather than the channel type. The same evolving-array pattern as the server
turned up too (`useBulkImport.ts`, `usePOSSearch.ts`).

`strictNullChecks` found real bugs on both sides, not just missing
annotations. Server (see git history on `purchase.service.ts` /
`expense.service.ts` — a `findUnique` result used without a null guard),
`sale.service.ts` (a wholesale price of `null` could reach `totalAmount` as
`NaN`), and `product.service.ts`'s `validatePricing` (a cleared wholesale
price coerced to `0` in a comparison instead of skipping validation). Client:
the same wholesale-price class of bug in `usePOSTabs.ts` (`addToCart` /
`updateQuantity` / `handleSetQuantity` could set a cart item's `price` to
`null` when `wholesalePrice` or `promoPrice` was unset despite the enabling
flag being on), an Axios `GenericAbortSignal` whose `addEventListener` method
is itself optional (`client/src/shared/api/api.ts`), and a `GlobalAppBar`
countdown timer that used `=== null` and so missed `undefined`, reaching
`seconds / 60` unguarded.

Two conventions worth keeping if this is taken further:

- **Types are derived, not hand-written.** Server service inputs come from
  `z.infer` of the domain's Zod schemas; query-result shapes come from Prisma
  via `satisfies` + `GetPayload` (see `sale.service.ts`). Client API entities
  live in `client/src/shared/types/models.ts` and mirror the server's include
  shapes.
- **Do not satisfy the compiler with `any`.** 15 documented escape hatches
  remain; each carries a comment explaining why.

---

## Known Constraints

- **SQLite only** — single file, no concurrent write processes. The server and the Electron main process must never open the DB simultaneously (server handles all DB access).
- **Windows path** — `DATABASE_URL` uses `file:C:/path` (not `file:///C:/path`) on Windows. The forward-slash format is intentional. Do not change this.
- **Spaces in AppData path** — handled by literal path formatting in `desktop/main.ts`. Do not switch to `pathToFileURL`.
- **Server binds to 127.0.0.1** — `app.listen(PORT, '127.0.0.1', ...)` in `server/index.js`. Do not change to `0.0.0.0` or remove the host argument. A localhost-only guard middleware in `app.js` enforces this as a second layer.
- **No JWT/session middleware** — because the server is localhost-only, API routes rely on UI-enforced auth. If the server ever needs to be network-accessible, add authentication middleware before exposing any routes.
- **Print CSS** — receipt printing forces `color: #000000 !important` and `-webkit-print-color-adjust: exact` on all elements. Do not add colour-dependent logic to receipt rendering. Use camelCase for CSS-in-JS properties (`WebkitPrintColorAdjust`, not `'-webkit-print-color-adjust'`).
- **IPC print location** — `ipcRenderer.invoke` for `print-manual` and `print-html-content` must stay in the component files listed above. Moving them breaks the `is-printing-labels` / `is-printing-price-labels` CSS class timing that hides the UI during print capture. Pure helpers (printer resolution, the cached printer list) are shared on purpose — it is the invoke that is pinned.
- **Print error strings are Electron-version-specific** — `describePrintError` in `desktop/main.ts` matches the descriptive strings Electron passes to the print callback (verified on 40.4.0: `"Invalid deviceName provided"`, `"No printers available on the network"`). It does *not* rely on the older `Error code: N` form, which that version never emits. If Electron is upgraded, re-probe the real strings and update the patterns, or users silently fall back to a generic message.
- **The print window is network-isolated** — `print-html-content` renders unsanitised database-derived HTML, so its `BrowserWindow` uses a dedicated `print-isolated` session partition with a `webRequest` block on every non-`data:` URL, plus a CSP in the template. Do not move that block onto the default session (it would break auto-update) and do not drop the partition.
- **waitForServer timeout** — set to 90 s in `desktop/main.ts` to cover the full Prisma migration + `app.listen()` cycle. Do not reduce this below the longest expected migration time.
- **MUI v6 Grid** — use `<Grid size={{ xs: n, md: m }}>` syntax. The deprecated `item`, `xs`, `md` props have been removed. Fractional grid sizes are not supported; round to the nearest integer.
- **axios params serializer** — the axios instance has a known incompatibility with ISO date strings in `params` objects in certain Vite-bundled environments. Build query strings with native `URLSearchParams` and append them to the URL directly (see `dashboardService.js`).
- **server/node_modules must be bundled explicitly** — `server/node_modules/**/*` is listed in both `files` and `asarUnpack` in `package.json`. electron-builder does not automatically bundle nested node_modules directories the same way it handles the root one. The build workflow must run `npm ci` inside `server/` for these to exist at build time.
- **Build workflow must install server deps** — `build-mac` and `build-win` jobs in `build-release.yml` must each run `npm ci` in the `server/` directory before packaging. Skipping this means `server/node_modules` is empty and server-only packages are missing from the installer.
- **Releases are tag-triggered** — `build-release.yml` only runs on `v*` tag pushes or manual dispatch. Push a tag (`git tag vX.Y.Z && git push origin vX.Y.Z`) to cut a release. Quality workflows (`client-quality`, `server-quality`) run on every main push but do not trigger builds.
