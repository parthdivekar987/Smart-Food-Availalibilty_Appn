# Smart Restaurant

QR-code dine-in ordering system: guests scan a table QR (or are seated as walk-ins), browse the menu, order, track preparation live and pay; kitchen, waiters and admins each get their own real-time dashboard.

| Part | Stack |
|---|---|
| `backend/` | Node.js, Express, TypeScript, Prisma (PostgreSQL), Socket.IO, optional Redis / Stripe / Cloudinary / SMTP / Google OAuth |
| `frontend/` | React 18, Vite, TypeScript, Tailwind, Zustand, Three.js |

## Quick start (local)

Requirements: Node.js 20+, a PostgreSQL database. Redis is optional (an in-memory fallback is used).

```bash
# 1. Backend
cd backend
cp .env.example .env          # set DATABASE_URL and the secrets
npm ci
npx prisma migrate deploy     # create tables
npm run db:seed               # demo menu, tables and accounts
npm run dev                   # http://localhost:4000

# 2. Frontend (new terminal)
cd frontend
cp .env.example .env
npm ci
npm run dev                   # http://localhost:5173
```

Or with Docker: `docker compose up --build` (Postgres + Redis + backend + frontend).

## Demo accounts (from the seed, password `123456`)

| Role | Email | Lands on |
|---|---|---|
| Super admin | admin@restaurant.com | `/admin` – dashboard, menu, tables & QR codes, staff, orders |
| Waiter | waiter@restaurant.com | `/waiter` – accept orders, serve, take payment |
| Kitchen | kitchen@restaurant.com | `/kitchen` – prepare orders, update prep time |
| Customer | customer@restaurant.com | `/` – order history & profile |

The login page has one-click buttons for each.

## End-to-end flow

1. **Guest is seated** – scans a table QR (signed, versioned token) or taps *Get Seated Now* / picks a free table on the floor plan (walk-in; disable with `ALLOW_WALK_IN=false`).
2. **Orders** – prices are always computed on the server from the database.
3. **Kitchen** moves the order `RECEIVED → PREPARING → READY`; the guest sees updates live.
4. **Waiter** serves it; guest requests the bill.
5. **Payment** – guest pays by card (Stripe, if configured) or the waiter records cash/card/wallet with optional discount. The session closes and the table frees up.
6. **Admin dashboard** reports revenue, top dishes, categories and payment methods.

## Real-time guest experience & owner tracking

- **Cart pop-up**: every add (even a single bread) shows a notification with *Undo* and *View cart*.
- **Staff can add items** to a seated table (Waiter screen → *Add items*, or Admin → *Live Tables*). Every phone at that table is notified instantly, with who added what.
- **Admin → Live Tables**: every seated table with a live activity feed (seated, cart adds, orders, staff additions, bill requests, payment) and a full per-table timeline.
- **Checkout = logout**: when the bill is paid, every device at the table is signed out of the session, its cart and order data are cleared, and a thank-you screen returns it to the scan page. Devices that were offline are logged out as soon as they reconnect or reopen the app.
- **Security**: staff live feeds require a valid login (JWT); guests only receive their own table's events; orders and bills are never broadcast to other guests. Optional `ROTATE_QR_ON_CHECKOUT=true` also invalidates the table QR after each checkout (use only with on-screen QR codes).

## Configuration notes

- **Money & tax**: prices are stored in major units (₹). Tax (default 5% GST) is added at billing. Keep `TAX_RATE`/`PAYMENT_CURRENCY` (backend) in sync with `VITE_TAX_RATE`/`VITE_CURRENCY` (frontend).
- **Phones / QR codes**: set backend `FRONTEND_URL` (and `CORS_ORIGINS`) and frontend `VITE_FRONTEND_URL` to an address your phone can reach, then regenerate QR codes in *Admin → Tables*.
- **Card payments**: set `STRIPE_SECRET_KEY` (backend) and `VITE_STRIPE_PUBLISHABLE_KEY` (frontend). Payments are verified server-side with Stripe; the webhook (`/api/v1/payment/webhook`, `STRIPE_WEBHOOK_SECRET`) is supported too.
- **Menu photos**: stored on local disk (`backend/uploads`) unless `CLOUDINARY_*` is set.
- **Remote databases** (e.g. Neon): transaction timeouts are tunable with `DB_TX_TIMEOUT_MS` / `DB_TX_MAX_WAIT_MS`.

## Checks

```bash
cd backend  && npm run typecheck && npm run test:e2e && npm run test:realtime   # need the backend running
cd frontend && npm run typecheck && npm run build
```

`GET /api/v1/health` reports API and database status. API reference: [API_DOCS.md](API_DOCS.md).
