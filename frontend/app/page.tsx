"use client";

import clsx from "clsx";
import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/app/providers/AuthProvider";
import { APP_NAME, BRAND_INITIALS } from "@/lib/brand";

const FEATURE_CARDS = [
  {
    title: "Slimme planning",
    description: "Taken, uren en ritten automatisch inplannen met AI-voorstellen.",
  },
  {
    title: "Team flows",
    description: "Rollen, beschikbaarheid en approvals voor teams in zorg en MKB.",
  },
  {
    title: "Integraties",
    description: "Google Agenda & Gmail, Stripe billing, Magic links en Prisma ORM.",
  },
  {
    title: "Rapportages",
    description: "Facturen, inspecties en declaraties met PDF-export en e-mail verzending.",
  },
];

const PRICING = [
  {
    name: "Starter",
    price: "€ 0",
    cadence: "eerste 7 dagen",
    label: "Gratis proefperiode",
    features: ["AI assistant", "Taken & reminders", "Max. 3 teamleden", "Helpdesk via e-mail"],
    cta: { href: "/register", label: "Start gratis trial" },
  },
  {
    name: "Pro",
    price: "€ 29",
    cadence: "per gebruiker / maand",
    label: "Meest populair",
    highlighted: true,
    features: [
      "Alle Starter-functies",
      "Uren- & ritregistratie",
      "Facturen & declaraties",
      "Google Workspace integraties",
    ],
    cta: { href: "/register", label: "Probeer Pro" },
  },
  {
    name: "Enterprise",
    price: "Op maat",
    cadence: "SLA & onboarding",
    label: "Scaling teams",
    features: ["Single Sign-On", "Dedicate accountmanager", "API integraties", "On-premise opties"],
    cta: { href: "/contact", label: "Plan demo" },
  },
];

export default function MarketingPage() {
  const { authenticatedUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && authenticatedUser) {
      router.replace("/dashboard");
    }
  }, [authenticatedUser, loading, router]);

  if (!loading && authenticatedUser) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink">
        <p className="text-sm text-ink/60">Doorsturen naar je dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-midnight-900 to-ink text-white">
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pb-16 pt-10 md:px-10">
        <nav className="flex items-center justify-between rounded-full border border-white/20 bg-white/5 px-5 py-3 backdrop-blur">
          <div className="flex items-center gap-2 font-semibold">
            <Image
              src="/brand/logoTK.svg"
              alt={`${APP_NAME} logo`}
              width={132}
              height={32}
              priority
              className="hidden sm:block"
            />
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand-500 sm:hidden">
              {BRAND_INITIALS}
            </span>
            <span className="sm:hidden">{APP_NAME}</span>
          </div>
          <div className="hidden items-center gap-6 text-sm text-white/70 md:flex">
            <Link href="#features" className="hover:text-white">
              Product
            </Link>
            <Link href="#pricing" className="hover:text-white">
              Prijzen
            </Link>
            <Link href="#testimonials" className="hover:text-white">
              Reviews
            </Link>
            <Link href="#faq" className="hover:text-white">
              FAQ
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm text-white/70 hover:text-white md:inline-flex">
              Inloggen
            </Link>
            <Link
              href="/register"
              className={clsx(buttonVariants({ variant: "primary" }), "bg-white text-brand-600 hover:brightness-110")}
            >
              Start gratis trial
            </Link>
          </div>
        </nav>

        <div className="grid items-center gap-12 pt-6 md:grid-cols-[1.2fr,1fr]">
          <div className="space-y-6">
            <Badge className="bg-white/15 text-white mix-blend-screen">Virtuele assistent voor teams</Badge>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">
              Automatiseer planning, taken en facturatie met één slimme assistant
            </h1>
            <p className="max-w-xl text-base text-white/70">
              {APP_NAME} combineert AI, workflows en integraties om zorg- en facilitaire teams soepel te laten draaien.
              Van reminders tot inspecties: alles op één plek, binnen 7 dagen gratis uit te proberen.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className={clsx(
                  buttonVariants({ variant: "primary", size: "lg" }),
                  "bg-white text-brand-600 hover:brightness-110",
                )}
              >
                Start gratis trial
              </Link>
              <Link
                href="/login"
                className={clsx(buttonVariants({ variant: "ghost", size: "lg" }), "border border-white/25 text-white")}
              >
                Log in
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-white/60">
              <span>· 7 dagen gratis</span>
              <span>· Geen creditcard nodig</span>
              <span>· Daarna maandelijks opzegbaar</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-10 top-12 h-40 w-40 rounded-full bg-mint-400/40 blur-3xl" />
            <div className="absolute right-0 top-0 h-28 w-28 rounded-full border border-white/20" />
            <div className="relative rounded-[36px] border border-white/15 bg-white/10 p-6 shadow-[0_40px_80px_-60px_rgba(0,0,0,0.6)] backdrop-blur-xl">
              <p className="text-sm font-medium text-white/80">Live snapshot</p>
              <ul className="mt-4 space-y-3 text-xs text-white/70">
                <li className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                  ✅ Automatische e-mails verstuurd voor factuur #INV-204
                </li>
                <li className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                  ⏱ 8 uur geregistreerd voor team Zorg West
                </li>
                <li className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                  🗓 AI-planning: Dinsdag 10:00 – Schoonmaak bij klant Jansen BV
                </li>
              </ul>
              <div className="mt-6 grid gap-3 rounded-3xl border border-white/20 bg-white/10 p-5">
                <p className="text-sm font-semibold text-white">14 dagen resterend in proefperiode</p>
                <Link
                  href="/pricing"
                  className={clsx(
                    buttonVariants({ variant: "primary", size: "sm" }),
                    "w-full bg-white text-brand-500 hover:brightness-110",
                  )}
                >
                  Upgrade naar Pro
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="space-y-24 bg-white py-24 text-ink">
        <section id="features" className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 md:px-10">
          <SectionIntro
            overline={`Waarom ${APP_NAME}?`}
            title="Alles wat je virtuele team nodig heeft"
            description="Een complete suite voor taken, planning, registratie en facturatie – direct aangestuurd door AI."
          />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {FEATURE_CARDS.map((feature) => (
              <div
                key={feature.title}
                className="rounded-[28px] border border-brand-100/60 bg-white/80 p-6 shadow-[0_24px_60px_-40px_rgba(134,88,255,0.35)]"
              >
                <h3 className="text-lg font-semibold text-ink">{feature.title}</h3>
                <p className="mt-2 text-sm text-ink/60">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 md:px-10">
          <SectionIntro
            overline="Prijzen"
            title="Betaal pas na je gratis proefperiode"
            description="Na 7 dagen gratis testen kies je eenvoudig het abonnement dat past. Downgraden of upgraden kan altijd."
          />
          <div className="grid gap-6 md:grid-cols-3">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={clsx(
                  "rounded-[32px] border p-6 shadow-[0_35px_80px_-55px_rgba(28,26,46,0.45)] transition hover:-translate-y-1",
                  plan.highlighted
                    ? "border-brand-300 bg-gradient-to-br from-brand-500/20 via-brand-100/30 to-mint-100/20"
                    : "border-brand-50 bg-white",
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  {plan.label && <Badge variant="info">{plan.label}</Badge>}
                </div>
                <p className="mt-6 text-3xl font-display text-ink">{plan.price}</p>
                <p className="text-xs uppercase tracking-wide text-ink/50">{plan.cadence}</p>
                <ul className="mt-6 space-y-2 text-sm text-ink/70">
                  {plan.features.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-400" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.cta.href}
                  className={clsx(
                    buttonVariants({ variant: plan.highlighted ? "primary" : "secondary", size: "md" }),
                    "mt-8 w-full justify-center",
                  )}
                >
                  {plan.cta.label}
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section id="testimonials" className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 md:px-10">
          <SectionIntro
            overline="Ervaringen"
            title="Teams besparen uren per week"
            description="Onze klanten winnen tijd dankzij automatische planners, reminders en facturatie."
          />
          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                quote:
                  `Sinds ${APP_NAME} laten we de AI elke ochtend onze agenda checken en taken herverdelen. Het team is rustiger en niets wordt vergeten.`,
                author: "Sophie – Zorgmanager",
              },
              {
                quote:
                  "De combinatie van urenregistratie en facturatie scheelt ons zeker 6 uur per week. En klanten krijgen automatisch een samenvatting.",
                author: "Martijn – Facilitair ondernemer",
              },
            ].map((item) => (
              <div key={item.author} className="rounded-[32px] border border-brand-100 bg-white/80 p-6">
                <p className="text-sm text-ink/70">“{item.quote}”</p>
                <p className="mt-4 text-sm font-semibold text-ink">{item.author}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="faq"
          className="mx-auto flex w-full max-w-6xl flex-col gap-12 rounded-[36px] border border-brand-100 bg-gradient-to-br from-pearl-50 via-white to-mint-50 px-6 py-12 md:px-10"
        >
          <SectionIntro
            overline="Veelgestelde vragen"
            title="Transparant over de proef en betalingen"
            description="Zelf ervaren? Start direct of neem contact op voor een persoonlijke demo."
          />
          <div className="grid gap-6 md:grid-cols-2">
            <FaqItem
              question="Hoe werkt de proefperiode?"
              answer="Je krijgt 7 dagen volledige toegang zonder creditcard. Tijdens de proef herinneren we je aan de afloop, zodat je rustig kunt kiezen voor een betaald plan."
            />
            <FaqItem
              question="Welke betaalmethoden ondersteunen jullie?"
              answer="Betaling verloopt via Stripe. We ondersteunen alle gangbare kaarten, SEPA incasso en facturatie voor Enterprise klanten."
            />
            <FaqItem
              question="Kan ik op elk moment opzeggen?"
              answer="Ja. Je abonnement is maandelijks opzegbaar. Downgraden kan via het account-dashboard en gaat in na de lopende periode."
            />
            <FaqItem
              question={`Is ${APP_NAME} veilig voor zorgdata?`}
              answer="We draaien op een secure stack met Prisma + PostgreSQL, audit logs en optie tot datalocatie in EU. Enterprise heeft extra afspraken zoals verwerkersovereenkomsten."
            />
          </div>
        </section>
      </main>

      <footer className="bg-ink py-12">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 text-sm text-white/60 md:px-10 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="font-semibold text-white">{APP_NAME}</p>
            <p>© {new Date().getFullYear()} {APP_NAME}. Alle rechten voorbehouden.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Voorwaarden
            </Link>
            <Link href="/contact" className="hover:text-white">
              Contact
            </Link>
            <Link href="/login" className="hover:text-white">
              Inloggen
            </Link>
          </div>
        </div>
      </footer>
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

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="rounded-[28px] border border-brand-50 bg-white/85 p-6">
      <h3 className="text-lg font-semibold text-ink">{question}</h3>
      <p className="mt-3 text-sm text-ink/60">{answer}</p>
    </div>
  );
}
