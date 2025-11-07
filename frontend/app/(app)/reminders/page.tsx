"use client";

import { useEffect, useMemo, useState } from "react";

import { api, type Reminder } from "@/lib/api";
import { Button } from "@/components/ui/button";

type ReminderFilter = "upcoming" | "past" | "all";

const rtf = new Intl.RelativeTimeFormat("nl", { numeric: "auto" });

function formatRelative(date: Date) {
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, "minute");
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, "hour");
  }
  const diffDays = Math.round(diffHours / 24);
  return rtf.format(diffDays, "day");
}

export default function RemindersPage() {
  const [items, setItems] = useState<Reminder[]>([]);
  const [text, setText] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const [filter, setFilter] = useState<ReminderFilter>("upcoming");
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const data = await api.remindersList();
      setItems(data);
    } catch (err: any) {
      setError(err.message ?? "Kan reminders niet laden");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const addReminder = async () => {
    if (!text.trim() || !remindAt) {
      return;
    }
    try {
      await api.remindersCreate(text.trim(), new Date(remindAt).toISOString());
      setText("");
      setRemindAt("");
      await load();
    } catch (err: any) {
      setError(err.message ?? "Kan reminder niet opslaan");
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      await api.remindersDelete(id);
      await load();
    } catch (err: any) {
      setError(err.message ?? "Kan reminder niet verwijderen");
    }
  };

  const filteredReminders = useMemo(() => {
    return [...items]
      .sort((a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime())
      .filter((reminder) => {
        const remindDate = new Date(reminder.remindAt);
        if (filter === "all") return true;
        if (filter === "upcoming") {
          return remindDate.getTime() >= Date.now();
        }
        return remindDate.getTime() < Date.now();
      });
  }, [items, filter]);

  const stats = useMemo(() => {
    const upcoming = items.filter((reminder) => new Date(reminder.remindAt).getTime() >= Date.now()).length;
    const past = items.length - upcoming;
    const sent = items.filter((reminder) => reminder.sent).length;
    return { upcoming, past, total: items.length, sent };
  }, [items]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Reminders</h1>
        <p className="text-slate-600">
          Plan herinneringen die automatisch in Google Agenda worden gezet en meldingen versturen.
        </p>
      </header>

      <section className="grid gap-3 rounded border bg-white p-4 shadow-sm text-sm text-slate-600 md:grid-cols-4">
        <div>
          <p className="font-semibold text-slate-800">{stats.upcoming}</p>
          <p>Komend</p>
        </div>
        <div>
          <p className="font-semibold text-slate-800">{stats.past}</p>
          <p>Verlopen</p>
        </div>
        <div>
          <p className="font-semibold text-slate-800">{stats.sent}</p>
          <p>Verzonden</p>
        </div>
        <div>
          <p className="font-semibold text-slate-800">{stats.total}</p>
          <p>Totaal</p>
        </div>
      </section>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded border bg-white p-4 shadow-sm space-y-4">
        <h2 className="text-lg font-medium">Nieuwe reminder</h2>
        <div className="grid gap-2 md:grid-cols-[1fr,220px,120px]">
          <input
            className="rounded border p-2"
            placeholder="Omschrijving"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <input
            className="rounded border p-2"
            type="datetime-local"
            value={remindAt}
            onChange={(event) => setRemindAt(event.target.value)}
          />
          <Button onClick={() => void addReminder()}>Reminder toevoegen</Button>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-2 rounded border bg-white p-4 shadow-sm">
        {(["upcoming", "past", "all"] as ReminderFilter[]).map((option) => (
          <Button
            key={option}
            variant={filter === option ? "secondary" : "ghost"}
            size="sm"
            className="rounded-full px-4"
            onClick={() => setFilter(option)}
          >
            {option === "upcoming" ? "Komend" : option === "past" ? "Verlopen" : "Alles"}
          </Button>
        ))}
      </section>

      <ul className="space-y-2">
        {filteredReminders.map((reminder) => {
          const remindDate = new Date(reminder.remindAt);
          const isPast = remindDate.getTime() < Date.now();
          return (
            <li
              key={reminder.id}
              className="flex flex-col gap-3 rounded border bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="font-medium">{reminder.text}</div>
                <div className="text-xs text-slate-500">
                  {remindDate.toLocaleString()} - {formatRelative(remindDate)}
                </div>
                {reminder.sent && (
                  <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    Verzonden
                  </span>
                )}
                {!reminder.sent && isPast && (
                  <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    Nog niet verstuurd
                  </span>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => void deleteReminder(reminder.id)}>
                Verwijderen
              </Button>
            </li>
          );
        })}
        {!filteredReminders.length && (
          <li className="rounded border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-500">
            Geen reminders gevonden.
          </li>
        )}
      </ul>
    </div>
  );
}



