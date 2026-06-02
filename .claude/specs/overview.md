# Agency CRM — Project Overview

## What we're building
A lead management CRM for a 3-person web agency in Vijayawada.
We scraped ~1,400 businesses from Google Maps across 5 categories
(schools, real estate, interior designs, law, CA firms).
The team calls these leads and sells web services.

## Stack
- Backend: Node.js + Express + PostgreSQL (pg)
- Frontend: React + Vite (no TypeScript)
- Auth: JWT (3 hardcoded users — Ravi, Priya, Suresh)
- Deploy: Railway (backend, frontend, postgres are already provisioned)

## Railway services
- Postgres: already online
- backend service: root dir = /backend
- frontend service: root dir = /frontend

## Repo structure
agency-crm/
├── backend/
│   ├── index.js
│   ├── db.js
│   ├── seed.js
│   ├── data/leads.json
│   └── routes/
│       ├── leads.js
│       └── auth.js
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── api.js
    │   ├── pages/Login.jsx
    │   └── components/
    │       ├── Table.jsx
    │       ├── Kanban.jsx
    │       └── Stats.jsx
    └── vite.config.js
