# Deploy VendorBridge — Vercel (frontend) + Railway (backend + database)

## Architecture

| Service | Platform | What runs |
|---------|----------|-----------|
| React frontend | **Vercel** | Static Vite build from repo root |
| Express API | **Railway** | `server/` folder |
| Database | **Railway PostgreSQL** | App state stored in `app_store` table |

---

## Prerequisites

1. [GitHub](https://github.com) account — push this project to a repo
2. [Vercel](https://vercel.com) account
3. [Railway](https://railway.app) account
4. Gmail app password (for OTP / invoice emails) — optional but recommended

---

## Step 1 — Push code to GitHub

```bash
cd odoo-ksv-beta-3
git init
git add .
git commit -m "VendorBridge initial deploy"
git remote add origin https://github.com/YOUR_USER/vendorbridge.git
git push -u origin main
```

> Do **not** commit `server/.env` (contains secrets). It is gitignored.

---

## Step 2 — Deploy backend on Railway

### 2a. Create the API service

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select your repository
3. Railway creates a service — open **Settings**:
   - **Root Directory**: `server`
   - **Watch Paths**: `server/**`

### 2b. Add PostgreSQL database

1. In the same Railway project → **+ New** → **Database** → **PostgreSQL**
2. Railway creates `DATABASE_URL` automatically
3. Open your **API service** → **Variables** → **Add Reference** → link `DATABASE_URL` from the Postgres service

### 2c. Set environment variables (API service)

In Railway → your API service → **Variables**, add:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Long random string (32+ characters) |
| `ALLOWED_ORIGINS` | `https://YOUR-VERCEL-APP.vercel.app` (update after Step 3) |
| `APP_URL` | `https://YOUR-VERCEL-APP.vercel.app` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | Your Gmail address |
| `SMTP_PASSWORD` | Gmail [app password](https://myaccount.google.com/apppasswords) |
| `SMTP_FROM_NAME` | `VendorBridge` |

`PORT` and `DATABASE_URL` are set automatically by Railway.

### 2d. Deploy

Railway runs:

```
npm install && npm run build
npm run start:prod   # migrates DB, then starts API
```

### 2e. Get your API URL

1. API service → **Settings** → **Networking** → **Generate Domain**
2. Copy the URL, e.g. `https://vendorbridge-api-production.up.railway.app`
3. Test: `https://YOUR-API-URL.up.railway.app/api/health`

You should see `"backend": "postgresql"` in the health response when the database is linked.

### Default admin (first boot)

- Email: `shreenathpillai1696@gmail.com`
- Password: `Admin@123`

Change the password after first login in production.

---

## Step 3 — Deploy frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your GitHub repo
2. **Framework Preset**: Vite
3. **Root Directory**: `.` (repo root, not `server`)
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`

### Environment variables (Vercel)

| Variable | Value |
|----------|-------|
| `VITE_API_BASE_URL` | `https://YOUR-API-URL.up.railway.app/api` |

6. Click **Deploy**

### 3b. Update Railway CORS

After Vercel gives you a URL (e.g. `https://vendorbridge.vercel.app`):

1. Railway → API service → **Variables**
2. Update `ALLOWED_ORIGINS` to: `https://vendorbridge.vercel.app`
3. Update `APP_URL` to the same Vercel URL
4. Redeploy the API service

---

## Step 4 — Verify end-to-end

1. Open your Vercel URL
2. Login as admin: `shreenathpillai1696@gmail.com` / `Admin@123`
3. Register a test user → approve as admin
4. Create RFQ as procurement officer → manager approves with star rating
5. Check `GET /api/health` — database should show `postgresql` backend with record counts

---

## Troubleshooting

### CORS errors in browser

- Ensure `ALLOWED_ORIGINS` on Railway includes your exact Vercel URL (no trailing slash)
- Redeploy API after changing env vars

### API returns 502 / won't start

- Check Railway **Deploy Logs**
- Confirm `JWT_SECRET` is set (min 16 chars)
- Confirm PostgreSQL is linked and `DATABASE_URL` is referenced

### Login works locally but not production

- `VITE_API_BASE_URL` must end with `/api`
- Rebuild Vercel after changing `VITE_*` variables (they are baked in at build time)

### Data lost after redeploy

- Ensure PostgreSQL service is linked — file storage does not persist on Railway without a volume
- Health check should show `"backend": "postgresql"`

### Emails not sending

- Use a Gmail **app password**, not your regular password
- Enable 2FA on Google account first

---

## Local development (unchanged)

```bash
# Terminal 1 — API
cd server
cp .env.example .env   # edit locally
npm install
npm run dev

# Terminal 2 — Frontend
cd ..
npm install
npm run dev
```

Frontend: http://localhost:5173  
API: http://localhost:8000

---

## Optional: custom domains

- **Vercel**: Project → Settings → Domains
- **Railway**: Service → Settings → Networking → Custom Domain

Update `ALLOWED_ORIGINS`, `APP_URL`, and `VITE_API_BASE_URL` to match your custom domains.
