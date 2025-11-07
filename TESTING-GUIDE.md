# Taskee - Handmatige Testgids (Backend & Frontend) 🚀

Gebruik deze checklist telkens zodra er belangrijke wijzigingen aan het project zijn gedaan.

## 1. Voorbereiding
- [ ] Controleer dat PostgreSQL draait (`localhost:5432`) en de database `mylife_va` actief is.
- [ ] Verifieer dat `.env` (backend) en `.env.local` (frontend) de juiste waarden bevatten (Google, Stripe, etc.).
- [ ] Werk afhankelijkheden bij:
  ```powershell
  cd "D:\Taskee\backend"
  pnpm install
  ```

## 2. Database up-to-date brengen
- [ ] Draai altijd de laatste migraties en regeneratie:
  > **Let op (Windows)**: sluit eerst alle draaiende Node-processen (`Ctrl+C` in backend terminal of `Get-Process node | Stop-Process`) voordat je Prisma-commando’s draait; anders kunnen `query_engine-windows.dll` locks optreden.
  > - Controleer desnoods met `Get-Process node`; gebruik `Get-Process node | Stop-Process` als er iets blijft hangen.
  > - Als het bestand toch vergrendeld blijft, sluit de terminal/IDE of herstart PowerShell en probeer opnieuw.
```powershell
cd "D:\Taskee\backend"
pnpm prisma migrate deploy
pnpm prisma generate
```
- [ ] Optioneel: seed of harde reset (alleen indien nodig en afgesproken).

## 3. Backend starten & basiscontrole
- [ ] Start backend:
  ```powershell
  pnpm run start:dev
  ```
- [ ] Controleer console-log: `API gestart op poort 4000`.
- [ ] Open Swagger: http://localhost:4000/swagger (let op nieuwe endpoints onder *Time*, *Trips*, *Invoices*, *Expenses*, *Leave*, *Inspections*, *Billing*, *Assistant*, etc.).
- [ ] Test health-endpoint (indien aanwezig) of ping `/api/v1/assistant/message` met een eenvoudige payload (JWT vereist).

## 4. Frontend starten
- [ ] Start vanuit root:
  ```powershell
  cd "D:\Taskee\frontend"
  pnpm install
  pnpm --filter frontend dev
  ```
- [ ] Open http://localhost:4001 en log in met testaccount.

## 5. Testscenario’s per module
### 5.1 Authenticatie & Google
- [ ] Login via magic link / normale flow.
- [ ] Verifieer Google OAuth-koppeling (mail + calendar).

### 5.2 Taken & Reminders
- [ ] Maak taak via UI en via assistant.
- [ ] Maak reminder en controleer agenda-optie + Google event.

### 5.3 Tijdregistratie
- [ ] POST `/api/v1/time/add` (JWT van medewerker).
- [ ] Controleer `/api/v1/time/me`.
- [ ] Als manager: `/api/v1/time/all` en `/api/v1/time/{id}/approve`.

### 5.4 Ritregistratie
- [ ] POST `/api/v1/trips`.
- [ ] Controleer `/api/v1/trips/me`.
- [ ] Manager: `/api/v1/trips/pending`, `/approve`, `/reject`.

### 5.5 Facturatie
- [ ] Maak factuur `/api/v1/invoices`.
- [ ] Genereer PDF (stub) & verstuur (werkt via Gmail-service).
- [ ] Controleer statusovergang `draft -> sent`.

### 5.6 Declaraties
- [ ] Maak declaratie `/api/v1/expenses`.
- [ ] Upload bon (stub) en controleer `receiptUrl`.
- [ ] Manager: `/pending`, approve/reject.

### 5.7 Verlof
- [ ] Medewerker: `/api/v1/leave/request`, check `/leave/mine`.
- [ ] Manager: `/leave/pending`, approve/deny (controleer Google event).

### 5.8 Inspecties
- [ ] Manager: `/api/v1/inspections` (create met checklist).
- [ ] Download/genereren PDF stub, verstuur rapport via Gmail.
- [ ] Controleer items en filters (`from`, `to`, `location`).

### 5.9 Assistant intents
- [ ] Test nieuwe intents (math, room reserve, email template) via `/assistant/message`.
- [ ] Controleer logging van room reservations en fallback e-mail response.

## 6. Stripe (optioneel)
- [ ] Zet echte Stripe keys in `.env`.
- [ ] Maak checkout session `/api/v1/billing/create-session`.
- [ ] Gebruik Stripe CLI of dashboard voor webhook test `/api/v1/billing/webhook`.
- [ ] Controleer dat `premium`, `stripeStatus`, `premiumUntil` in user worden geüpdatet.

## 7. Frontend flows
- [ ] Dashboard kaarten controleren (taken, reminders, deadlines, planning).
- [ ] Navigatie door alle nieuwe tabbladen (Uren, Ritregistratie, Declaraties, Inspecties).
- [ ] Validaties en foutmeldingen checken (geen 500’s in console).

## 8. Logging & foutcontrole
- [ ] Controleer backend console op waarschuwingen/errors.
- [ ] Browser console en network tab nalopen.
- [ ] Indien problemen: noteer exacte request + body + foutmelding.

## 9. Afsluiten
- [ ] Stop frontend (Ctrl+C).
- [ ] Stop backend (Ctrl+C) en voer `Get-Process node | Stop-Process` uit als processen blijven hangen.
- [ ] Voer `git status` uit en noteer onbedoelde wijzigingen.
- [ ] Documenteer testresultaten + issues in ticket/README.

> 🔁 **Tip:** Sla deze gids op en werk hem bij na nieuwe features zodat het team dezelfde checklijst volgt.
