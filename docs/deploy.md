# Deploying OverStorm

OverStorm is split across two hosts:

| Part | Location in repo | Host |
|---|---|---|
| Backend | `convex/` | [Convex Cloud](https://convex.dev) |
| Frontend | `frontend/` | [Vercel](https://vercel.com) |

## Vercel setup (required)

The Next.js app lives in **`frontend/`**, but imports **`convex/_generated`** from the repo root.

### Project settings

1. **Settings → General → Root Directory** → **`frontend`**
2. Enable **Include source files outside of the Root Directory in the Build Step**
3. **Framework Preset** → **Next.js**
4. **Settings → Environment Variables** → add `NEXT_PUBLIC_CONVEX_URL` (see below)
5. **Redeploy**

`frontend/vercel.json` already configures:

- **Install:** `npm install --prefix .. && npm install` (installs `convex` at repo root + frontend deps)
- **Build:** `npm run build`

`frontend/next.config.ts` aliases `convex/server` and `convex/react` to `frontend/node_modules/convex` so Turbopack can bundle repo-root `convex/_generated/api.js`.

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
