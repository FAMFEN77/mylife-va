# Taskee “Op maat” Enterprise-voorstel

## Doelgroep en waardepropositie
- **Voor wie**: zorg- en facilitaire organisaties met >25 gebruikers, compliance-eisen (ISO27001/NEN7510), bestaande tooling (Google Workspace / Microsoft 365) en behoefte aan SLA’s.
- **Belofte**: Alle Pro-functionaliteit aangevuld met SSO, flexibele limieten, maatwerk-integraties en dedicated support zodat het platform op bedrijfsprocessen kan aansluiten.

## Huidige situatie
- Marketing communiceert een “Op maat” optie, maar de app biedt enkel Starter/Pro-functionaliteit en standaard Stripe-flow (`frontend/app/page.tsx:215`).
- Geen enterprise-specifieke entiteiten of feature-flags in backend (`backend/src/modules`).
- Geen CRM/Sales handoff: knop linkt naar `/contact` zonder intakeworkflow.

## Gewenst aanbod
1. **Enterprise-contract** (min. 1-jarig) met:
   - Dedicated accountmanager.
   - SLA met responstijden en uptime-reporting.
   - Optie voor maatwerkintegraties of private hosting.
2. **Product differentiators**:
   - SSO (SAML/OIDC) + SCIM.
   - Custom modules (bijv. API-toegang, advanced rapportage).
   - Uitbreidbare limieten (teamleden, storage, AI-calls).
3. **Commercial toolkit**:
   - Intakeformulier (kwalificatievragen) + CRM-koppeling.
   - Pricing calculator en contract templates.

## Ontwikkelroadmap

| Fase | Sprint(s) | Deliverables |
| --- | --- | --- |
| 1. Fundering | 1-2 | Organisation model (tenant settings), feature flags, enterprise plan in billing. |
| 2. Identity & Governance | 3-5 | OIDC/SAML, SCIM user sync, audit logging, custom roles/permissions. |
| 3. Integraties & API | 6-8 | Public REST API (scope), webhook framework, integratie templates. |
| 4. Ops & Support | 9-10 | SLA monitoring dashboards, runbooks, escalation tooling. |

## Technische bouwblokken
- **Tenant instellingen**: tabel `Organisation` met plan-type, limieten, enterprise-flags + migratie.
- **Feature flags**: middleware om modules and componenten te tonen/verbergen (frontend) en guards (backend).
- **Identity**: integratie met Identity Provider (Auth0/Azure AD). Nieuwe auth endpoints, tokens met organisation claims.
- **Billing**: Stripe-billing uitbreiden met custom prijsplannen en handmatige facturatie triggers.
- **Audit & logging**: uitgebreide logging en exports per tenant.
- **API/Integraties**: versieerbare endpoints, API keys, rate limiting.

## Operationele benodigdheden
- Document templates (SLA, DPA, DPIA).
- Support workflows (on-call schema, incident tickets).
- Customer Success playbook: onboarding checklist, QBR-templates.

## KPI’s
- 3 enterprise leads per kwartaal.
- Tijd tot contract < 45 dagen.
- Onboarding < 14 dagen.
- NPS > 40 / churn < 3% per jaar.

## Statusupdate (04-11-2025)
- ✅ Prisma-schema uitgebreid met `Organisation` en `OrganisationFeature` + migratie `20251104100000_enterprise_foundation`.
- ✅ Globale `FeatureFlagsService` toegevoegd (nu nog zonder actieve productkoppeling).
- ⏳ Koppeling van bestaande klanten aan organisations en beheer-UI volgen in vervolgsprints.

## Volgende acties
1. Definieer intakevragen & CRM integratie.
2. Bestaande klanten migreren naar organisations + beheerflows uitwerken.
3. Roadmap afstemmen met sales/support; stel budget en resources vast.
