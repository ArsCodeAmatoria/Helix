# Proven

Mobile-first construction workforce & safety prototype for crane, rigging, concrete, and formwork crews.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Framer Motion
- Lucide Icons
- React Hook Form / Zod (schemas ready)
- Configuration-driven JSON mock database

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## PWA

Proven installs as a Progressive Web App (standalone) in production.

- Web app manifest: `/manifest.webmanifest`
- Service worker via Serwist (`@serwist/turbopack`) at `/serwist/sw.js`
- Offline fallback: `/~offline`
- Icons: `public/icons/`

Service worker registration is disabled in `next dev`. Use a production build to test install/offline:

```bash
npm run build && npm start
```

Then open the site and use **Install app** (Chrome/Edge) or **Add to Home Screen** (iOS Safari).

## Features

- **Home** — today's assigned projects with weather, crew, and **Start Today's FLHA**
- **Dynamic FLHA engine** — select tasks → hazards & controls auto-load → worker confirms
- **Conditional ladder module** when Ladder Work is selected
- **Project / worker / equipment / documents** auto-populated from JSON config
- **Photos, voice notes, signatures, GPS, PDF preview**
- **Dashboard** — deficiencies, corrective actions, weather alerts
- **Dark / light mode** + bottom navigation
- **Offline-friendly** FLHA draft persistence via `localStorage`

## Config-driven data

All trades, tasks, hazards, controls, equipment, and documents live under `src/data/`. Adding a new trade is a data change, not a UI rewrite.
