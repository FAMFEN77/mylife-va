# Taskee – Virtuele AI-Assistent & Operations Suite

Taskee is een end-to-end SaaS-platform dat zorg‑ en facilitair teams helpt om planning, taken, quality control en klantcommunicatie vanuit één omgeving te runnen. Een AI-assistent (OpenAI) voert acties uit, terwijl de gebruikersinterface modules aanbiedt voor dagelijkse operaties – volledig geïntegreerd met Google Workspace en Stripe.

---

## 🚀 Hoogtepunten
- **AI Copilot**: begrijpt intents (taken, reminders, calendar, e-mail, groceries, file summarize) en voert direct acties uit via Google APIs.
- **Module-bibliotheek**: tasks, reminders, planner, availability, trips, time tracking, leave requests, inspections, invoices, expenses, documents & meer.
- **Enterprise proof**: NestJS backend met Prisma + PostgreSQL, Next.js 14 frontend, JWT-auth, Google OAuth en Stripe billing.
- **Ops-friendly**: duidelijke approval flows, dashboards, filters & statuskaarten voor managers.

Bekijk voor de volledige requirements de [MyLife-VA-Full-Project-and-Safe-Migration-Spec.md](./MyLife-VA-Full-Project-and-Safe-Migration-Spec.md).

---

## 🧱 Architectuur & Stack
| Laag        | Technologie | Details |
|-------------|-------------|---------|
| Frontend    | Next.js 14 (App Router), TailwindCSS, TypeScript | Context-based auth, rol-gebonden navigatie, modulair componentensysteem, PWA manifest. |
| Backend     | NestJS 10, Prisma ORM, TypeScript | Gescheiden modules (Assistant, Auth, Tasks, Reminders, Google, Stripe, etc.), guards & interceptors, Swagger docs. |
| Database    | PostgreSQL (Neon of lokaal) | Prisma schema + migraties (`backend/prisma`). |
| Integraties | Google Calendar & Gmail, Stripe Billing, Mailgun fallback | OAuth-token beheer per user, webhooks voor Stripe, e-mailservices. |
| Infra       | Docker Compose (backend + frontend), pnpm workspaces | Zie `docker-compose.yml` en scripts in `/scripts`. |

---

## ✅ Functies per Domein
- **Assistant**: intent-detectie, fallback responses, scheduling + e-mail automatisering.
- **Productivity**: tasks, boards (kanban), reminders, availability, planner suggestions.
- **Operations**: klantenregistratie (CRM) mét documentuploads, time & trip tracking, expenses, leave, inspections, invoices, rooms.
- **Billing**: Stripe checkout sessies + webhooks → premium flag op gebruiker.
- **Security**: magic link + JWT login, Google OAuth, password reset, role-based guards (MANAGER / MEMBER).

Een volledige walkthrough staat in [`docs/handbook.md`](./docs/handbook.md) en de deployment/config instructies in [`docs/config-deployment-handbook.md`](./docs/config-deployment-handbook.md).

---

## 🔧 Installatie (lokale ontwikkeling)
### 1. Voorwaarden
- Node.js 18+
- pnpm 8+
- Docker (optioneel maar aanbevolen)
- PostgreSQL (lokaal of managed)

### 2. Environment variabelen
Maak kopieën van de voorbeeldbestanden (of creëer zelf):
- `backend/.env`
- `backend/.env.docker`
- `frontend/.env.local`
- `frontend/.env`

Belangrijkste variabelen:
```
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
STRIPE_SECRET_KEY=...
MAILGUN_API_KEY=... (optioneel)
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Dependencies installeren
```bash
cd backend && pnpm install
cd ../frontend && pnpm install
```

### 4. Prisma migraties
```bash
cd backend
pnpm prisma migrate deploy   # of pnpm prisma migrate dev
pnpm prisma generate
```

### 5. Project starten
```bash
# Backend
cd backend
pnpm run start:dev           # http://localhost:4000 (Swagger op /swagger)

# Frontend
cd ../frontend
pnpm dev                     # http://localhost:4001
```

### 6. Via Docker
```bash
docker compose up --build
```
Alle services worden met de juiste poorten opgezet zoals gedefinieerd in `docker-compose.yml`.

---

## 🧪 Testen & QA
- Handmatige QA-scripts staan in [`TESTING-GUIDE.md`](./TESTING-GUIDE.md).
- Postman collectie + environment: zie `docs/` en `scripts/`.
- Belangrijke checkpunten:
  - JWT & magic link login (inclusief Google OAuth callback)
  - Stripe checkout + webhook → `premium = true`
  - Google Calendar en Gmail permissions voor AI-gestuurde acties
  - Reminder scheduler (< 60s) en tasks board

> Tip: gebruik de `restart-all.ps1` en `frontend/lib/start-backend.ps1` scripts voor snellere lokale resets.

---

## 📦 Handige Commando’s
```bash
# Formatter / Lint (optioneel)
pnpm lint
pnpm format

# Prisma Studio
pnpm prisma studio

# Seed data
pnpm ts-node prisma/seed.ts
```

---

## 📍 Roadmap (korte termijn)
- [ ] Frontend hooks voor facturen, inspecties & Stripe flows verder polijsten
- [ ] Mailgun/Gmail plug-and-play selection
- [ ] Suspense fix voor `/reset-password`
- [ ] Playwright E2E tests + Contract tests
- [ ] Document generator (templates → PDF + e-mail)

Zie ook [`CHANGES-AND-TESTS.md`](./CHANGES-AND-TESTS.md) voor de changelog per sprint.

---

## 🤝 Samenwerken
Dit project staat op GitHub als private repo. Wil je bijdragen?
1. Fork of clone (`git clone https://github.com/FAMFEN77/mylife-va.git`)
2. Maak een feature branch (`git checkout -b feat/...`)
3. Commit met duidelijke boodschappen en open een PR.

Voor vragen over architectuur, onboarding of deployment: check de handbooks in `docs/` of neem contact op via het projectkanaal.

---

Taskee brengt structuur in elke werkdag – van AI-gestuurde reminders tot facturatie en compliance. Veel bouwplezier! 💼✨
