"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/app/providers/AuthProvider";
import { api, type TimeEntry, type TimeEntryWithUser } from "@/lib/api";
import { Button } from "@/components/ui/button";

type MyFilter = "pending" | "approved" | "all";

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}u ${mins.toString().padStart(2, "0")}m`;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("nl-NL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

export default function TimePage() {
  const { isManager, authenticatedUser } = useAuth();
  const [myEntries, setMyEntries] = useState<TimeEntry[]>([]);
  const [pendingEntries, setPendingEntries] = useState<TimeEntryWithUser[]>([]);
  const [myFilter, setMyFilter] = useState<MyFilter>("pending");
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [projectId, setProjectId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [managerError, setManagerError] = useState<string | null>(null);

  const loadMine = useCallback(async () => {
    try {
      setError(null);
      const data = await api.timeListMine();
      setMyEntries(data);
    } catch (err: any) {
      setError(err.message ?? "Kon urenregistraties niet laden");
    }
  }, []);

  const loadPending = useCallback(async () => {
    if (!isManager) return;
    try {
      setManagerError(null);
      const data = await api.timeListAll({ approved: false });
      setPendingEntries(data);
    } catch (err: any) {
      setManagerError(err.message ?? "Kon openstaande goedkeuringen niet laden");
    }
  }, [isManager]);

  useEffect(() => {
    void loadMine();
    void loadPending();
  }, [loadMine, loadPending]);

  const createEntry = async () => {
    if (!date || !startTime || !endTime) {
      setError("Vul datum en start/eindtijd in");
      return;
    }
    const startIso = new Date(`${date}T${startTime}`);
    const endIso = new Date(`${date}T${endTime}`);
    if (Number.isNaN(startIso.getTime()) || Number.isNaN(endIso.getTime())) {
      setError("Ongeldige tijd ingevoerd");
      return;
    }
    if (endIso <= startIso) {
      setError("Eindtijd moet later zijn dan starttijd");
      return;
    }
    setLoading(true);
    try {
      await api.timeAdd({
        date: new Date(date).toISOString(),
        startTime: startIso.toISOString(),
        endTime: endIso.toISOString(),
        projectId: projectId.trim() || undefined,
      });
      setProjectId("");
      void loadMine();
    } catch (err: any) {
      setError(err.message ?? "Kon urenregistratie niet opslaan");
    } finally {
      setLoading(false);
    }
  };

  const approveEntry = async (id: string, approve: boolean) => {
    try {
      await api.timeApprove(id, approve);
      await loadPending();
      await loadMine();
    } catch (err: any) {
      setManagerError(err.message ?? "Kon status niet bijwerken");
    }
  };

  const filteredMine = useMemo(() => {
    return myEntries
      .slice()
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .filter((entry) => {
        if (myFilter === "all") return true;
        return myFilter === "approved" ? entry.approved : !entry.approved;
      });
  }, [myEntries, myFilter]);

  const myTotals = useMemo(() => {
    const total = myEntries.reduce((sum, entry) => sum + entry.durationMin, 0);
    const approved = myEntries
      .filter((entry) => entry.approved)
      .reduce((sum, entry) => sum + entry.durationMin, 0);
    const pending = total - approved;
    return { total, approved, pending };
  }, [myEntries]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Urenregistratie</h1>
        <p className="text-slate-600">
          Registreer gewerkte uren en bekijk je status. Managers kunnen registraties goed- of afkeuren.
        </p>
      </header>

      <section className="grid gap-3 rounded border bg-white p-4 shadow-sm text-sm text-slate-600 md:grid-cols-3">
        <div>
          <p className="font-semibold text-slate-800">{formatDuration(myTotals.total)}</p>
          <p>Totaal geregistreerd</p>
        </div>
        <div>
          <p className="font-semibold text-slate-800">{formatDuration(myTotals.approved)}</p>
          <p>Goedgekeurd</p>
        </div>
        <div>
          <p className="font-semibold text-slate-800">{formatDuration(myTotals.pending)}</p>
          <p>In afwachting</p>
        </div>
      </section>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <section className="space-y-4 rounded border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-medium">Nieuwe registratie</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <label className="text-sm text-slate-600">
            Datum
            <input
              className="mt-1 w-full rounded border p-2"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          <label className="text-sm text-slate-600">
            Starttijd
            <input
              className="mt-1 w-full rounded border p-2"
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </label>
          <label className="text-sm text-slate-600">
            Eindtijd
            <input
              className="mt-1 w-full rounded border p-2"
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
            />
          </label>
          <label className="text-sm text-slate-600">
            Project/Klant (optioneel)
            <input
              className="mt-1 w-full rounded border p-2"
              placeholder="Bijvoorbeeld Klant ABC"
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
            />
          </label>
        </div>
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            Duur:{" "}
            <strong>
              {formatDuration(
                Math.max(
                  0,
                  Math.round(
                    (new Date(`${date}T${endTime}`).getTime() - new Date(`${date}T${startTime}`).getTime()) /
                      (1000 * 60),
                  ),
                ),
              )}
            </strong>
          </span>
        <Button onClick={() => void createEntry()} disabled={loading}>
          Registreren
        </Button>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {(["pending", "approved", "all"] as MyFilter[]).map((option) => (
            <Button
              key={option}
              variant={myFilter === option ? "secondary" : "ghost"}
              size="sm"
              className="rounded-full px-4"
              onClick={() => setMyFilter(option)}
            >
              {option === "pending" ? "In afwachting" : option === "approved" ? "Goedgekeurd" : "Alles"}
            </Button>
          ))}
        </div>
        <div className="overflow-hidden rounded border bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Datum</th>
                <th className="px-4 py-3">Periode</th>
                <th className="px-4 py-3">Duur</th>
                <th className="px-4 py-3">Project/Klant</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredMine.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">{formatDate(entry.date)}</td>
                  <td className="px-4 py-3">
                    {new Date(entry.startTime).toLocaleTimeString("nl-NL", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {new Date(entry.endTime).toLocaleTimeString("nl-NL", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {formatDuration(entry.durationMin)}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{entry.projectId ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        entry.approved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {entry.approved ? "Goedgekeurd" : "In afwachting"}
                    </span>
                  </td>
                </tr>
              ))}
              {!filteredMine.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-5 text-center text-sm text-slate-500">
                    Geen registraties gevonden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isManager && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Goedkeuringen (manager)</h2>
            <p className="text-sm text-slate-600">
              Openstaande registraties van teamleden. Keur goed om ze te verwerken in rapportages.
            </p>
          </div>
          {managerError && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {managerError}
            </div>
          )}
          <div className="overflow-hidden rounded border bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Medewerker</th>
                  <th className="px-4 py-3">Datum</th>
                  <th className="px-4 py-3">Periode</th>
                  <th className="px-4 py-3">Duur</th>
                  <th className="px-4 py-3">Actie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pendingEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-700">{entry.user.email}</div>
                      <div className="text-xs uppercase text-slate-400">{entry.user.role}</div>
                    </td>
                    <td className="px-4 py-3">{formatDate(entry.date)}</td>
                    <td className="px-4 py-3">
                      {new Date(entry.startTime).toLocaleTimeString("nl-NL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {new Date(entry.endTime).toLocaleTimeString("nl-NL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {formatDuration(entry.durationMin)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => void approveEntry(entry.id, true)}
                        >
                          Goedkeuren
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => void approveEntry(entry.id, false)}
                        >
                          Afkeuren
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!pendingEntries.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-5 text-center text-sm text-slate-500">
                      Geen openstaande registraties.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
