"use client";

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/app/providers/AuthProvider";
import { api, type Reminder, type KanbanTask, type Board } from "@/lib/api";
import { APP_NAME } from "@/lib/brand";

type Metrics = {
  openTasks: number;
  upcomingReminders: number;
  completedTasks: number;
  nextReminder?: Reminder;
};

const QUICK_LINKS = [
  { title: "Assistant", href: "/assistant", pill: "AI Workflows" },
  { title: "Kanban", href: "/boards", pill: "Team productivity" },
  { title: "Reminders", href: "/reminders", pill: "Automatisering" },
];

export default function DashboardPage() {
  const { authenticatedUser, isManager } = useAuth();
  const [primaryBoard, setPrimaryBoard] = useState<Board | null>(null);
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setError(null);
      try {
        const [boards, reminderList] = await Promise.all([api.boardsList(), api.remindersList()]);
        const board = boards[0] ?? null;
        const taskList = board ? await api.boardTasksList(board.id) : [];
        if (!mounted) return;
        setPrimaryBoard(board);
        setTasks(taskList);
        setReminders(reminderList);
      } catch (err: any) {
        if (!mounted) return;
        setError(err.message ?? "Kon dashboardgegevens niet laden");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const metrics = useMemo(() => summarize(tasks, reminders), [tasks, reminders]);
  const friendlyName = useMemo(
    () => authenticatedUser?.email?.split("@")[0]?.replace(/[._]/g, " ") ?? "collega",
    [authenticatedUser],
  );

  const managerLinks = isManager
    ? [
        { title: "Team", href: "/team", pill: "Rollen & toegang" },
        { title: "Beschikbaarheid", href: "/availability", pill: "Planningsbasis" },
        { title: "Planner", href: "/planner", pill: "AI suggesties" },
      ]
    : [];

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[40px] border border-white/60 bg-gradient-to-br from-brand-500 via-brand-400 to-mint-400 p-8 text-white shadow-glow">
        <div className="absolute -right-16 top-[-80px] h-64 w-64 rounded-full bg-white/20 blur-3xl" />
        <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl space-y-5">
            <Badge className="bg-white/25 text-white mix-blend-screen">Vandaag</Badge>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              Welkom terug, <span className="text-white/80">{friendlyName}</span>
            </h1>
            <p className="max-w-lg text-sm leading-relaxed text-white/80">
              Je digitale assistent houdt taken, reminders en teamactiviteiten bij. Kies een actie om direct te starten
              of bekijk wat er vandaag gepland staat.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/assistant"
                className={clsx(buttonVariants({ variant: "primary" }), "w-full justify-center text-center md:w-auto")}
              >
                Start een nieuwe opdracht
              </Link>
              <Link
                href="/planner"
                className={clsx(buttonVariants({ variant: "secondary" }), "w-full justify-center text-center md:w-auto")}
              >
                AI-planner openen
              </Link>
            </div>
          </div>
          <div className="grid gap-3 text-sm text-white/85">
            <HeroStat
              title="Open taken"
              value={metrics.openTasks}
              caption="die vandaag aandacht nodig hebben"
            />
            <HeroStat
              title="Komende reminders"
              value={metrics.upcomingReminders}
              caption={
                metrics.nextReminder
                  ? formatDate(metrics.nextReminder.remindAt)
                  : "Nog geen reminders gepland"
              }
            />
          </div>
        </div>
      </section>

      {error && (
        <div className="glass-card border-red-100/60 bg-red-50/70 text-red-600">
          <div className="rounded-[28px] px-6 py-4 text-sm">{error}</div>
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          {
            title: "Open taken",
            value: metrics.openTasks,
            caption: "wachten op actie",
            href: primaryBoard ? `/boards/${primaryBoard.id}` : "/boards",
          },
          {
            title: "Komende reminders",
            value: metrics.upcomingReminders,
            caption: "ingepland in je agenda",
            href: "/reminders",
          },
          {
            title: "Afgeronde taken",
            value: metrics.completedTasks,
            caption: "al voltooid deze week",
            href: primaryBoard ? `/boards/${primaryBoard.id}` : "/boards",
          },
        ].map((stat) => (
          <Link key={stat.title} href={stat.href} className="glass-card block p-6 transition hover:-translate-y-1">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-500">{stat.title}</p>
            <p className="mt-3 text-4xl font-display text-ink">{stat.value}</p>
            <p className="mt-2 text-sm text-ink/60">{stat.caption}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {[...QUICK_LINKS, ...managerLinks].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="glass-card group relative overflow-hidden p-5 transition hover:-translate-y-1"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-400 via-mint-400 to-blush-400 opacity-0 transition group-hover:opacity-100" />
            <span className="pill mb-3 bg-brand-50 text-brand-500">{card.pill}</span>
            <h3 className="text-xl font-semibold text-ink">{card.title}</h3>
            <p className="mt-2 text-sm text-ink/60">Bekijk workflows en stuur acties direct vanuit deze module.</p>
            <span className="mt-6 inline-flex items-center text-sm font-semibold text-brand-500">
              Open {card.title} &rarr;
            </span>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <DataCard
          title="Open taken"
          description={
            primaryBoard
              ? `Je belangrijkste vijf taken op ${primaryBoard.name}.`
              : "Maak een board om je belangrijkste taken snel te zien."
          }
          href={primaryBoard ? `/boards/${primaryBoard.id}` : "/boards"}
          loading={loading}
          emptyMessage={
            primaryBoard
              ? "Geen taken gevonden. Gebruik de assistant om direct een nieuwe taak toe te voegen."
              : "Nog geen board beschikbaar. Maak er een aan op de Kanban-pagina."
          }
          items={tasks.slice(0, 5).map((task) => ({
            id: task.id,
            title: task.title,
            meta: task.dueDate ? formatDate(task.dueDate) : undefined,
            status: task.status,
            assignee: task.assignee?.email ?? null,
          }))}
        />

        <ReminderCard
          loading={loading}
          reminders={reminders.slice(0, 5)}
          emptyMessage="Nog geen reminders gepland. Vraag de assistant om een nieuwe herinnering."
        />
      </section>
    </div>
  );
}

function HeroStat({ title, value, caption }: { title: string; value: number; caption: string }) {
  return (
    <div className="rounded-3xl border border-white/30 bg-white/15 px-5 py-4 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.3em] text-white/70">{title}</p>
      <p className="mt-2 text-3xl font-display">{value}</p>
      <p className="text-xs text-white/70">{caption}</p>
    </div>
  );
}

function DataCard({
  title,
  description,
  href,
  loading,
  emptyMessage,
  items,
}: {
  title: string;
  description: string;
  href: string;
  loading: boolean;
  emptyMessage: string;
  items: Array<{ id: string; title: string; meta?: string; status?: string; assignee?: string | null }>;
}) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-ink">{title}</h3>
          <p className="text-sm text-ink/60">{description}</p>
        </div>
        <Link
          href={href}
          className={clsx(buttonVariants({ variant: "ghost" }), "justify-center text-center md:w-auto")}
        >
          Bekijk alles
        </Link>
      </div>
      <div className="mt-5 space-y-3">
        {loading ? (
          <SkeletonList label={title} />
        ) : items.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/40 bg-white/85 px-4 py-3 text-sm shadow-sm transition hover:shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={item.status === "done" ? "line-through text-ink/40" : "text-ink"}>{item.title}</p>
                  {item.assignee && (
                    <p className="mt-1 text-xs text-ink/50">Toegewezen aan {item.assignee}</p>
                  )}
                </div>
                {item.meta && (
                  <span className="rounded-full bg-pearl-50 px-3 py-1 text-xs font-semibold text-brand-500">
                    {item.meta}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ReminderCard({
  loading,
  reminders,
  emptyMessage,
}: {
  loading: boolean;
  reminders: Reminder[];
  emptyMessage: string;
}) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-ink">Aanstaande reminders</h3>
          <p className="text-sm text-ink/60">De eerstvolgende momenten waarop {APP_NAME} een seintje verstuurt.</p>
        </div>
        <Link
          href="/reminders"
          className={clsx(buttonVariants({ variant: "ghost" }), "justify-center text-center md:w-auto")}
        >
          Naar reminders
        </Link>
      </div>
      <div className="mt-5 space-y-3">
        {loading ? (
          <SkeletonList label="reminders" />
        ) : reminders.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          reminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-center justify-between rounded-2xl border border-white/40 bg-white/85 px-4 py-3 text-sm shadow-sm"
            >
              <div>
                <p className="text-ink">{reminder.text}</p>
                <p className="mt-1 text-xs text-ink/50">
                  {reminder.sent ? "Verzonden" : "Gepland"} - {formatDate(reminder.remindAt)}
                </p>
              </div>
              <Badge variant="info">{reminder.sent ? "Verstuurd" : "Komend"}</Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SkeletonList({ label }: { label: string }) {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, index) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          className="h-16 animate-pulse rounded-2xl bg-white/50"
          aria-hidden="true"
        >
          <span className="sr-only">Laden {label}...</span>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-200 bg-pearl-50/80 p-6 text-sm text-ink/60">
      {message}
    </div>
  );
}

function summarize(tasks: KanbanTask[], reminders: Reminder[]): Metrics {
  const openTasks = tasks.filter((task) => task.status !== "done").length;
  const completedTasks = tasks.filter((task) => task.status === "done").length;
  const upcomingReminders = reminders.filter((reminder) => !reminder.sent).length;
  const nextReminder = reminders
    .filter((reminder) => !reminder.sent)
    .sort((a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime())[0];
  return { openTasks, upcomingReminders, nextReminder, completedTasks };
}

function formatDate(input: string): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return input;
  }
  return `${date.toLocaleDateString("nl-NL", {
    day: "2-digit",
    month: "short",
  })} - ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}


