✅ Codex Mega-Assignment
Taskee — AI Virtual Assistant
+ Veilige Migratie van Pinterest naar Nieuwe Projectmap

Volledige technische specificatie + volledige veilige migratie.

✅ 1. PROJECTOMSCHRIJVING

Taskee is een AI-gestuurde virtuele assistent die niet alleen antwoorden geeft, maar echte acties uitvoert:

📅 Afspraken plannen in Google Calendar
🔔 Reminders / taken instellen en notificeren
✉️ E-mails opstellen en versturen via Gmail
📄 PDF-documenten samenvatten
🛒 Boodschappenlijsten genereren
✅ Alles vanuit één chatinterface

Doel: gebruikers tijd teruggeven door dagelijkse mentale lasten te automatiseren.

✅ 2. SMART DOELEN
Onderdeel	SMART
Specifiek	Eén AI-assistent die taken uitvoert (calendar, email, reminders, groceries, summaries)
Meetbaar	Intent-detectie ≥ 85%, reminders ≤ 60s, calendaring succes ≥ 90%
Acceptabel	Next.js + NestJS + Prisma + Google/Gmail/Stripe = bewezen stack
Realistisch	Markt bevestigd door Clara, Reclaim, Motion, Fin
Tijdgebonden	MVP live binnen 8 weken
✅ 3. ARCHITECTUUR
Component	Stack
Frontend	Next.js (App Router) + Tailwind + TypeScript
Backend	NestJS + Prisma + PostgreSQL (Neon)
AI	OpenAI (intent parsing + generative tasks)
Integraties	Google Calendar API, Gmail API
Auth	Magic link + JWT
Payments	Stripe subscriptions
Deployment	Cloudflare Pages + Tunnel/VPS
✅ 4. FUNCTIONALITEIT (MVP)
User zegt	AI doet
“Plan morgen 10:00 met Lisa”	Event in Google Calendar + invite
“Herinner me aan btw 1 maart om 08:00”	Reminder + notificatie
“Schrijf een vriendelijke factuurreminder”	E-mail genereren → gebruiker keurt → Gmail verstuurt
“Vat deze PDF samen”	Upload → samenvatting + actiepunten
“Maak boodschappenlijst voor 4 dagen, gezond”	Checklist met aantallen
✅ 5. PRISMA DATAMODEL
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  premium   Boolean  @default(false)
  tasks     Task[]
  reminders Reminder[]
}

model Task {
  id        String   @id @default(cuid())
  userId    String
  text      String
  status    String   // todo | done
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}

model Reminder {
  id        String   @id @default(cuid())
  userId    String
  text      String
  remindAt  DateTime
  sent      Boolean  @default(false)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}

✅ 6. INTENT-LOGICA

Intent-labels

const INTENTS = [
  "meeting.schedule",
  "reminder.create",
  "task.create",
  "email.write",
  "grocery.list",
  "file.summarize"
];


Classificatie-prompt

"Classify the user's message into one intent. Return JSON: { intent: string, parameters: {...} }"


Handler

switch(intent) {
  case "meeting.schedule": scheduleMeeting(params); break;
  case "reminder.create": createReminder(params); break;
  case "task.create": createTask(params); break;
  case "email.write": writeEmail(params); break;
  case "grocery.list": makeGroceryList(params); break;
  case "file.summarize": summarizeFile(params); break;
}

✅ 7. API-ENDPOINTS
Route	Methode	Doel
/auth/magic-link	POST	Login link versturen
/auth/callback	POST	Token validatie + JWT
/assistant/message	POST	tekst → intent → actie
/calendar/schedule	POST	event + invite
/email/send	POST	Gmail versturen
/reminders	GET/POST	reminders opslaan/ophalen
/billing/create-session	POST	Stripe checkout
/billing/webhook	POST	premium unlock
✅ 8. ACCEPTATIECRITERIA

✅ Magic link login werkt
✅ Intent detectie ≥ 85% op 100 commando’s
✅ Calendar event zichtbaar in Google account
✅ Reminder op tijd (≤ 60 sec)
✅ PDF samenvatting ≤ 10 sec
✅ Stripe webhook zet premium = true

✅ 9. 8-WEEK ROADMAP
Week	Doel
1–2	Auth + chatinterface + intent
3–4	Google Calendar integratie
5–6	Gmail + PDF Summary + groceries
7	Stripe subscriptions
8	Beta + bugfix + launch
✅ 10. SAFE MIGRATIE UIT PINTEREST
✅ Veiligheidsregels

❌ NOOIT wijzigen of verwijderen in ../pinterest

✅ ALLEEN LEZEN uit ../pinterest

✅ ALLEEN SCHRIJVEN in ./mylife-va

✅ Elke actie eerst tonen → wachten op bevestiging

✅ Als er twijfel is → stoppen en vragen

✅ Bestanden die GECOPY-PAST moeten worden + Waarom
Bestand/Map	Waarom nodig
../pinterest/backend/src/main.ts	Nest bootstrap + Swagger setup
../pinterest/backend/src/config/swagger.config.ts	Swagger configuratie
../pinterest/backend/src/common/**	Error filters, guards, pipes
../pinterest/backend/src/prisma/**	PrismaService + DB connectie
../pinterest/backend/prisma/schema.prisma	Basis schema, wordt opgeschoond
../pinterest/backend/src/auth/**	Magic link + JWT login
../pinterest/backend/src/billing/**	Stripe integratie
../pinterest/backend/package.json	Dependencies + scripts
../pinterest/backend/tsconfig.json	Build-instellingen
../pinterest/backend/Dockerfile	Deployment support
../pinterest/frontend/components/ui/**	Buttons / modals / forms
../pinterest/frontend/lib/api.ts	Fetch wrapper
../pinterest/frontend/app/providers/AuthProvider.tsx	Auth context
../pinterest/frontend/next.config.js	Bundling / rewrites
../pinterest/frontend/tailwind.config.js	Styling

✅ Dit zijn infrastructuur-tijdwinners
❌ Items zoals product-modules, importers en scrapers worden niet gekopieerd

✅ SAFE MIGRATIE-OPDRACHT VOOR CODEX

(uitvoeren vanuit ./mylife-va)

# ✅ Codex SAFE Migration Assignment – Taskee

## Veiligheidsregels
- Je staat in ./mylife-va
- Je mag NIET schrijven naar ../pinterest
- Je mag ALLEEN lezen uit ../pinterest
- Je mag ALLEEN schrijven in ./mylife-va
- Elke actie moet eerst getoond worden → wacht op mijn bevestiging

---

## Fase 1 — Analyse
1. Scan `../pinterest/backend/src` en `../pinterest/frontend`
2. Print 2 lijsten:
   ✅ Te kopiëren
   ❌ Niet te kopiëren
3. Stop en wacht op bevestiging

✅ Te kopiëren:
- `../pinterest/backend/src/main.ts`
- `../pinterest/backend/src/config/swagger.config.ts`
- `../pinterest/backend/src/common/**`
- `../pinterest/backend/src/prisma/**`
- `../pinterest/backend/prisma/schema.prisma`
- `../pinterest/backend/src/auth/**`
- `../pinterest/backend/src/billing/**`
- `../pinterest/backend/package.json`
- `../pinterest/backend/tsconfig.json`
- `../pinterest/backend/Dockerfile`
- `../pinterest/frontend/components/ui/**`
- `../pinterest/frontend/lib/api.ts`
- `../pinterest/frontend/app/providers/AuthProvider.tsx`
- `../pinterest/frontend/next.config.js`
- `../pinterest/frontend/tailwind.config.js`

---

## Fase 2 — Mapstructuur aanmaken
- Maak in ./mylife-va:
  - backend/
  - frontend/
- Print wat is aangemaakt
- Wacht op bevestiging

---

## Fase 3 — Kopiëren
- Kopieer ALLE ✅ bestanden
- Nooit iets aanpassen in ../pinterest
- Na elke batch print:
  - “COPIED → [bron] → [doel]”
- Wacht op bevestiging

---

## Fase 4 — Prisma opschonen
- In ./mylife-va/backend/prisma/schema.prisma:
  - verwijder Product, Theme, Import, Scraper modellen
  - laat alleen User, Task, Reminder
  - voeg `premium Boolean @default(false)` toe
- Genereer Prisma migratie
- Wacht op bevestiging

---

## Fase 5 — Rapport
- Print:
  - volledige mapstructuur
  - lijst met gekopieerde bestanden
  - bevestiging dat ../pinterest NIET gewijzigd werd

✅ 11. RESULTAAT VAN DE MIGRATIE

✅ Nieuwe map mylife-va met:

Auth + JWT

Stripe

Prisma setup

Swagger

UI componenten

➡️ Taskee functionaliteit kan direct worden gebouwd.