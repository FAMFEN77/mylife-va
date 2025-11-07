"use client";

import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconArrowRight, IconCheck, IconLoader2, IconSparkles, IconWand } from "@tabler/icons-react";

import { api, type AssistantReply } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APP_NAME } from "@/lib/brand";

type ChatMessage =
  | { id: string; role: "system"; text: string }
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; text: string; reply: AssistantReply };

const QUICK_PROMPTS = [
  {
    title: "Nieuwe reminder",
    prompt: "Maak een reminder voor morgen 08:00 om de clientenlijst bij te werken.",
  },
  {
    title: "Plan vergadering",
    prompt: "Plan vrijdag om 14:30 een teamoverleg van 30 minuten in vergaderruimte B.",
  },
  {
    title: "Schrijf e-mail",
    prompt: "E-mail naar rfenanlamber@me.com: Beste R Fenanlamber, is de planning akkoord?",
  },
  {
    title: "Maak taak",
    prompt: "Maak een taak voor Saskia om donderdag alle dossiers te archiveren.",
  },
];

const CHANNEL_OPTIONS = [
  { value: "", label: "Standaard kanaal" },
  { value: "web", label: "Web" },
  { value: "mobile", label: "Mobiel" },
  { value: "slack", label: "Slack" },
];

const BEST_PRACTICES = [
  "Specificeer datum en tijd voor reminders of agenda-items.",
  "Noem expliciet een e-mailadres voor e-mailverzoeken.",
  "Vraag gerust om samenvattingen of berekeningen – de assistant begrijpt het.",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: crypto.randomUUID(),
      role: "system",
      text: "Welkom! Stel je vraag of kies een van de voorbeelden om te starten.",
    },
  ]);
  const [input, setInput] = useState("");
  const [channel, setChannel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(
    async (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed || loading) return;

      setError(null);
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text: trimmed }]);
      setInput("");
      setLoading(true);

      try {
        const reply = await api.assistantMessage(trimmed, channel ? { channel } : undefined);
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", text: reply.message ?? "", reply },
        ]);
      } catch (err: any) {
        const message =
          err?.message ?? "Het is niet gelukt om de assistant te bereiken. Probeer het later opnieuw.";
        setError(message);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: `Er ging iets mis: ${message}`,
            reply: { intent: "error", parameters: {} },
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [channel, loading],
  );

  const assistantMessages = useMemo(
    () => messages.filter((message) => message.role === "assistant") as Extract<ChatMessage, { role: "assistant" }>[],
    [messages],
  );

  const latestIntent = assistantMessages.at(-1)?.reply.intent ?? "nog geen interactie";

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[40px] border border-white/60 bg-gradient-to-br from-brand-500 via-brand-400 to-mint-400 p-8 text-white shadow-glow">
        <div className="absolute -right-20 top-[-80px] h-64 w-64 rounded-full bg-white/25 blur-3xl" />
        <div className="absolute left-14 top-10 h-20 w-20 rounded-full border border-white/20" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl space-y-4">
            <Badge className="bg-white/25 text-white mix-blend-screen">Virtuele assistent</Badge>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">Vertel wat je wilt automatiseren</h1>
            <p className="text-sm leading-relaxed text-white/80">
              Laat {APP_NAME} e-mails opstellen, reminders plannen, taken aanmaken of agenda-afspraken boeken. Typ je
              opdracht of kies een voorbeeld om meteen te starten.
            </p>
          </div>
          <div className="rounded-3xl border border-white/30 bg-white/15 px-5 py-4 text-sm backdrop-blur">
            <p className="flex items-center gap-2 text-white/80">
              <IconSparkles className="h-4 w-4" /> Laatste intent
            </p>
            <p className="mt-2 text-xl font-display capitalize text-white">{latestIntent}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[320px,1fr]">
        <aside className="space-y-6">
          <div className="glass-card space-y-3 p-5">
            <h2 className="text-sm font-semibold text-ink">Snelle voorbeelden</h2>
            <p className="text-xs text-ink/60">Klik op een voorbeeld om direct een opdracht te versturen.</p>
            <div className="space-y-2">
              {QUICK_PROMPTS.map((item) => (
                <Button
                  key={item.title}
                  type="button"
                  variant="ghost"
                  className="group flex w-full items-start justify-start gap-3 border border-white/50 bg-white/70 text-left text-sm text-ink transition hover:-translate-y-0.5 hover:border-brand-200 hover:text-brand-500"
                  onClick={() => void handleSend(item.prompt)}
                >
                  <IconWand className="mt-0.5 h-4 w-4 text-brand-500 group-hover:text-brand-600" />
                  <span>
                    <span className="block font-medium text-ink">{item.title}</span>
                    <span className="text-xs text-ink/60 group-hover:text-brand-500">{item.prompt}</span>
                  </span>
                </Button>
              ))}
            </div>
          </div>

          <div className="glass-card space-y-3 p-5">
            <h2 className="text-sm font-semibold text-ink">Kanaal</h2>
            <select
              className="w-full rounded-2xl border border-white/50 bg-white/80 px-4 py-2 text-sm text-ink shadow-inner focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
              value={channel}
              onChange={(event) => setChannel(event.target.value)}
            >
              {CHANNEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-ink/60">
              Kies het kanaal waarop het bericht betrekking heeft (bijv. Slack of mobiel) om de context mee te geven.
            </p>
          </div>

          <div className="glass-card space-y-3 p-5">
            <h2 className="text-sm font-semibold text-ink">Tips</h2>
            <ul className="space-y-2 text-xs text-ink/60">
              {BEST_PRACTICES.map((tip) => (
                <li key={tip} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-400" aria-hidden="true" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="space-y-6">
          {error && (
            <div className="glass-card border-red-200/70 bg-red-50/80 px-5 py-3 text-sm text-red-600">{error}</div>
          )}

          <div
            ref={containerRef}
            className="glass-card h-[520px] overflow-y-auto p-6"
            role="log"
            aria-live="polite"
          >
            <div className="space-y-4">
              {messages.map((message) => {
                const isUser = message.role === "user";
                const isAssistant = message.role === "assistant";
                return (
                  <div key={message.id} className={clsx("flex w-full", isUser ? "justify-end" : "justify-start")}>
                    <div
                      className={clsx(
                        "max-w-[70%] rounded-3xl border px-5 py-4 text-sm shadow-sm transition",
                        isUser
                          ? "border-brand-500/50 bg-brand-500 text-white"
                          : "border-white/50 bg-white/85 text-ink",
                      )}
                    >
                      <p>{message.text}</p>
                      {isAssistant && message.reply && (
                        <div className="mt-4 border-t border-white/40 pt-3">
                          <AssistantDetails reply={message.reply} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <form
            className="glass-card flex flex-col gap-3 p-5 md:flex-row md:items-center"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSend(input);
            }}
          >
            <input
              className="flex-1 rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-ink shadow-inner focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="Bijv. Plan volgende week dinsdag om 10:00 een afspraak met team Zorg in ruimte A."
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
            <Button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 md:w-auto"
              disabled={loading}
            >
              {loading ? (
                <>
                  <IconLoader2 className="h-4 w-4 animate-spin" /> Versturen...
                </>
              ) : (
                <>
                  Verstuur <IconArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}

function AssistantDetails({ reply }: { reply: AssistantReply }) {
  const parameters = Object.entries(reply.parameters ?? {}).filter(([_, value]) => value !== undefined);

  return (
    <div className="space-y-3 text-xs text-ink/70">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-pearl-50 px-3 py-1 font-semibold uppercase tracking-wide text-brand-500">
          <IconSparkles className="h-3 w-3 text-brand-400" /> Intent: {reply.intent}
        </span>
        {typeof reply.confidence === "number" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-mint-50 px-3 py-1 font-semibold text-mint-700">
            <IconCheck className="h-3 w-3" />
            Zekerheid: {(reply.confidence * 100).toFixed(1)}%
          </span>
        )}
      </div>

      {!!parameters.length && (
        <div className="space-y-1 rounded-2xl border border-white/40 bg-white/70 p-3">
          <p className="font-semibold text-ink">Parameters</p>
          <dl className="grid gap-1">
            {parameters.map(([key, value]) => (
              <div key={key} className="grid grid-cols-[110px,1fr] gap-2">
                <dt className="text-ink/50">{key}</dt>
                <dd className="font-medium text-ink">{stringifyValue(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {reply.result && (
        <div className="space-y-1 rounded-2xl border border-white/40 bg-white/70 p-3">
          <p className="font-semibold text-ink">Resultaat</p>
          <StructuredResult result={reply.result} />
        </div>
      )}
    </div>
  );
}

function StructuredResult({ result }: { result: Record<string, unknown> }) {
  const entries = Object.entries(result);
  if (!entries.length) {
    return <p className="text-ink/50">Geen aanvullende data.</p>;
  }

  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => {
        if (isPlainObject(value)) {
          return (
            <div key={key} className="rounded-2xl border border-white/40 bg-white/80 p-2">
              <p className="text-xs font-semibold uppercase text-ink/50">{key}</p>
              <dl className="mt-1 grid gap-1 text-xs">
                {Object.entries(value as Record<string, unknown>).map(([innerKey, innerValue]) => (
                  <div key={innerKey} className="grid grid-cols-[110px,1fr] gap-2">
                    <dt className="text-ink/50">{innerKey}</dt>
                    <dd className="text-ink">{stringifyValue(innerValue)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        }

        if (Array.isArray(value)) {
          return (
            <div key={key} className="rounded-2xl border border-white/40 bg-white/80 p-2">
              <p className="text-xs font-semibold uppercase text-ink/50">{key}</p>
              <ol className="mt-1 list-decimal space-y-1 pl-4 text-xs text-ink">
                {(value as unknown[]).map((item, index) => (
                  <li key={index}>{stringifyValue(item)}</li>
                ))}
              </ol>
            </div>
          );
        }

        return (
          <div key={key} className="grid grid-cols-[120px,1fr] gap-2 text-xs text-ink">
            <span className="font-semibold text-ink/50">{key}</span>
            <span>{stringifyValue(value)}</span>
          </div>
        );
      })}
    </div>
  );
}

function stringifyValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toString();
  if (typeof value === "boolean") return value ? "Ja" : "Nee";
  if (value === null || value === undefined) return "-";
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return String(value);
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
