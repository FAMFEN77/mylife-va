# Taskee – Virtuele Assistent voor Zorg & Facilitaire Teams

Taskee is een SaaS-platform dat managers en medewerkers helpt om werkprocessen te organiseren zonder versnipperde Excel-lijsten of losse tools. Het combineert een AI-assistent met concrete modules voor planning, registraties en klantcommunicatie – volledig geïntegreerd met Google Workspace en Stripe.

---

## 🎯 Elevator Pitch
- **AI-gedreven assistent** die taken, reminders, kalenderafspraken en e-mails automatisch aanmaakt.
- **Team Productivity Suite** met takenbeheer, uren- en ritregistratie, declaraties, verlof, kwaliteitsinspecties en facturatie.
- **Verantwoorde automatisering**: elk proces heeft zowel een employee- als managerflow (aanmaken, overzicht, goedkeuren).
- **Enterprise-ready**: NestJS + PostgreSQL backend, Next.js frontend, Prisma ORM, JWT-auth, Google OAuth en Stripe billing.

---

## ✅ Functionaliteiten Overzicht

| Domein               | Kernmogelijkheden                                                                                                                                                                |
|----------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **AI Assistant**     | Intent-detectie (taken, reminders, calendar, e-mail, math, room reservations) + automatische Google Calendar- en Gmail-integratie.                                                |
| **Takenbeheer**      | Teamtaken met status, deadlines, toewijzing, overzicht voor teamleden en managers, filters en dashboardstatistieken.                                                              |
| **Reminders**        | Persoonlijke reminders met agenda-koppeling, status- en filterpanel, relatieve tijdweergave en verzendstatus.                                                                    |
| **Urenregistratie**  | Medewerkerregistreert gewerkte uren, manager keurt goed. Statistieken (totaal/goedgekeurd/pending) en tabelweergave.                                                             |
| **Ritregistratie**   | Ritformulier, overzicht met filters, manager kan ritten goed- of afkeuren. Kilometerstatistieken.                                                                                |
| **Declaraties**      | Declariatieformulier, statussen, stub bon-upload (OCR-preview), filterchips, manager approvals.                                                                                  |
| **Verlof & Ziekte**  | Verlofformulier (type, periode, notitie), statusoverzicht met kalender-indicator, manager approvals, automatische calendar hook (stub).                                           |
| **Inspecties**       | Managers registreren inspecties met checklist, PDF-stub genereren en rapport mailen naar klant. Pending-lijst en filters op datum/locatie.                                       |
| **Facturatie**       | Factuurmodel met PDF-stub en Gmail-versturen. Statusbeheer (draft → sent → paid).                                                                                                |
| **Stripe Billing**   | Checkout sessies, webhook-verwerking, premiumflag, customer/subscription metadata voor gebruikers.                                                                                |
| **Team & Planning**  | Teamuitnodigingen, availability-registratie, planner-suggestions (AI-assist gebruikt deze data).                                                                                 |
| **Authenticatie**    | Magic-link/JWT login, Google OAuth-koppeling, wachtwoordresetflow (UI fix staat gepland).                                                                                         |

---

## 🧠 AI Assistant Intent Matrix
| Intent              | Actie                                                                                      |
|---------------------|---------------------------------------------------------------------------------------------|
| `task.create/list`  | Taken toevoegen, status toggelen, lijst tonen.                                              |
| `reminder.create`   | Reminder met agenda-event maken.                                                            |
| `calendar.create`   | Google Calendar event aanmaken (bijv. vergaderingen).                                       |
| `email.write/send`  | E-mail draften of verzenden via Gmail API.                                                  |
| `room.reserve`      | Ruimte-reserveringsservice aanroepen (incl. agenda fallback).                               |
| `math.calculate`    | Math parser met sanitised evaluation (rounding en foutafhandeling).                         |
| `grocery.list`      | Voorbeeld boodschappenlijst genereren.                                                      |
| `file.summarize`    | Stub – wordt later gekoppeld aan documentenservice.                                         |

---

## 🏗 Architectuur
### Backend
- **NestJS 10** + **TypeScript**
- **Prisma ORM 5** met PostgreSQL
- Modules:
  - Auth, Assistant, Tasks, Reminders, Google (OAuth, Calendar, Gmail), Team, Availability, Planning
  - Time, Trips, Expenses, Leave, Inspections, Invoices, Billing (Stripe), Rooms
- **JWT + Guards/Roles** (MANAGER vs. MEDEWERKER)
- **Google Calendar & Gmail integratie** (OAuth tokens per gebruiker)
- **Stripe** voor checkout + webhooks (premium status)
- **Mailgun fallback** indien geen API key aanwezig

### Frontend
- **Next.js 14 (App Router)** + TailwindCSS
- Context-gebaseerde auth (`AuthProvider`), nav-items op rol
- Pagina’s per module + dashboards met stat kaarten, filterchips en tabellen
- `lib/api.ts` bevat strongly typed helpers (tasks, time, trips, expenses, leave, etc.)

---

## 🔐 Security & Compliance
- JWT-authenticatie, refresh tokens (uitbreidbaar met rotatie)
- Rollen per gebruiker, endpoints met `@Roles` + `RolesGuard`
- Password reset tokens, Magic links, hashing
- `.env` driven configuration: DB, Google, Mailgun, Stripe
- Mailgun-fallback logging: applicatie blijft functioneren zonder SMTP key
- Agenda/Email calls zijn wrapped in try/catch en loggen duidelijke waarschuwingen

---

## ⚙️ Dev & Ops
1. **Install Dependencies**
   ```bash
   cd backend && pnpm install
   cd ../frontend && pnpm install
   ```
2. **Migraties & Prisma Client**
   ```bash
   cd backend
   npx prisma migrate deploy
   npx prisma generate
   ```
3. **Starten**
   ```bash
   # Backend
   pnpm run start:dev

   # Frontend
   cd ../frontend
   pnpm --filter frontend dev
   ```
4. **Testen**
   - Swagger: http://localhost:4000/swagger
   - Frontend: http://localhost:4001
   - Zie [`TESTING-GUIDE.md`](./TESTING-GUIDE.md) voor volledige manual QA checklist

> **Let op:** `next build` geeft nog een warning voor `/reset-password` (gebruik `useSearchParams` → Suspense). Dit staat gepland voor refactor.

---

## 📈 Roadmap & Nice-to-Haves
- [ ] Frontend koppelingen afronden voor facturen, inspecties, Stripe checkout, assistant UI enhancements
- [ ] Documentgenerator (sjablonen → PDF + e-mail)
- [ ] Volledig Mailgun/Gmail switchable email service
- [ ] UI fixes voor reset-password (Suspense) en polijsten van alle forms
- [ ] Automatischte tests (E2E met Playwright en contracttests)

---

## 🤝 Voor potentiële klanten
- Alles-in-één teamassistent voor zorg, facilitair en andere personeels-intensieve branches.
- Helpt bij **compliance** (uren/ritten/verlof), **kwaliteit** (inspecties), **facturatie**, en **planning**.
- AI-assistent vermindert handmatig werk; managers houden regie via approval flows.
- Modulair opgezet: packages kunnen aan/uit per klantbehoefte.

Meer zien? Gebruik de testgids, speel met de assistant, en oordeel zelf hoe Taskee workflow-chaos omzet in een behapbare werkdag. 💼✨
