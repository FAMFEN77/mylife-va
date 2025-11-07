✅ Taskee — Minimum Viable Product (MVP) naar Verkoopbaar SaaS Product
✅ 1. User Accounts & Security
Feature	Status	Waarom nodig
✅ Registratie & login via email/wachtwoord	✔	Basis toegang
✅ JWT Authentication + Refresh Tokens	✔	Veilige sessies
✅ OAuth Login met Google	✔	Snellere onboarding
🚧 Wachtwoord reset via email	❗ Must-have	Zonder dit kun je geen live gebruikers supporten
✅ Role-based auth (basic)	✔	Nodig voor roadmap (assistants per gebruiker etc.)
✅ 2. AI Assistant
Feature	Status	Waarom nodig
✅ Chat interface	✔	Core product
✅ Intent herkenning (reminders, calendar, tasks)	✔	VA functionaliteit
✅ Foutafhandeling (“Ik begreep je niet”)	❗ Must-have	Voorkomt frustratie
🚧 Logging van AI-acties	❗ Nodig voor support, audits, debugging	
✅ 3. Google Integratie
Feature	Status	Waarom nodig
✅ OAuth koppelproces (mail + calendar)	✔	Automatisch afspraken/e-mails sturen
✅ Refresh tokens opslaan	✔	Zonder dit werkt integratie na 1 uur niet meer
🚧 E-mails versturen vanuit assistant	MVP aanwezig	Verkoopbare functionaliteit
🚧 Agenda items automatisch aanmaken	MVP aanwezig	Nodig voor “smart assistant”-gevoel
✅ Status / “Verbonden” UI in settings	✔	Nodig voor gebruiksgemak
✅ 4. Reminders
Feature	Status	Waarom nodig
✅ Handmatig reminders invoeren	✔	Minimale functionaliteit
✅ Reminders via AI	✔	Unieke selling point
🚧 Reminder notificaties (email / push)	❗ Echt nodig → anders vergeet iedereen ze	
✅ Reminder overzicht + verwijderen	✔	Basis usability
🚧 Snoozen / markeren als gedaan	⭐ Nice-to-have / hogere waarde	
✅ 5. Tasks
Feature	Status	Waarom nodig
✅ Tasks maken via dashboard	✔	Productiviteit feature
🚧 Tasks via AI (“maak een taak…")	❗ Maak AI consistent	
🚧 Deadlines, prioriteit	Sterk voor verkoopbaar product	
🚧 Sync via Google Tasks (optioneel)	Bonus feature	
✅ 6. Dashboard
Feature	Status	Waarom nodig
✅ Welkomstscherm met accountinfo	✔	
✅ Navigatie (Assistant, Tasks, Reminders, Settings)	✔	
🚧 Statistieken (aantal reminders, komende afspraken)	Verhoogt waarde en vertrouwen	
🚧 Dag- en weekoverzicht	Voelt als echte VA	
✅ 7. User Experience
Feature	Status	Waarom nodig
✅ Lighthouse responsive UI	✔	
✅ Loading states / skeletons	Voeg professionaliteit toe	
🚧 Foutmeldingen & succesmeldingen	Live gebruikers moeten begrijpen wat er gebeurt	
✅ Dark mode (optioneel maar verkoopboost)	Bonus	
✅ 8. Beveiliging & Privacy

| ✅ HTTPS (in productie via Cloudflare of Vercel)
| ✅ Geheimen in environment variables
| ✅ Tokens hashed en veilig opgeslagen
| 🚧 Privacybeleid & Algemene voorwaarden
| 🚧 AVG compliance (contactgegevens, dataverwijdering)

📌 Zonder privacybeleid mag je in NL/EU eigenlijk niet commercieel live.

✅ 9. Betaalsysteem
Feature	Status	Waarom nodig
🚧 Stripe integratie	Nodig voor betaalde gebruikers	
🚧 Subscription tiers (Basic / Pro)	Commercieel model	
🚧 Trial system	Hogere conversie	
✅ 10. Support & Onboarding
Feature	Status	Waarom nodig
🚧 Onboarding: uitlegpagina	Helpt nieuwe gebruikers	
🚧 Support contact (email of chat widget)	Nodig voor commercieel product	
🚧 Bug reporter	Lage support burden	
✅ Wat is nu al sterk genoeg om te verkopen?

✅ Google connectie
✅ AI assistant
✅ Reminders + Calendar acties
✅ Dashboard & account
✅ JWT login
✅ Werkt lokaal en technisch solide

❗ Wat moet nog af om echt te verkopen?
✅ absoluut minimaal:

✅ Password reset

✅ Reminder notificaties

✅ Bug fixes in assistant (“literal text opslaan”)

✅ Stripe betaling

✅ Privacybeleid & Terms

📌 Samenvatting (TL;DR)
Type	Status	Nodig om verkoopbaar te zijn?
Technische basis	✅ Klaar	✔
AI integrated	✅	✔
UX & betrouwbaarheid	🚧	❗
Betalingen	🚧	❗
Security & legal	🚧	❗