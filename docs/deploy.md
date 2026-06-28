# Deploying OverStorm

OverStorm is split across two hosts:

| Part | Location in repo | Host |
|---|---|---|
| Backend | `convex/` | [Convex Cloud](https://convex.dev) |
| Frontend | `frontend/` | [Vercel](https://vercel.com) |

## Vercel setup (required)

The Next.js app lives in **`frontend/`**, but it imports types from **`convex/_generated`** at the repo root.

### Option A — deploy from repo root (recommended)

1. Vercel Dashboard → **Settings → General**
2. **Root Directory** → leave **empty** (clear it if set to `frontend`)
3. Repo-root `vercel.json` handles install/build inside `frontend/`
4. Add **`NEXT_PUBLIC_CONVEX_URL`** (see below)
5. **Redeploy**

### Option B — Root Directory = `frontend`

1. Set **Root Directory** to **`frontend`**
2. Enable **Include source files outside of the Root Directory in the Build Step**
3. Add **`NEXT_PUBLIC_CONVEX_URL`**
4. Redeploy

## Environment variables

| Variable | Where | Value |
|---|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | Vercel (Production + Preview) | Your prod Convex URL, e.g. `https://accurate-jackal-294.convex.cloud` |

Backend secrets belong in **Convex prod**, not Vercel:

```bash
npx convex env set OPENAI_API_KEY "your-key" --prod
npx convex env set FIBER_API_KEY "your-key" --prod
npx convex env set ORANGESLICE_API_KEY "your-key" --prod   # optional
```

## Deploy Convex (production)

From the **repository root**:

```bash
npx convex deploy
npx convex run seed:seedDashboard --prod
```

## Verify

- `https://your-app.vercel.app/` — storm dashboard
- `https://your-app.vercel.app/opportunities` — property workspace

If the site loads but has no data, re-run `seed:seedDashboard --prod` or check `NEXT_PUBLIC_CONVEX_URL`.

## Local development

```bash
# Terminal 1 — repo root
npx convex dev

# Terminal 2 — frontend
cd frontend
npm run dev
```

Use `frontend/.env.local`:

```
NEXT_PUBLIC_CONVEX_URL=https://your-dev-deployment.convex.cloud
```
