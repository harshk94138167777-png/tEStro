# Deployment checklist — Render (backend) & Vercel (frontend)

## Backend (Render)
- Create a new Web Service and connect repo.
- Set these environment variables in Render:
  - `MONGODB_URL` — your Atlas connection string (keep secret).
  - `JWT_SECRET` — a long random secret.
  - `NODE_ENV=production`
  - `FRONTEND_URL` — your frontend URL (e.g. https://your-site.vercel.app)
  - `OPENAI_API_KEY` if needed
- Build/Start command: `npm install && npm run build` (if you add a build) or `npm install` then Start command: `npm start`.
- Instance: ensure Node 18+ runtime.
- Render will provide `PORT` automatically; the server reads `process.env.PORT`.

## Frontend (Vercel)
- In Vercel project settings set environment variable:
  - `VITE_API_URL` = https://your-backend-url (include scheme)
- Build command: `npm run build`
- Output directory: `dist`

## Secrets & repo hygiene
- Remove secrets from committed files; use platform env vars.
- Add `.env` to `.gitignore` if not already ignored.

## Local dev notes
- For local dev keep `backend/.env` with dev settings. Vite dev server proxies `/api` to `http://localhost:5000` per `vite.config.js`.

## Verification
- After deploy set `FRONTEND_URL` and `VITE_API_URL`, then:
  - Visit frontend URL and confirm UI loads.
  - Call `GET /api/health` on backend to confirm DB connection and plan limits.

