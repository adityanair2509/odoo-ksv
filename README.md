# VendorBridge

**Procurement & vendor management ERP** for organizations that need a clear, end-to-end workflow — from vendor onboarding and RFQs through quotation comparison, manager approvals, purchase orders, and invoicing.

Built as a modern full-stack web app with role-based access, live dashboards, email notifications, and persistent PostgreSQL storage in production.

---

## Live demo

| Service | URL |
|---------|-----|
| Frontend | [https://odoo-ksv-beta-3.vercel.app](https://odoo-ksv-beta-3.vercel.app) |
| API | [https://odoo-ksv-production.up.railway.app](https://odoo-ksv-production.up.railway.app) |
| Health check | [https://odoo-ksv-production.up.railway.app/api/health](https://odoo-ksv-production.up.railway.app/api/health) |

** admin (first boot)**

| Email | Password |
|-------|----------|
| `shreenathpillai1696@gmail.com` | `Admin@123` |

Change the admin password after your first login in production.

---

## Team

| Name | Role |
|------|------|
| **Aryan Kumar** | Frontend Designer |
| **Tanay Sagar** | Database Engineer & Frontend Developer |
| **Shreenath Pillai** | Backend Designer & Developer |
| **Aditya Nair** | Backend Designer & Developer |

---

## Features

### Procurement workflow
- **RFQ management** — create RFQs, assign vendors, track status from draft to awarded
- **Quotation comparison** — side-by-side vendor quotes with AI-style summary and vendor switching
- **Manager approvals** — approval chain tied to the procurement officer and selected vendor, with 1–5 star vendor ratings
- **Purchase orders** — auto-generated POs after approval, with vendor registration details on record
- **Invoices** — PDF generation, email delivery, and payment tracking

### Vendor management
- **Vendor directory** — searchable list with registration details (contact, email, phone, country)
- **Vendor registration** — self-service signup with admin approval before login
- **GSTIN verification** — validate vendor tax IDs during onboarding

### Platform
- **Role-based access** — Admin, Procurement Officer, Manager, and Vendor roles
- **OTP & email** — Gmail SMTP for registration, approval, and invoice notifications
- **Live dashboards & reports** — charts and KPIs backed by real API data (no mock mode in production)
- **Persistent storage** — PostgreSQL in production; local JSON file fallback for development
- **JWT authentication** — stateless auth with bcrypt password hashing

---

## Architecture

```
odoo-ksv-beta-3/
├── src/                          # React + Vite frontend
│   ├── pages/                    # Dashboard, RFQs, quotations, approvals, invoices, vendors…
│   ├── components/               # Shared UI (StarRating, layout, forms)
│   ├── services/                 # API client (axios)
│   └── mock/                     # Legacy seed data (dev only)
├── server/                       # Express + TypeScript API
│   ├── src/
│   │   ├── index.ts              # App bootstrap, CORS, routes
│   │   ├── db.ts                 # Data layer (PostgreSQL or in-memory)
│   │   ├── persistence.ts        # JSON / PostgreSQL persistence
│   │   ├── emailService.ts       # SMTP notifications & invoice emails
│   │   ├── routes/               # auth, vendors, rfqs, quotations, POs, invoices, approvals
│   │   └── scripts/migrate.ts    # Database migration
│   ├── database/                 # Railway PostgreSQL bootstrap SQL
│   └── railway.toml              # Railway deploy config
├── vercel.json                   # Vercel frontend config
├── DEPLOY.md                     # Full deployment guide
└── package.json                  # Frontend dependencies
```

### Deployment topology

| Layer | Platform | Details |
|-------|----------|---------|
| Frontend | **Vercel** | Static Vite build from repo root |
| API | **Railway** | Express server from `server/` |
| Database | **Railway PostgreSQL** | App state in `app_store` table |

See [DEPLOY.md](./DEPLOY.md) for step-by-step deployment instructions.

---

## Tech stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, React Router, Recharts, Axios, jsPDF |
| Backend | Node.js, Express, TypeScript, Zod validation |
| Database | PostgreSQL (production), JSON file / in-memory (local dev) |
| Auth | JWT, bcrypt |
| Email | Nodemailer + Gmail SMTP |
| PDF | PDFKit |

---

## Quick start (local development)

You need **two terminals** running at the same time.

### Terminal 1 — Backend

```powershell
cd server
npm install
npm run dev          # http://localhost:8000
```

### Terminal 2 — Frontend

```powershell
npm install
npm run dev          # http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) and log in with the admin credentials above.

### Optional — PostgreSQL locally

Set `DATABASE_URL` in `server/.env` to use PostgreSQL instead of the local JSON store. Without it, the API falls back to `server/data/store.json`.

---

## User roles

| Role | Capabilities |
|------|--------------|
| **Admin** | Approve registrations, manage users, full system access |
| **Procurement Officer** | Create RFQs, manage vendors, compare quotations, select vendors |
| **Manager** | Review and approve/reject requests, rate vendors (1–5 stars) |
| **Vendor** | View assigned RFQs, submit quotations, track POs and invoices |

---

## API overview

All routes are under `/api`. Protected routes require `Authorization: Bearer <token>`.

| Resource | Key endpoints |
|----------|---------------|
| Auth | `POST /auth/login`, `GET /auth/me`, `POST /auth/register` |
| Vendors | `GET /vendors`, `POST /vendors`, `POST /vendors/verify-gstin` |
| RFQs | `GET /rfqs`, `POST /rfqs`, `POST /rfqs/:id/send` |
| Quotations | `GET /quotations/rfqs/:rfqId/quotations`, `POST /quotations/:id/select` |
| Purchase Orders | `GET /purchase-orders`, `POST /purchase-orders/:id/mark-paid` |
| Invoices | `GET /invoices/:id`, `POST /invoices/:id/send-email`, `GET /invoices/:id/pdf` |
| Approvals | `GET /approvals`, `POST /approvals/:id/approve`, `POST /approvals/:id/reject` |
| Health | `GET /health` |

### Error format

```json
{ "message": "Human readable", "code": "MACHINE_CODE", "details": "..." }
```

| Status | Meaning |
|--------|---------|
| `400` | Validation failed |
| `401` | Missing or invalid token |
| `403` | Insufficient role permissions |
| `404` | Resource not found |
| `500` | Server error |

---

## Environment variables

### `server/.env`

| Variable | Purpose |
|----------|---------|
| `PORT` | HTTP port (default `8000`) |
| `JWT_SECRET` | Signs JWTs — use a long random string in production |
| `ALLOWED_ORIGINS` | CORS allow-list (comma-separated) |
| `APP_URL` | Frontend URL for email links |
| `DATABASE_URL` | PostgreSQL connection string (optional locally) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | Email delivery |

### `.env` (frontend root)

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Backend API base URL (default `http://localhost:8000/api`) |
| `VITE_USE_MOCK` | Set `true` to use in-process mocks without the backend |

---

## Scripts

| Command | Where | Description |
|---------|-------|-------------|
| `npm run dev` | root | Vite dev server with HMR |
| `npm run build` | root | Type-check + production frontend bundle |
| `npm run dev` | `server/` | API with hot reload (`tsx watch`) |
| `npm run build` | `server/` | Compile TypeScript to `dist/` |
| `npm run start:prod` | `server/` | Migrate DB, then start API |
| `npm run db:migrate` | `server/` | Run database migration manually |

### Smoke test

```powershell
cd server
powershell -ExecutionPolicy Bypass -File smoke-test.ps1
```

---

## Repository

GitHub: [adityanair2509/odoo-ksv](https://github.com/adityanair2509/odoo-ksv)

---

## License

Private project — all rights reserved.
