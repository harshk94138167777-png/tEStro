# tEStro

**Authorized and educational use only.** tEStro is a **MERN-stack** (MongoDB, Express, React, Node.js) cybersecurity **testing lab**. It runs **safe simulations** and **strictly bounded localhost checks**. It does **not** provide unrestricted attack capability against the public internet.

> **Stack note:** This repository implements the full app in **MERN only**. There is **no Python/Flask microservice**; the premium “ML intelligence” module uses a **documented heuristic placeholder** in Node.js so the project stays deployable as a single backend process.

---

## Features

| Area | Description |
|------|-------------|
| **Auth** | JWT signup/login/logout; roles `free`, `premium`, `admin` (bcrypt, protected routes). |
| **Dashboard** | Dark SOC-style UI, sidebar with icons, overview cards, **module grid**, recent tests, live plan limits from `/api/health`. |
| **Modules** | Injection, cross-site, authentication, **traffic (safe load)**, **API probe + rate-limit batch**, security headers, file/path — all with validation & logging. |
| **Reports** | Recharts graphs, MongoDB-backed history, **JSON + PDF** export. |
| **AI assistant** | Chat-style helper via OpenAI API (optional key). |
| **Premium ML** | Heuristic risk scoring & test suggestions (`POST /api/modules/ml/analyze`) — **premium/admin only**. |
| **Safeguards** | Helmet, global + scoped rate limits, localhost-only live HTTP, warnings in UI, capped concurrent requests. |

---

## Architecture

```
tEStro/
├── backend/ # Express REST API
│   └── src/
│       ├── config/          # db.js, plans.js (RPM / batch caps)
│       ├── controllers/
│       ├── middleware/
│       ├── models/          # User, TestResult (tests), AuditLog (logs)
│       ├── routes/
│       ├── services/
│       ├── utils/           # simulations, URL safety
│       └── server.js
├── frontend/                # React (Vite) + Tailwind + Recharts
│   └── src/
│       ├── components/      # Layout, Sidebar, ProtectedRoute, …
│       ├── context/
│       ├── pages/
│       └── services/
└── README.md
```

---

## Plan limits (traffic / rate APIs)

Defaults align with **free20–50 RPM** and **premium 100–1000 RPM** (clamped in `backend/src/config/plans.js`). Tunable via environment variables — see `backend/.env.example`.

- **Free:** lower RPM to backend traffic endpoints, smaller per-run load simulation & rate-test batch sizes.
- **Premium / Admin:** higher ceilings; **ML intelligence** route enabled on frontend for premium/admin.

---

## MongoDB setup

See **MongoDB Atlas** steps in earlier sections or use **local MongoDB**:

```env
MONGODB_URL=mongodb://127.0.0.1:27017/tEStroDB
```

Atlas: copy `backend/.env.example` → `backend/.env` and set `MONGO_URI` or split `MONGO_ATLAS_*` variables as documented in the example file.

---

## First admin user

Registrations default to **`free`**. To grant **admin** (user management + all premium capabilities):

1. Register via the UI.  
2. In MongoDB, set that user’s `role` to `admin` in the `users` collection.  
3. Log out and log back in (or clear `localStorage` key `testro_token`).

---

## Run locally

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env — Mongo URL, JWT_SECRET, optional OPENAI_API_KEY and PLAN_* overrides
npm install
npm run dev
```

API: `http://localhost:5000` — `GET /api/health` returns DB status and **planLimits**.

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to the backend.

---

## Security & misuse prevention

- **Live HTTP** (traffic, API probe, rate-test batch, header check): localhost-only by default. Set `ALLOW_LIVE_TESTING=true` in `backend/.env` to allow authorized real API links.  
- **Pattern modules** (SQL/XSS/path, etc.): **offline analysis** — no blind SSRF.  
- **Rate limiting:** Express `rate-limit` on auth, AI, and **traffic-related module routes** with plan-based RPM.  
- **Payload limits:** Small JSON body cap on the API.  
- **UI:** Persistent authorized-use messaging.

---

## License / use

Use tEStro only where you have **explicit authorization**. The authors are not responsible for misuse.
