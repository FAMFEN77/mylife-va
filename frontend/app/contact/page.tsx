import clsx from "clsx";
import Link from "next/link";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { APP_NAME } from "@/lib/brand";

const pageDescription = `Ontdek hoe ${APP_NAME} enterprise-teams helpt met multi-tenant workflows, beveiliging, integraties en onboarding. Plan direct een demo.`;

export const metadata: Metadata = {
  title: `Plan een enterprise demo | ${APP_NAME}`,
  description: pageDescription,
};

const HERO_POINTS = [
  {
    title: "SLA & onboarding",
    description: "Kick-off call, configuratie en livegang in minder dan vier weken.",
  },
  {
    title: "Dedicated success manager",
    description: "Een aanspreekpunt voor training, support en roadmap-afstemming.",
  },
  {
    title: "Enterprise security",
    description: "SSO, audit logging en datalocatie in de EU met verwerkersovereenkomst.",
  },
];

const ENTERPRISE_MODULES = [
  {
    title: "Multi-tenant beheer",
    bullet: "Beheer meerdere business units met eigen teams, workflows en rapportages.",
  },
  {
    title: "Advanced reporting",
    bullet: "Realtime dashboards voor SLA, capaciteit en productiviteit met export.",
  },
  {
    title: "Automations",
    bullet: "Rule builder voor notificaties, escalaties en koppelingen met interne systemen.",
  },
  {
    title: "Enterprise support",
    bullet: "Priority support, trimestriele roadmap reviews en sandbox-omgeving.",
  },
];

const DASHBOARD_METRICS = [
  {
    label: "Capaciteit",
    value: "92%",
    description: "Beschikbaarheid per team en locatie met bottleneck signaal.",
  },
  {
    label: "SLA Performance",
    value: "99.2%",
    description: "Alerts zodra service levels in gevaar komen.",
  },
  {
    label: "AI-automation",
    value: "124 taken",
    description: "Maandelijks geautomatiseerd door AI workflows en triggers.",
  },
];

const SECURITY_ITEMS = [
  "Single Sign-On (SAML / Azure AD / Google Workspace)",
  "Audit trails voor alle AI-acties, mutaties en exports",
  "Datalocatie EU + versleutelde opslag van klantdata",
  "Data processing agreements en DPIA support",
  "Role-based access met granular permissions",
];

const INTEGRATIONS = [
  {
    title: "CRM & Sales",
    flows: ["HubSpot", "Salesforce", "Pipedrive", "REST & GraphQL API"],
    description: "Synchroniseer leads, accounts en taken rechtstreeks met het VA-dashboard.",
  },
  {
    title: "HR & Planning",
    flows: ["AFAS", "Nmbrs", "Personio", "Google Workspace"],
    description: "Zorg dat teams automatisch overuren, verlof en ploegen delen.",
  },
  {
    title: "Finance",
    flows: ["Exact Online", "Twinfield", "Stripe Billing", "SEPA export"],
    description: "Facturen, declaraties en betalingen gekoppeld aan je financiele platform.",
  },
];

const SUCCESS_STEPS = [
  {
    step: "1",
    title: "Kick-off & discovery",
    description: "Intake van processen, datastromen en security vereisten met je stakeholders.",
  },
  {
    step: "2",
    title: "Configured demo",
    description: "Demo-omgeving met je workflows, integraties en sample data.",
  },
  {
    step: "3",
    title: "Pilot & training",
    description: "Pilot voor key users, trainingsmateriaal en change management toolkit.",
  },
  {
    step: "4",
    title: "Go-live & review",
    description: "Livegang met support, dashboard fine-tuning en kwartaalreviews.",
  },
];

export default function PlanDemoPage() {
  return (
    <div className="min-h-screen bg-white text-ink">
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-10 rounded-[36px] border border-brand-100 bg-gradient-to-br from-pearl-50 via-white to-mint-50 px-6 pb-20 pt-16 shadow-[0_40px_80px_-60px_rgba(25,30,62,0.25)] md:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            Terug naar home
          </Link>
          <Badge className="w-fit bg-brand-100 text-brand-700">Enterprise demo</Badge>
        </div>
        <div className="grid gap-12 lg:grid-cols-[1.4fr,1fr]">
          <div className="space-y-6">
            <h1 className="text-4xl font-semibold leading-tight text-ink sm:text-5xl">
              Plan een demo die laat zien hoe {APP_NAME} jouw enterprise-team ontzorgt
            </h1>
            <p className="max-w-2xl text-base text-ink/70">
              We stemmen de demo af op jouw processen: van multi-tenant beheer en AI-workflows tot security en compliance.
              Laat je stakeholders live ervaren hoe de assistant dagelijks werk wegneemt.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="mailto:enterprise@mylifeva.com"
                className={clsx(
                  buttonVariants({ variant: "primary", size: "lg" }),
                  "bg-brand-600 text-white hover:brightness-110",
                )}
              >
                Plan demo via e-mail
              </Link>
              <Link
                href="#success-path"
                className={clsx(buttonVariants({ variant: "ghost", size: "lg" }), "border border-brand-200 text-brand-700 hover:bg-brand-100/20")}
              >
                Bekijk onboarding pad
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {HERO_POINTS.map((item) => (
                <div key={item.title} className="rounded-3xl border border-brand-100 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(94,104,153,0.5)]">
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                  <p className="mt-2 text-xs text-ink/60">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 rounded-[32px] border border-brand-100 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(94,104,153,0.45)]">
            <p className="text-sm font-medium text-ink">Wat je in de demo ziet</p>
            <ul className="space-y-3 text-xs text-ink/60">
              <li className="rounded-2xl border border-brand-50 bg-white px-4 py-3">
                Demo-dashboard met live KPI&apos;s en configuratie van multi-tenant teams.
              </li>
              <li className="rounded-2xl border border-brand-50 bg-white px-4 py-3">
                AI-flows voor planning, uren en communicatie met audit logs.
              </li>
              <li className="rounded-2xl border border-brand-50 bg-white px-4 py-3">
                Integratie-matrix en roadmap afgestemd op jouw landschap.
              </li>
            </ul>
          </div>
        </div>
      </header>

      <main className="space-y-24 bg-white py-24 text-ink">
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 md:px-10">
          <SectionIntro
            overline="Enterprise pakket"
            title="Verleid stakeholders met een op maat ingerichte demo"
            description="We bouwen een flow die aansluit op jouw beslissers: een overzicht van waarde, security-borging en KPI&apos;s voor ROI."
          />
          <div className="grid gap-6 lg:grid-cols-4">
            {ENTERPRISE_MODULES.map((module) => (
              <div key={module.title} className="rounded-[28px] border border-brand-100/60 bg-white/80 p-6 shadow-md">
                <h3 className="text-lg font-semibold text-ink">{module.title}</h3>
                <p className="mt-3 text-sm text-ink/60">{module.bullet}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 md:px-10">
          <SectionIntro
            overline="Dashboard experience"
            title="Laat zien wat dagelijkse impact is"
            description="Gebruik de demo om meteen inzicht te geven in performance en automatisering. Denk aan KPI-kaarten, filters en exports."
          />
          <div className="grid gap-6 md:grid-cols-3">
            {DASHBOARD_METRICS.map((metric) => (
              <div key={metric.label} className="rounded-[26px] border border-brand-50 bg-gradient-to-br from-white to-pearl-50 p-6">
                <p className="text-xs uppercase tracking-wide text-brand-600">{metric.label}</p>
                <p className="mt-4 text-3xl font-semibold text-ink">{metric.value}</p>
                <p className="mt-3 text-sm text-ink/60">{metric.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto flex w-full max-w-6xl flex-col gap-12 rounded-[36px] border border-brand-50 bg-gradient-to-br from-mint-50 via-white to-pearl-50 px-6 py-12 md:px-10">
          <SectionIntro
            overline="Security & compliance"
            title="Beantwoord risk en compliance vragen in de demo"
            description={`Maak direct duidelijk dat ${APP_NAME} voldoet aan enterprise security-eisen en governance.`}
          />
          <ul className="grid gap-4 md:grid-cols-2">
            {SECURITY_ITEMS.map((item) => (
              <li key={item} className="rounded-2xl border border-brand-100 bg-white/80 px-5 py-4 text-sm text-ink/70">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 md:px-10">
          <SectionIntro
            overline="Integraties"
            title="Toon welke koppelingen direct beschikbaar zijn"
            description="Werk met demo-data en highlight hoe data tussen systemen stroomt. Zo zien teams meteen de fit met hun landschap."
          />
          <div className="grid gap-6 md:grid-cols-3">
            {INTEGRATIONS.map((integration) => (
              <div key={integration.title} className="flex flex-col gap-4 rounded-[28px] border border-brand-100/60 bg-white/85 p-6">
                <div>
                  <h3 className="text-lg font-semibold text-ink">{integration.title}</h3>
                  <p className="mt-2 text-sm text-ink/60">{integration.description}</p>
                </div>
                <div className="rounded-2xl border border-brand-50 bg-white px-4 py-3 text-sm text-ink/70">
                  <p className="font-medium text-ink">Dataflows</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {integration.flows.map((flow) => (
                      <li key={flow}>{flow}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="success-path" className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 md:px-10">
          <SectionIntro
            overline="Success path"
            title="Zo begeleiden we je van intake naar go-live"
            description="Enterprise-deals vragen om vertrouwen. We leggen elke stap vast en voorzien je van materiaal voor interne besluitvorming."
          />
          <div className="grid gap-6 md:grid-cols-4">
            {SUCCESS_STEPS.map((step) => (
              <div key={step.step} className="rounded-[28px] border border-brand-100 bg-white/80 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-600">
                  {step.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm text-ink/60">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-[36px] border border-brand-100 bg-gradient-to-br from-brand-600 to-midnight-900 px-6 py-12 text-white md:px-10">
          <h2 className="text-3xl font-semibold">Klaar om je stakeholders te overtuigen?</h2>
          <p className="text-sm text-white/80">
            Stuur ons je use-cases, integraties en doelen. We plannen binnen twee werkdagen een sessie waarin we jouw
            blueprint demonstreren en vervolgstappen vastleggen.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="mailto:enterprise@mylifeva.com"
              className={clsx(
                buttonVariants({ variant: "primary", size: "lg" }),
                "bg-white text-brand-600 hover:brightness-110",
              )}
            >
              Plan demo
            </Link>
            <Link
              href="https://cal.com/"
              target="_blank"
              rel="noreferrer"
              className={clsx(buttonVariants({ variant: "ghost", size: "lg" }), "border border-white/40 text-white")}
            >
              Voeg kalenderlink toe
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function SectionIntro({
  overline,
  title,
  description,
}: {
  overline: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-3 text-center md:text-left">
      <Badge variant="info">{overline}</Badge>
      <h2 className="text-3xl font-semibold text-ink md:text-4xl">{title}</h2>
      <p className="max-w-3xl text-sm text-ink/60">{description}</p>
    </div>
  );
}
