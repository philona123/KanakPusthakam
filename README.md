# Kanak Pusthakam

Cash book application with magic-link authentication (Supabase), account books, credit/debit ledger entries, and Excel/PDF export.

## Stack

- **web/** — Next.js (App Router), Supabase Auth (magic link)
- **api/** — Express + TypeScript (CRUD + exports)
- **supabase/** — PostgreSQL migrations with RLS

## Setup

1. Create a [Supabase](https://supabase.com) project.
2. Run the SQL in [`supabase/migrations/20251112000000_initial_schema.sql`](supabase/migrations/20251112000000_initial_schema.sql) (SQL Editor or `supabase db push`).
3. In Supabase **Authentication → URL configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`
4. Copy env files:
   - `cp web/.env.local.example web/.env.local`
   - `cp api/.env.example api/.env`
5. Fill in `SUPABASE_URL` / anon key in both env files (`NEXT_PUBLIC_*` in web, `SUPABASE_*` in api).
6. Install and run from the repo root:

```bash
npm install
npm run dev
```

- Web: http://localhost:3000  
- API: http://localhost:4000  

## Usage

1. Open `/login` and request a magic link.
2. Create an **account book** on `/books`.
3. Open a book to add **credit** and **debit** entries (amount, name, category, remarks).
4. Use **Excel** or **PDF** to export the full ledger with running balance.

## Free production deployment

Recommended split: **Supabase** (already hosted) + **Vercel** (Next.js) + **Render** (Express API). All have free tiers suitable for personal use.

### 0. Prerequisites

- GitHub account
- Code pushed to a **public or private** GitHub repository (do not commit `.env` / `.env.local`)
- Supabase migration already applied on your production project

### 1. Supabase (production auth URLs)

1. [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. **Authentication → URL configuration**
   - **Site URL:** `https://<your-vercel-domain>.vercel.app` (set after Vercel deploy if unknown; update once you have the URL)
   - **Redirect URLs** (add each on its own line):
     - `https://<your-vercel-domain>.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback` (optional, for local dev)
3. **Authentication → Email:** ensure Email sign-in / magic link is enabled.
4. Copy **Project URL** and **Publishable key** (Settings → API Keys).

### 2. Deploy Express API on Render (free)

1. [render.com](https://render.com) → sign in with GitHub.
2. **New → Web Service** → connect your repo.
3. Settings:

   | Field | Value |
   |-------|--------|
   | **Name** | e.g. `kanakpusthakam-api` |
   | **Region** | closest to you |
   | **Root Directory** | *(leave empty — repo root)* |
   | **Runtime** | Node |
   | **Build Command** | `npm install && npm run build -w api` |
   | **Start Command** | `npm run start -w api` |
   | **Instance type** | Free |

4. **Environment variables** (Environment → Add):

   | Key | Value |
   |-----|--------|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` (Render sets `PORT`; this matches their default) |
   | `SUPABASE_URL` | your Supabase project URL |
   | `SUPABASE_ANON_KEY` | publishable key |
   | `CORS_ORIGIN` | `https://<your-vercel-domain>.vercel.app` |

5. Deploy. Note the public URL, e.g. `https://kanakpusthakam-api.onrender.com`.
6. Test: `https://<api-url>/health` → `{"status":"ok"}`.

**Note:** Free Render services **sleep after ~15 minutes** of no traffic. The first request after sleep can take 30–60 seconds (cold start).

### 3. Deploy Next.js on Vercel (free)

1. [vercel.com](https://vercel.com) → sign in with GitHub → **Add New → Project**.
2. Import the same repository.
3. **Root Directory:** `web` (Edit → set to `web`).
4. Framework preset: **Next.js** (auto).
5. **Environment variables**:

   | Key | Value |
   |-----|--------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable key |
   | `NEXT_PUBLIC_API_URL` | `https://<your-render-api>.onrender.com` (no trailing slash) |

6. Deploy. Copy the production URL (e.g. `https://kanakpusthakam.vercel.app`).

### 4. Wire production URLs together

1. **Supabase:** set **Site URL** and **Redirect URLs** to your final Vercel URL + `/auth/callback`.
2. **Render:** set `CORS_ORIGIN` to your final Vercel URL (redeploy if you changed it).
3. Open the Vercel site → log in with magic link → create a book → export PDF/Excel.

### 5. Optional: custom domain

- **Vercel:** Project → Settings → Domains → add domain → update Supabase redirect URLs and Render `CORS_ORIGIN`.
- **Render:** Settings → Custom Domain (optional for API).

### 6. Troubleshooting

| Symptom | Check |
|---------|--------|
| Network error on `/books` | API asleep (wait/retry), wrong `NEXT_PUBLIC_API_URL`, or API crash (Render logs) |
| CORS error | `CORS_ORIGIN` on Render must exactly match browser origin (Vercel URL, no trailing slash) |
| Magic link goes to localhost | Supabase **Redirect URLs** missing production `/auth/callback` |
| 401 on API | Logged out or expired session; sign in again |

### Alternatives (also free / low cost)

- **API:** [Fly.io](https://fly.io), [Koyeb](https://www.koyeb.com) — same env vars and start command pattern.
- **Single host:** run API + web on one Fly/Railway machine (more setup; Render + Vercel is simpler for this repo).
