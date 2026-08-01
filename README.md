# Helix

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
