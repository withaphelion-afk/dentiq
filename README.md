# Dentiq

Fast, minimal CRM for **Gagneja Dental Clinic**, built for a doctor who logs everything themselves (no reception).

MERN app, JavaScript only.

| Folder | What |
| --- | --- |
| `dentiq-fe/` | Frontend: React + Vite + Tailwind |
| `dentiq-be/` | Backend: Node + Express + MongoDB |

## Run locally

Backend (copy `.env.example` to `.env` first; `MONGO_URI=memory` gives a throwaway DB with demo data):

```bash
cd dentiq-be
npm install
npm run dev
```

Frontend (proxies `/api` to the backend on port 4000):

```bash
cd dentiq-fe
npm install
npm run dev
```

Open http://localhost:5173. Works on desktop and mobile.

## Frontend structure (`dentiq-fe/`)

- `src/components/Splash.jsx`: 3D jaw startup screen (three.js, lazy-loaded)
- `src/components/Shimmer.jsx`: tooth-shaped skeleton loaders
- `src/components/Layout.jsx`: sidebar (desktop), bottom nav (mobile), instant patient search
- `src/pages/Dashboard.jsx`: Today screen
- `src/forms/`: New Visit and New Patient sheets
- `src/data/store.jsx`: app state (patients, queue, payments). Swap for API calls when the backend is added.
- `src/data/mock.js`: dummy data

## Font

The app uses **Daikon**. Put the font files in `dentiq-fe/public/fonts/` as `Daikon-Regular`, `Daikon-Medium` and `Daikon-Bold` (`.woff2` or `.otf`). Until then it falls back to Plus Jakarta Sans.

## Deployment

- **Frontend:** every push to `main` that changes `dentiq-fe/` deploys to Vercel via `.github/workflows/deploy-frontend.yml` (needs repo secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`). Set `VITE_API_URL` in Vercel to the hosted backend's `/api` URL.
- **CI:** `.github/workflows/ci.yml` lints and builds the frontend and runs backend tests on every push and PR.

## WhatsApp reminders

Without setup, reminders are tap-to-send from the Today screen (opens WhatsApp with the message ready). To send automatically, set `WA_TOKEN` and `WA_PHONE_NUMBER_ID` (WhatsApp Business Cloud API) and approved template names in `dentiq-be/.env`.
