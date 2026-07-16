# AIROD Dashboard — Go-Live Guide

Your dashboard now saves everything to your Neon Postgres database through a small API, instead of the browser's localStorage. Anyone who opens the link sees the same shared data, and open pages auto-refresh every 45 seconds.

## What's in this folder

```
airod-live/
├── public/index.html   ← your dashboard (load/save now goes through the API)
├── api/state.js        ← serverless API: GET reads state, PUT saves state to Neon
├── package.json        ← declares the Neon driver dependency
└── README.md           ← this guide
```

## Deploy with Vercel (free, ~10 minutes)

### Step 1 — Get your Neon connection string
1. Go to https://console.neon.tech and open your project.
2. Click **Connect** (or "Connection Details") and copy the **connection string**. It looks like:
   `postgresql://user:password@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`

### Step 2 — Create a Vercel account & upload the project
Easiest way (no coding tools needed):
1. Go to https://vercel.com and sign up (free "Hobby" plan).
2. Install the Vercel CLI, or use the GitHub route below.

**Option A — GitHub (recommended):**
1. Create a new repository on https://github.com (private is fine).
2. Upload all files/folders from this project (keep the folder structure: `public/`, `api/`, `package.json`).
3. In Vercel, click **Add New → Project**, import that GitHub repo.

**Option B — Vercel CLI (if you have Node.js installed):**
```bash
npm i -g vercel
cd airod-live
vercel
```

### Step 3 — Add your database URL as an environment variable
In the Vercel project setup screen (or later under **Settings → Environment Variables**):
- **Name:** `DATABASE_URL`
- **Value:** your Neon connection string from Step 1
- Apply to all environments, then click **Deploy** (or redeploy if you added it after).

### Step 4 — Done
Vercel gives you a URL like `https://airod-dashboard.vercel.app`. Share that link — anyone can open it, log in, and see the same live data. When an editor/admin changes a status, it saves straight to Neon, and everyone else's page picks it up on next load (or within 45 seconds if already open).

You don't need to create the table manually — the API runs `CREATE TABLE IF NOT EXISTS airod_state` automatically on first use.

## How it works
- **GET /api/state** → returns the JSON blob from the `airod_state` table (row id=1).
- **PUT /api/state** → upserts the whole state JSON into that row.
- The page falls back to localStorage only if the server is unreachable (offline mode).
- Concurrency is "last write wins" — fine for a small team, but avoid two admins editing the exact same thing at the same moment.

## Important security notes
- The login screen is **client-side only** — it controls what the UI shows, but the data itself is readable/writable by anyone who knows the API URL. For an internal-team dashboard shared by link this is usually acceptable, but don't put sensitive data in it.
- If you later want real protection, the next step is moving the login check into the API (verify the password hash server-side and require a token on PUT requests). Happy to help with that.
- User accounts and password hashes are stored inside the same state blob (same as before) — changing a password from the Users panel works as it did.

## Troubleshooting
- **"Server error" or nothing loads:** check that `DATABASE_URL` is set correctly in Vercel → Settings → Environment Variables, then redeploy.
- **Changes not appearing for others:** hard-refresh (Ctrl+Shift+R). The save flash ("saved") in the top bar confirms the write reached the database.
- **Neon free tier sleeping:** Neon suspends idle databases; the first request after a while may take 1–2 seconds to wake it up. That's normal.
