"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/app/providers/AuthProvider";
import { api, type PlanningSuggestion, type TeamMember } from "@/lib/api";
import { Button } from "@/components/ui/button";

const today = new Date().toISOString().slice(0, 10);

export default function PlannerPage() {
  const { isManager } = useAuth();
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [location, setLocation] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<PlanningSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isManager) {
      router.replace("/dashboard");
    }
  }, [isManager, router]);

  useEffect(() => {
    if (!isManager) return;
    let cancelled = false;
    api
      .teamList()
      .then((members) => {
        if (!cancelled) setTeamMembers(members);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err.message ?? "Kon teamleden niet laden");
      });
    return () => {
      cancelled = true;
    };
  }, [isManager]);

  const availableTeamMembers = useMemo(
    () => teamMembers.filter((member) => member.role === "MEDEWERKER"),
    [teamMembers],
  );

  const togglePreferred = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const generateSuggestions = async () => {
    setError(null);
    setLoading(true);
    try {
      const preferredIds = selectedUserIds.filter((id) =>
        availableTeamMembers.some((member) => member.id === id),
      );
      const payload = {
        date,
        startTime,
        endTime,
        preferredUserIds: preferredIds.length ? preferredIds : undefined,
        location: location.trim() || undefined,
      };
      const result = await api.planningSuggest(payload);
      setSuggestions(result);
    } catch (err: any) {
      setError(err.message ?? "Kon geen voorstel genereren");
    } finally {
      setLoading(false);
    }
  };

  if (!isManager) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Planner</h1>
          <p className="text-slate-600">
            Vraag de assistent om een voorstel te doen voor diensten of afspraken.
          </p>
        </div>
        <Link href="/dashboard" className="text-sm text-brand-600 hover:underline">
          Terug naar dashboard
        </Link>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded border bg-white p-4 shadow-sm space-y-4">
        <h2 className="text-lg font-medium">Aanvraag</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="rounded border p-2"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className="rounded border p-2"
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
            <input
              className="rounded border p-2"
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
            />
          </div>
          <input
            className="rounded border p-2"
            placeholder="Locatie (optioneel)"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-600">Voorkeursmedewerkers</p>
          <div className="grid gap-2 md:grid-cols-2">
            {availableTeamMembers.map((member) => (
              <label key={member.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedUserIds.includes(member.id)}
                  onChange={() => togglePreferred(member.id)}
                />
                <span>
                  {member.email}
                  <span className="ml-2 rounded bg-slate-100 px-1 text-xs uppercase text-slate-500">
                    {member.role}
                  </span>
                </span>
              </label>
            ))}
            {availableTeamMembers.length === 0 && (
              <p className="text-sm text-slate-500">
                Nog geen medewerkers om te plannen. Nodig eerst medewerkers uit en stel hun beschikbaarheid
                in.
              </p>
            )}
          </div>
        </div>

        <Button onClick={() => void generateSuggestions()} disabled={loading}>
          Voorstel maken
        </Button>
      </section>

      <section className="rounded border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-medium">Voorstellen</h2>
        {loading ? (
          <p className="text-sm text-slate-500">Bezig met plannen...</p>
        ) : suggestions.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nog geen voorstel. Vul de aanvraag in en kies &ldquo;Voorstel maken&rdquo;.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {suggestions.map((suggestion, index) => (
              <li key={`${suggestion.user.id}-${index}`} className="rounded border bg-slate-50 p-4 text-sm">
                <div className="flex flex-col gap-1">
                  <div className="text-base font-semibold">{suggestion.user.email}</div>
                  <div>
                    Beschikbaar: {suggestion.availableFrom} - {suggestion.availableUntil}
                  </div>
                  {suggestion.location && <div>Locatie: {suggestion.location}</div>}
                  <div>Huidige taken op deze dag: {suggestion.assignedTasksThatDay}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
