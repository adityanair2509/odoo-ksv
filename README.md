# odoo-ksv — Vendor Bridge

A full-stack procurement workflow app: React + Vite frontend, Node + Express + TypeScript backend with JWT auth and an in-memory data store seeded from the original frontend mocks.

## Architecture

```
c:\odoo ksv\
├── src/                     # React + Vite frontend (port 5173)
│   ├── services/            # Each service file has USE_MOCK branch + real API call
│   ├── mock/                # Original mock data (still used to seed the backend)
│   └── pages/ components/   # UI
├── server/                  # Node + Express + TypeScript backend (port 8000)
│   ├── src/
│   │   ├── index.ts         # Express bootstrap, CORS, route mount
│   │   ├── env.ts           # Zod-validated env loader
│   │   ├── auth.ts          # JWT sign/verify + requireAuth/requireRole middleware
│   │   ├── errors.ts        # AppError class + global error handler
│   │   ├── db.ts            # In-memory data layer (swappable for real DB)
│   │   ├── db.seed.ts       # Static seed data (mirrors src/mock/*)
│   │   ├── types.ts         # Vendor, RFQ, Quotation, PO, Invoice, Approval, User
│   │   └── routes/          # auth, vendors, rfqs, quotations, purchaseOrders, invoices, approvals
│   ├── .env                 # PORT, JWT_SECRET, ALLOWED_ORIGINS
│   ├── package.json         # Independent from frontend
│   └── smoke-test.ps1       # PowerShell smoke test (20 tests)
├── .env                     # VITE_USE_MOCK=false, VITE_API_BASE_URL=http://localhost:8000/api
└── package.json             # Frontend
```

## Quick start

You need **two terminals** running at the same time.

### Terminal 1 — Backend

```powershell
cd "c:\odoo ksv\server"
npm install          # only the first time
npm run dev          # starts on http://localhost:8000
```

### Terminal 2 — Frontend

```powershell
cd "c:\odoo ksv"
npm install          # only the first time
npm run dev          # starts on http://localhost:5173
```

Then open <http://localhost:5173> in your browser and log in.

## Demo accounts

All passwords are `demo123`.

| Email | Role | What they can do |
|---|---|---|
| `admin@vendorbridge.in` | `admin` | Everything |
| `procurement@vendorbridge.in` | `procurement_officer` | Create/edit RFQs & vendors, select quotations, mark invoices paid |
| `manager@vendorbridge.in` | `manager` | Approve / reject approvals, mark POs paid |
| `vendor@vendorbridge.in` | `vendor` | Submit quotations against assigned RFQs |

## API

All routes are mounted under `/api`. All non-auth routes require `Authorization: Bearer <token>`. See `server/src/routes/*.ts` for the full catalog.

| Resource | Endpoints |
|---|---|
| Auth | `POST /auth/login`, `GET /auth/me` |
| Vendors | `GET /vendors`, `GET /vendors/:id`, `POST /vendors`, `PUT /vendors/:id`, `POST /vendors/verify-gstin` |
| RFQs | `GET /rfqs`, `GET /rfqs/:id`, `POST /rfqs`, `POST /rfqs/:id/send` |
| Quotations | `GET /quotations/rfqs/:rfqId/quotations`, `POST /quotations`, `POST /quotations/:id/select` |
| Purchase Orders | `GET /purchase-orders`, `GET /purchase-orders/:id`, `POST /purchase-orders/:id/mark-paid` |
| Invoices | `GET /invoices/po/:poId`, `GET /invoices/:id`, `POST /invoices/:id/mark-paid` |
| Approvals | `GET /approvals`, `GET /approvals/:id`, `POST /approvals/:id/approve`, `POST /approvals/:id/reject` |
| Misc | `GET /health` |

Total: **24 endpoints across 7 resources**.

### Standard error envelope

Every error response has the shape:

```json
{ "message": "Human readable", "code": "MACHINE_CODE", "details": "..." }
```

| Status | When |
|---|---|
| `400` | Validation failed (zod) |
| `401` | Missing/invalid token |
| `403` | Authenticated but role not allowed |
| `404` | Resource not found |
| `500` | Unhandled error |

### Quick smoke test

```powershell
cd "c:\odoo ksv\server"
powershell -ExecutionPolicy Bypass -File smoke-test.ps1
```

Expected output: `PASSED: 20, FAILED: 0`.

## Switching the frontend back to mock mode

If you want to develop the UI without the backend running, edit `.env` at the repo root and set:

```env
VITE_USE_MOCK=true
```

Then restart `npm run dev`. The frontend's `src/services/*.js` files each check this flag and serve from `src/mock/*.js` instead of hitting the API.

## Database

The backend currently uses an **in-memory data layer** (`server/src/db.ts`) that seeds itself from `server/src/db.seed.ts` on every server start. All state is lost on restart.

To plug in a real database:

1. Add your DB driver + ORM to `server/package.json` (e.g. `better-sqlite3` + raw SQL, or `prisma` + `@prisma/client`).
2. Implement the same `db.users`, `db.vendors`, `db.rfqs`, `db.quotations`, `db.purchaseOrders`, `db.invoices`, `db.approvals` interface that `server/src/db.ts` currently exposes.
3. Replace the in-memory implementation. **No route handler needs to change** — they all depend only on the `db` object.
4. Move `db.seed.ts` to a proper migration / seed script for your chosen DB.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 19 + Vite + TypeScript + Tailwind + axios + recharts | Already in the project |
| Backend | Node 20 + Express 4 + TypeScript | Lightest, no native build, fastest start |
| Auth | JWT (`jsonwebtoken`) + bcrypt | Stateless, easy to inspect, no extra services |
| Validation | Zod | Shared types, ergonomic error messages |
| CORS | `cors` middleware, allow-list per env | Standard |
| Data | In-memory `let` arrays | Zero setup, swappable |

## Environment variables

### `server/.env`

| Var | Default | Purpose |
|---|---|---|
| `PORT` | `8000` | HTTP port |
| `JWT_SECRET` | (required, ≥16 chars) | Signs JWTs — **change for production** |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:3000` | CORS allow-list (comma-separated) |

### `.env` (frontend)

| Var | Default | Purpose |
|---|---|---|
| `VITE_USE_MOCK` | `false` | When `true`, frontend uses in-process mocks; when `false`, calls the backend |
| `VITE_API_BASE_URL` | `http://localhost:8000/api` | Where the frontend sends real requests |

## Scripts

| Command | Where | What it does |
|---|---|---|
| `npm run dev` | frontend | Vite dev server with HMR |
| `npm run build` | frontend | Type-check + production bundle |
| `npm run dev` | `server/` | `tsx watch src/index.ts` — auto-reload on save |
| `npm run build` | `server/` | `tsc` — compile to `dist/` |
| `npm start` | `server/` | `node dist/index.js` — run compiled server |
| `npm run typecheck` | `server/` | `tsc --noEmit` — no emit, just type-check |
