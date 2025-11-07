# Taskee – Overzicht van Nieuwe Functionaliteit & Testinstructies ✅

Onderstaande lijst vat alle recente uitbreidingen samen. Per onderdeel vind je:
- **Wat er is toegevoegd of gewijzigd**
- **Waar je het terugvindt in de code**
- **Hoe je het handmatig kunt testen (API/Swagger of UI)**

> Tip: Gebruik ook de gedetailleerde checklist in [`TESTING-GUIDE.md`](TESTING-GUIDE.md) voordat je een volledige regressietest uitvoert.

---

## 1. Stripe Billing Integratie
- **Nieuw**: Checkout sessies, webhookverwerking, premium-status, Stripe metadata.
- **Code**:
  - `prisma/schema.prisma` (stripe velden in `User`)
  - `src/modules/billing/` – controller, service, module
  - `.env` – nieuwe `STRIPE_*` variabelen
- **Testen**:
  1. Zet geldige Stripe secrets in `.env`.
  2. Backend starten (`pnpm run start:dev`).
  3. Swagger: `POST /billing/create-session` → controleer response URL.
  4. Gebruik Stripe CLI/webhook → `POST /billing/webhook` → verifieer premium velden in database (`User` record).

## 2. Tijdregistratie (Time Entries)
- **Nieuw**: Prisma `TimeEntry`, CRUD + manager approvals.
- **Code**:
  - `prisma/schema.prisma` → `TimeEntry`
  - `src/modules/time/` (dto, controller, service, module)
- **Testen**:
  1. Swagger: `POST /time/add` met medewerker JWT.
  2. `GET /time/me` → eigen registraties.
  3. Als manager: `GET /time/all`, `POST /time/{id}/approve`.
  4. Check UI (als aanwezig) of database voor statuswijziging.

## 3. Ritregistratie (Trips)
- **Nieuw**: Ritmodel, afstand, manager approvals.
- **Code**:
  - `prisma/schema.prisma` → `Trip`
  - `src/modules/trips/`
- **Testen**:
  1. `POST /trips` → rit toevoegen.
  2. `GET /trips/me` → eigen ritten.
  3. Manager: `GET /trips/pending`, `POST /trips/{id}/approve|reject`.

## 4. Facturatie (Invoices)
- **Nieuw**: Facturen met PDF-stub en Gmail verzending.
- **Code**:
  - `prisma/schema.prisma` → `Invoice`
  - `src/modules/invoices/`
- **Testen**:
  1. `POST /invoices` → factuur aanmaken.
  2. `POST /invoices/{id}/generate` → ontvang stub `pdfUrl`.
  3. `POST /invoices/{id}/send` met `recipientEmail` → check Gmail API-call en status (wordt `sent`).

## 5. Declaraties (Expenses)
- **Nieuw**: Declaratiemodel, bon-upload (stub), manager review.
- **Code**:
  - `prisma/schema.prisma` → `Expense`
  - `src/modules/expenses/`
- **Testen**:
  1. `POST /expenses` → declaratie aanmaken.
  2. `POST /expenses/{id}/upload` → stub bon-URL + OCR-resultaat.
  3. Manager: `GET /expenses/pending`, `POST /expenses/{id}/approve|reject`.

## 6. Verlof & Ziekte (Leave Requests)
- **Nieuw**: Prisma `LeaveRequest`, agenda-koppeling (stub), manager approvals.
- **Code**:
  - `prisma/schema.prisma` → `LeaveRequest`
  - `src/modules/leave/`
- **Testen**:
  1. Medewerker: `POST /leave/request`, `GET /leave/mine`.
  2. Manager: `GET /leave/pending`, `POST /leave/{id}/approve|deny`.
  3. Controleer of `calendarEventId` wordt opgeslagen als Google event creation lukt.

## 7. Kwaliteitsinspecties
- **Nieuw**: Inspecties + checklist-items, PDF-stub, mailen naar klant.
- **Code**:
  - `prisma/schema.prisma` → `Inspection`, `InspectionItem`
  - `src/modules/inspections/`
- **Testen**:
  1. Manager: `POST /inspections` met checklist.
  2. `GET /inspections` + filters (`from`, `to`, `location`).
  3. `POST /inspections/{id}/generate-pdf` → stub URL.
  4. `POST /inspections/{id}/send-report` → check Gmail-call (subject/body).

## 8. Assistant-uitbreidingen
- **Nieuw**: Intent detection voor `math.calculate`, `room.reserve`, `email.write`, etc.
- **Code**:
  - `src/modules/assistant/intent-detection.service.ts`
  - `src/modules/assistant/assistant.service.ts` (switch cases, room reservatieservice)
- **Testen**:
  1. `POST /assistant/message` (JWT) met verschillende prompts:
     - `"Bereken 12 * 7"` → `math.calculate` met uitkomst.
     - `"Reserveer vergaderruimte A om 14:00"` → room reservation + kalender-probe.
     - `"Schrijf een vriendelijke email..."` → ontvangt template (geen directe verzending).

## 9. Testing & Documentatie
- **Bestand**: [`TESTING-GUIDE.md`](TESTING-GUIDE.md) – volledige checklist van voorbereiding, migraties, module-tests, logging, cleanup.
- **Gebruik**: doorloop gids bij elke release of grote wijziging om regressies te voorkomen.

---

### Overige aandachtspunten
- **JWT/Authenticatie**: alle nieuwe routes zijn met `@UseGuards(JwtAuthGuard)`. Zorg voor een geldig token (bijv. via bestaande login flow).
- **Swagger**: alle endpoints automatisch zichtbaar onder http://localhost:4000/swagger.
- **Stubs**: PDF-bouwer en OCR/Receipt worden nu als `stub://` links opgeslagen. Vervangen zodra echte services beschikbaar zijn.
- **Logging**: Controleer backend-console voor waarschuwingen (bijv. Google API failures worden gelogd).

Veel succes met testen! Laat het weten als je bepaalde flows verder geautomatiseerd wilt hebben of als er gaps in de documentatie ontbreken. 🙌
