"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  api,
  type AvailabilityEntry,
  type AvailabilityPayloadEntry,
  type TeamMember,
} from "@/lib/api";
import { Button } from "@/components/ui/button";

type AvailabilityFormEntry = {
  weekday: number;
  startTime: string;
  endTime: string;
  location?: string;
};

const DEFAULT_ENTRY: AvailabilityFormEntry = {
  weekday: 1,
  startTime: "09:00",
  endTime: "17:00",
  location: "",
};

const WEEKDAY_NAMES = [
  "Zondag",
  "Maandag",
  "Dinsdag",
  "Woensdag",
  "Donderdag",
  "Vrijdag",
  "Zaterdag",
];

export default function AvailabilityPage() {
  const { isManager, authenticatedUser } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(authenticatedUser?.id);
  const [entries, setEntries] = useState<AvailabilityFormEntry[]>([]);
  const [draft, setDraft] = useState<AvailabilityFormEntry>({ ...DEFAULT_ENTRY });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isManager) {
      return;
    }
    let cancelled = false;
    api
      .teamList()
      .then((members) => {
        if (cancelled) return;
        setTeamMembers(members);
        if (!selectedUserId && members.length) {
          setSelectedUserId(members[0]!.id);
        }
      })
      .catch((err: any) => {
        if (!cancelled) setError(err.message ?? "Kon teamleden niet laden");
      });
    return () => {
      cancelled = true;
    };
  }, [isManager, selectedUserId]);

  useEffect(() => {
    const userId = isManager ? selectedUserId : authenticatedUser?.id;
    if (!userId) {
      setEntries([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .availabilityList(isManager ? userId : undefined)
      .then((items) => {
        if (cancelled) return;
        setEntries(items.map(toFormEntry));
      })
      .catch((err: any) => {
        if (!cancelled) setError(err.message ?? "Kon beschikbaarheid niet laden");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isManager, selectedUserId, authenticatedUser]);

  const sortedEntries = useMemo(
    () =>
      [...entries].sort((a, b) => {
        if (a.weekday !== b.weekday) return a.weekday - b.weekday;
        return a.startTime.localeCompare(b.startTime);
      }),
    [entries],
  );

  const handleAddEntry = () => {
    if (!isValidEntry(draft)) {
      setError("Starttijd moet voor eindtijd liggen.");
      return;
    }
    setEntries((prev) => [...prev, draft]);
    setDraft({ ...DEFAULT_ENTRY });
  };

  const handleRemoveEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = async () => {
    const targetUserId = isManager ? selectedUserId : undefined;
    if (isManager && !targetUserId) {
      setError("Selecteer eerst een medewerker.");
      return;
    }
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      const payload: { userId?: string; entries: AvailabilityPayloadEntry[] } = {
        entries: entries.map((entry) => ({
          weekday: entry.weekday,
          startTime: entry.startTime,
          endTime: entry.endTime,
          location: entry.location?.trim() || undefined,
        })),
      };
      if (targetUserId) {
        payload.userId = targetUserId;
      }
      const updated = await api.availabilityUpsert(payload);
      setEntries(updated.map(toFormEntry));
      setMessage("Beschikbaarheid opgeslagen.");
    } catch (err: any) {
      setError(err.message ?? "Kon beschikbaarheid niet opslaan");
    } finally {
      setSaving(false);
    }
  };

  const currentUserLabel = useMemo(() => {
    const userId = isManager ? selectedUserId : authenticatedUser?.id;
    if (!userId) return "";
    const member = teamMembers.find((item) => item.id === userId);
    return member ? member.email : authenticatedUser?.email ?? "";
  }, [isManager, selectedUserId, teamMembers, authenticatedUser]);

  if (!authenticatedUser) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Beschikbaarheid</h1>
          <p className="text-slate-600">
            {isManager
              ? "Beheer beschikbaarheid voor je teamleden."
              : "Bekijk of wijzig je eigen beschikbaarheid."}
          </p>
        </div>
        <Link href="/dashboard" className="text-sm text-brand-600 hover:underline">
          Terug naar dashboard
        </Link>
      </div>

      {isManager && (
        <section className="rounded border bg-white p-4 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-slate-600">
            Selecteer medewerker
          </label>
          <select
            className="rounded border p-2 text-sm"
            value={selectedUserId ?? ""}
            onChange={(event) => setSelectedUserId(event.target.value || undefined)}
          >
            {teamMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.email} ({member.role})
              </option>
            ))}
          </select>
        </section>
      )}

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      )}

      <section className="rounded border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-medium">Nieuwe beschikbaarheid toevoegen</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <select
            className="rounded border p-2 text-sm"
            value={draft.weekday}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, weekday: Number.parseInt(event.target.value, 10) }))
            }
          >
            {WEEKDAY_NAMES.map((label, index) => (
              <option key={index} value={index}>
                {label}
              </option>
            ))}
          </select>
          <input
            className="rounded border p-2 text-sm"
            type="time"
            value={draft.startTime}
            onChange={(event) => setDraft((prev) => ({ ...prev, startTime: event.target.value }))}
          />
          <input
            className="rounded border p-2 text-sm"
            type="time"
            value={draft.endTime}
            onChange={(event) => setDraft((prev) => ({ ...prev, endTime: event.target.value }))}
          />
          <input
            className="rounded border p-2 text-sm"
            placeholder="Locatie (optioneel)"
            value={draft.location ?? ""}
            onChange={(event) => setDraft((prev) => ({ ...prev, location: event.target.value }))}
          />
        </div>
        <Button className="mt-4 w-full md:w-auto" onClick={handleAddEntry}>
          Toevoegen
        </Button>
      </section>

      <section className="rounded border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-medium">Beschikbaarheid voor {currentUserLabel}</h2>
        {loading ? (
          <p className="text-sm text-slate-500">Laden...</p>
        ) : sortedEntries.length === 0 ? (
          <p className="text-sm text-slate-500">Nog geen beschikbaarheid vastgelegd.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {sortedEntries.map((entry, index) => (
              <div
                key={`${entry.weekday}-${entry.startTime}-${entry.endTime}-${index}`}
                className="flex items-center justify-between rounded border bg-slate-50 p-3 text-sm"
              >
                <div>
                  <div className="font-medium">
                    {WEEKDAY_NAMES[entry.weekday]} {entry.startTime} - {entry.endTime}
                  </div>
                  {entry.location && (
                    <div className="text-xs text-slate-500">Locatie: {entry.location}</div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-500"
                  onClick={() => handleRemoveEntry(index)}
                >
                  Verwijderen
                </Button>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4">
          <Button onClick={() => void handleSave()} disabled={saving}>
            Opslaan
          </Button>
        </div>
      </section>
    </div>
  );
}

function toFormEntry(entry: AvailabilityEntry): AvailabilityFormEntry {
  return {
    weekday: entry.weekday,
    startTime: entry.startTime.slice(0, 5),
    endTime: entry.endTime.slice(0, 5),
    location: entry.location ?? "",
  };
}

function isValidEntry(entry: AvailabilityFormEntry): boolean {
  return entry.startTime < entry.endTime;
}
