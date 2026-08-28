# Trovix — POS for Any Shop

> **Where Retail Meets Intelligence**  
> Trovix is a production-grade, cross-platform Point of Sale (POS) and inventory management application built as an Electron desktop application. It integrates a React frontend, an Express + Prisma + SQLite backend, and an Electron shell into a single, offline-first executable distributed via GitHub Releases with automated background updates.

---

## 📋 Table of Contents

1. [Architectural Overview](#-architectural-overview)
2. [Technology Stack](#-technology-stack)
3. [System Architecture & Communication](#-system-architecture--communication)
4. [Core Features & Business Logic](#-core-features--business-logic)
   - [POS Billing & Multi-Tab Checkout](#pos-billing--multi-tab-checkout)
   - [Batch Tracking & Expiry System](#batch-tracking--expiry-system)
   - [Inventory & Category Management](#inventory--category-management)
   - [Promotions & Category Sales](#promotions--category-sales)
   - [Purchases & Operational Expenses](#purchases--operational-expenses)
   - [Reporting & Analytics](#reporting--analytics)
   - [Direct Printing System](#direct-printing-system)
5. [Authentication & Security Model](#-authentication--security-model)
6. [Data Storage & Persistence Layer](#-data-storage--persistence-layer)
7. [Coding Practices & Architectural Patterns](#-coding-practices--architectural-patterns)
8. [Automated Testing Framework](#-automated-testing-framework)
9. [CI/CD & Release Workflow](#-cicd--release-workflow)
10. [Local Development & Building](#-local-development--building)

---

## 🏗 Architectural Overview

Trovix operates as an **offline-first desktop application** packaging three primary layers inside a single executable:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Electron Desktop Shell                           │
│  (Main Process: desktop/dist/main.js — Auto-Update, IPC, App Lifecycle)     │
│                                                                             │
│  ┌───────────────────────────┐         ┌─────────────────────────────────┐  │
│  │   Renderer Process (UI)   │  HTTP   │   Embedded Express API Server   │  │
│  │   React 19 + TypeScript   ├────────►│   Express 5 + Prisma ORM        │  │
│  │   Vite Dev / file://      │         │   Binds to 127.0.0.1:5001       │  │
│  └─────────────┬─────────────┘         └────────────────┬────────────────┘  │
│                │ Electron IPC                           │ Prisma Engine     │
│                │ (print-manual, etc.)                   ▼                   │
│                └───────────────────────────────► ┌───────────────┐          │
│                                                  │ SQLite DB     │          │
│                                                  │ (pos.db)      │          │
│                                                  └───────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **Desktop Shell (Electron Main Process)**: Manages native window creation, IPC handlers (printing, native dialogs), auto-update feed, database file bootstrapping, and executes the Express server in the same Node.js process.
2. **Frontend (Electron Renderer Process)**: Single Page Application (SPA) built with React 19, TypeScript, and Material UI v6, bundled via Vite. Communicates with the embedded backend via HTTP REST endpoints and with Electron via secure context bridge IPC.
3. **Backend API (Embedded Express Server)**: Micro-backend running inside Node.js on port `5001`, using Prisma ORM to interface with a local SQLite database (`pos.db`). Bound exclusively to `127.0.0.1` for network isolation.

---

## 🛠 Technology Stack

### **Desktop Shell**
* **Runtime**: [Electron](https://www.electronjs.org/) (TypeScript compiled to `desktop/dist/`)
* **Packaging & Distribution**: `electron-builder` (macOS DMG/ZIP, Windows NSIS installer)
* **Auto Updates**: `electron-updater` via GitHub Releases
* **Error Tracking**: `@sentry/electron`

### **Frontend (Client)**
* **Core Framework**: React 19 + TypeScript (Strict Mode)
* **Build Tool**: Vite 7
* **UI Component Library**: Material UI (MUI v6) + Emotion (`@emotion/react`, `@emotion/styled`)
* **Icons**: `@mui/icons-material`
* **Table Virtualization**: `@tanstack/react-virtual`
* **Routing**: `react-router-dom` v7
* **HTTP Client**: Axios
* **Reporting/Export Assets**: `jspdf`, `jspdf-autotable`, `html-to-image`, `react-barcode`
* **Unit Testing**: Vitest + React Testing Library + JSDOM
* **E2E Testing**: Playwright (Chromium, Firefox, WebKit)

### **Backend (Server)**
* **Runtime & Framework**: Node.js 20, Express 5 + TypeScript (Strict Mode)
* **ORM & Database**: Prisma ORM 5 with SQLite (`pos.db`)
* **Validation**: Zod & Joi
* **Password Hashing**: `bcryptjs`
* **Security & Middleware**: `helmet`, `cors`, `express-rate-limit`, `body-parser`
* **Logger**: `pino` + `pino-pretty`
* **Unit Testing**: Jest + `ts-jest` + `jest-mock-extended` + `supertest`

---

## 🔄 System Architecture & Communication

### 1. **Renderer ↔ Server (REST API)**
* Frontend issues HTTP REST requests to `http://localhost:5001/api/*`.
* All API request parameters and payloads are strongly typed using models matching server Zod/Prisma schemas.

### 2. **Renderer ↔ Main Process (Electron IPC)**
* Electron IPC channels are strictly defined in `desktop/ipcChannels.ts` (CommonJS) and mirrored in `client/src/shared/ipcChannels.ts` (ES Module).
* Exposed to the renderer via `desktop/preload.ts` context bridge (`window.electron.ipcRenderer.invoke(...)`).
* IPC is used primarily for silent print tasks (`print-manual`, `print-html-content`), system printer enumeration (`get-printers`), auto-updater status, and window management.

### 3. **Main Process ↔ Embedded Server**
* Main process boots the server in-process via `require('./server-wrapper')`.
* Server readiness is verified by a polling startup check with a 90-second timeout before revealing the main UI window.

---

## 💡 Core Features & Business Logic

### POS Billing & Multi-Tab Checkout
* **Multi-Tab Cart State**: Cashiers can manage multiple active billing carts concurrently. Cart state persists in `sessionStorage` (`usePOSTabs.ts`).
* **High-Speed Product Autocomplete**: Search utilizes a precomputed search index (`usePOSSearch.ts`) covering product titles, barcodes, categories, and batch numbers.
* **Pricing & Discount Logic**: Automatic resolution of standard retail pricing, promotional discounts, wholesale pricing tiers (triggered when min quantity threshold is reached), and item-level/cart-level discounts.
* **Threshold Free Gifts**: Supports promotions where crossing total transaction amounts earns specific free items (`freeGiftThresholdAmount`).
* **Loose Item Sales**: Allows custom uncataloged items to be sold by entering custom title and price on the fly.
* **Double-Payment Guard**: In-flight transactions disable the payment trigger via an `isPaying` state lock, preventing double charges from rapid clicks.

### Batch Tracking & Expiry System
Products support two configurable inventory tracking modes:
1. **Batch Tracking OFF (Default)**:
   * Each product maintains a single logical stock pool.
   * Stock additions accumulate into a primary batch.
   * If multiple MRP pricing tiers exist for a product, POS presents a price-selection dialog (`mode: 'price'`).
2. **Batch Tracking ON**:
   * Stock additions create discrete `Batch` records with auto-generated identifiers (`B-YYYYMMDDHHMMSSmmm`).
   * Each batch maintains independent MRP, cost price, selling price, wholesale tier, and expiry date.
   * POS presents a batch-selection dialog (`mode: 'batch'`) for cashiers to pick specific physical inventory.
   * **Expiry Protection**: Transaction processor (`sale.service.ts`) automatically rejects batches where `expiryDate < current_date`.
   * **Refund Traceability**: Item returns restore inventory directly back to the original consumed `batchId`.

### Inventory & Category Management
* **Virtualized Product Table**: `ProductListTable.tsx` handles large catalogs smoothly using `@tanstack/react-virtual`.
* **Hierarchical Category Tree**: Supports nested categories with drag-and-drop hierarchy adjustments (`CategorySidebar.tsx`).
* **Stock Movements Audit**: Every stock addition, manual edit, or sale logs an immutable audit trail entry in the `StockMovement` table.
* **Low Stock Alerts**: Displays warnings when stock falls below configured `lowStockThreshold`.

### Promotions & Category Sales
* **Scheduled Item Promotions**: Date-bounded promotional prices for individual products.
* **Category-Wide Sales**: Percentage discounts applied across entire product categories, with options for specific product exclusions and custom price overrides.

### Purchases & Operational Expenses
* **Vendor Purchases**: Track supplier stock purchases (`Purchase`, `PurchaseItem`), recording total cost, vendor details, and partial/full payment tracking (`PurchasePayment`).
* **Expense Management**: Log shop operational costs (rent, utilities, salaries) under distinct expense categories with full payment status tracking (`ExpensePayment`).

### Reporting & Analytics
* Analytics dashboard displaying daily/monthly/hourly revenue trends, top-selling items, category breakdowns, low stock reports, and expiring batch reports.

### Direct Printing System
* Direct, silent printing for sales receipts, price tags, and barcode labels via Chromium's native webContents print engine (`mainWindow.webContents.print({ silent: true })`).
* **Printer Resolution Flow** (`resolvePrinterName.ts`): User-configured database printer -> System default printer -> First available connected printer.
* **Print Safety**: Print jobs run through `printWithTimeout` (60s limit) to prevent stalled Windows print spoolers from hanging the UI. Print failures do not roll back completed DB transactions.

---

## 🔒 Authentication & Security Model

```
 ┌─────────────────────────────────────────────────────────────┐
 │                      Security Perimeter                     │
 │                                                             │
 │   1. Localhost Binding                                      │
 │      Express server binds strictly to 127.0.0.1:5001        │
 │                                                             │
 │   2. Localhost Middleware Guard                             │
 │      Rejects any request where req.ip !== 127.0.0.1 / ::1    │
 │                                                             │
 │   3. Strict CORS Policy                                     │
 │      Allowed Origins: null (file://) & http://localhost:*   │
 │                                                             │
 │   4. Network-Isolated Print Window                          │
 │      Dedicated session partition blocking web requests       │
 └─────────────────────────────────────────────────────────────┘
```

1. **Role-Based Access Control (RBAC)**: Supports `admin`, `cashier`, and `salesman` user roles. Passwords are encrypted using `bcryptjs` (salt rounds: 10).
2. **Admin Elevation Dialog**: Destructive or privileged actions (e.g. deleting products, wiping database, modifying settings) require inline admin password confirmation.
3. **Local Network Isolation**: Express server listens strictly on `127.0.0.1`. Middleware explicitly verifies `req.ip` and rejects non-local access.
4. **Database Wipe Protection**: Wiping operational data requires dual verification: Admin password + typing the exact phrase `WIPE ALL DATA` (enforced server-side via Joi schema validation).
5. **Print Window Partitioning**: Unsanitized HTML rendering for price label previews occurs within a isolated Electron web session partition (`print-isolated`) blocking all outgoing network traffic.

---

## 💾 Data Storage & Persistence Layer

* **Primary Database**: SQLite database file (`pos.db`) stored in the operating system's application user data directory (`~/{userData}/pos.db`).
* **Dual-Layer Settings**:
  * **Backend DB (Primary)**: Stored in the `Setting` model (`posReceiptSettings`).
  * **Client localStorage (Cache/Fallback)**: Cached locally for instant offline UI rendering.
* **Startup Database Lifecycle**:
  1. Boot script checks for `pos.db` in `userData`. If missing, copies bundled template file.
  2. Creates automatic safety backup (`pos.db.bak`) prior to running migrations.
  3. Executes `prisma migrate deploy` to apply pending migrations.
  4. Runs password migration routine (`migratePasswordsToHash`).
  5. Seeds initial shop settings and default accounts (`admin / admin123`).

---

## 📐 Coding Practices & Architectural Patterns

### 1. **Frontend: Hook + Shell (SRP) Pattern**
Complex UI components isolate view layout from state and business logic:
* **Shell Component**: Thin presentation file (e.g. `ProductList.tsx`, `AddProductForm.tsx`, `PriceListPanel.tsx`).
* **Custom Hook**: Co-located state manager (e.g. `useProductList.ts`, `useAddProductForm.ts`, `usePriceList.ts`) encapsulating state, API calls, side effects, and event handlers.

### 2. **Backend: Domain-Driven Modular Design**
Backend code is partitioned under `server/src/domains/<domain>/`:
* `<domain>.router.ts`: Express endpoint routes.
* `<domain>.controller.ts`: HTTP request/response handlers wrapped with `asyncHandler`.
* `<domain>.service.ts`: Business logic, Prisma queries, atomic transactions (`prisma.$transaction`).
* `<domain>.validation.ts`: Zod or Joi input sanitization schemas.

### 3. **Strict Type Safety**
* TypeScript `strict: true` and `allowJs: false` enforced across both `client` and `server`.
* Server input types inferred directly from Zod schemas (`z.infer<typeof schema>`).
* Client API models mirror Prisma payload definitions (`client/src/shared/types/models.ts`).
* Defensive error handling using type-safe helpers (`errorMessage.ts`, `getApiErrorMessage`).

---

## 🧪 Automated Testing Framework

| Scope | Technology / Runner | Execution Command | Target & Strategy |
|---|---|---|---|
| **Server Unit Tests** | Jest + `jest-mock-extended` | `cd server && npm test` | Mocks Prisma ORM calls to test domain services, validation logic, and controller endpoints. |
| **Server Test Coverage** | Jest Coverage | `cd server && npm run test:coverage` | Verifies code coverage across services and routes. |
| **Client Unit Tests** | Vitest + React Testing Library | `cd client && npm run test:unit` | Tests React hooks, UI utilities, formatting logic, and component state transitions. |
| **Client E2E Tests** | Playwright | `cd client && npm run test:e2e` | End-to-end user flow automation against Vite preview server (`port 4173`). |
| **Packaged Smoke Tests** | GitHub Actions (macOS & Windows VMs) | CI Workflow (`smoke-mac`, `smoke-win`) | Installs compiled app package, boots headlessly, verifies fresh DB migration & existing DB upgrade. |

---

## 🚀 CI/CD & Release Workflow

Application integration and delivery are automated using **GitHub Actions**:

```
                  ┌────────────────────────────────────────┐
                  │ Push to main / PR — ci.yml             │
                  └───────────────────┬────────────────────┘
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         ▼                            ▼                            ▼
  Typecheck & Lint          Prisma Schema Validation      Jest & Vitest Unit Tests
         │                            │                            │
         └────────────────────────────┼────────────────────────────┘
                                      ▼
                           Playwright E2E Tests
                                      │
                                      ▼
                            CI Status Check Passed
```

```
                  ┌────────────────────────────────────────┐
                  │ Push Git Tag (v*) — build-release.yml  │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                            Quality Gate Job
             (Full Typecheck, Lint, Unit Tests, Sentry Maps)
                                      │
         ┌────────────────────────────┴────────────────────────────┐
         ▼                                                         ▼
  build-mac (macOS Runner)                                  build-win (Windows Runner)
  • Sync version tag                                        • Sync version tag
  • Compile Vite + Express + Electron                       • Compile Vite + Express + Electron
  • Package DMG & ZIP                                       • Package NSIS Setup .exe
  • Generate latest-mac.yml                                 • Generate latest.yml
         │                                                         │
         ▼                                                         ▼
  smoke-mac (Smoke Test DMG)                                smoke-win (Smoke Test EXE)
         │                                                         │
         └────────────────────────────┬────────────────────────────┘
                                      ▼
                             GitHub Release Job
       (Upload DMG, EXE, latest.yml, latest-mac.yml to GitHub Releases)
```

1. **Continuous Integration (`ci.yml`)**:
   * Triggers on push or pull request to `main`.
   * Runs TypeScript typechecking (`typecheck:all`), ESLint, Prisma schema diff validation, server unit tests with coverage, client unit tests, build validation, and Playwright E2E tests.
2. **Release Workflow (`build-release.yml`)**:
   * Triggers on pushing a tag starting with `v` (e.g. `git tag v1.2.0 && git push origin v1.2.0`).
   * **Quality Gate**: Runs full build and test suites, uploads Sentry sourcemaps.
   * **Cross-Platform Compilation**: Compiles macOS (DMG/ZIP) on `macos-latest` and Windows (NSIS x64) on `windows-latest`. Auto-updates version across packages.
   * **Packaged Smoke Tests**: Executes automated smoke tests against actual installed binaries on clean CI virtual machines to ensure the packaged SQLite database and server initialize properly.
   * **Publishing**: Publishes binary installers and updater manifests (`latest.yml`, `latest-mac.yml`) to GitHub Releases.

---

## 💻 Local Development & Building

### Prerequisites
* **Node.js**: `v20.x` or higher
* **npm**: `v10.x` or higher

### Initial Setup
Clone the repository and install dependencies across all packages:
```bash
# Install root dependencies
npm ci

# Install client dependencies
cd client && npm ci && cd ..

# Install server dependencies
cd server && npm ci && cd ..

# Generate Prisma Client
cd server && npx prisma generate && cd ..
```

### Running the Application
```bash
# Option 1: Full Desktop Electron App (Recommended)
npm run electron-dev

# Option 2: Web Dev Mode (Browser + Server concurrently)
npm run dev
# React Client: http://localhost:5173
# Express API:   http://localhost:5001
```

### Running Test Suites
```bash
# Run all TypeScript typechecks
npm run typecheck:all

# Run server unit tests
cd server && npm test

# Run client unit tests
cd client && npm run test:unit

# Run Playwright E2E tests
cd client && npm run test:e2e
```

### Building & Packaging Executables
```bash
# Compile TypeScript for server and desktop
npm run server-build
npm run desktop-build

# Build React client bundle
npm run client-build

# Package Electron app locally (output in dist/)
npm run electron-pack
```
