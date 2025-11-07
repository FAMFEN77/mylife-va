"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/app/providers/AuthProvider";
import { api, type LeaveRequest, type LeaveRequestWithUser } from "@/lib/api";
import { Button } from "@/components/ui/button";

type StatusFilter = "pending" | "approved" | "denied" | "all";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("nl-NL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

export default function LeavePage() {
  const { isManager } = useAuth();
  const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<LeaveRequestWithUser[]>([]);
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [type, setType] = useState("vakantie");
  const [note, setNote] = useState("");
  const [myFilter, setMyFilter] = useState<StatusFilter>("pending");
  const [error, setError] = useState<string | null>(null);
  const [managerError, setManagerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadMine = useCallback(async () => {
    try {
      setError(null);
      const data = await api.leaveListMine();
      setMyRequests(data);
    } catch (err: any) {
      setError(err.message ?? "Kon verlofaanvragen niet laden");
    }
  }, []);

  const loadPending = useCallback(async () => {
    if (!isManager) return;
    try {
      setManagerError(null);
      const data = await api.leaveListPending();
      setPendingRequests(data);
    } catch (err: any) {
      setManagerError(err.message ?? "Kon verlofaanvragen niet laden");
    }
  }, [isManager]);

  useEffect(() => {
    void loadMine();
    void loadPending();
  }, [loadMine, loadPending]);

  const createRequest = async () => {
    if (!startDate || !endDate || !type.trim()) {
      setError("Vul startdatum, einddatum en type in");
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError("Ongeldige datum");
      return;
    }
    if (end < start) {
      setError("Einddatum kan niet voor de startdatum liggen");
      return;
    }
    setLoading(true);
    try {
      await api.leaveRequest({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        type: type.trim(),
        note: note.trim() || undefined,
      });
      setNote("");
      await loadMine();
      void loadPending();
    } catch (err: any) {
      setError(err.message ?? "Kon verlofaanvraag niet opslaan");
    } finally {
      setLoading(false);
    }
  };

  const approveLeave = async (id: string, approve: boolean) => {
    try {
      await api.leaveApprove(id, approve);
      await loadPending();
      await loadMine();
    } catch (err: any) {
      setManagerError(err.message ?? "Kon status niet bijwerken");
    }
  };

  const filteredMyRequests = useMemo(() => {
    return myRequests
      .slice()
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .filter((request) => {
        if (myFilter === "all") return true;
        return request.status === myFilter;
      });
  }, [myRequests, myFilter]);

  const stats = useMemo(() => {
    const pending = myRequests.filter((request) => request.status === "pending").length;
    const approved = myRequests.filter((request) => request.status === "approved").length;
    const denied = myRequests.filter((request) => request.status === "denied").length;
    return { pending, approved, denied, total: myRequests.length };
  }, [myRequests]);

  const requestDuration = (entry: LeaveRequest) => {
    const start = new Date(entry.startDate);
    const end = new Date(entry.endDate);
    const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${days} dag${days === 1 ? "" : "en"}`;
  };

  const statusBadge = (status: LeaveRequest["status"]) => {
    switch (status) {
      case "approved":
        return "bg-emerald-100 text-emerald-700";
      case "denied":
        return "bg-red-100 text-red-700";
      default:
        return "bg-amber-100 text-amber-700";
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Verlof & Ziekte</h1>
        <p className="text-slate-600">
          Vraag verlof aan en volg de status. Managers kunnen aanvragen hier goed- of afkeuren.
        </p>
      </header>

      <section className="grid gap-3 rounded border bg-white p-4 shadow-sm text-sm text-slate-600 md:grid-cols-4">
        <div>
          <p className="font-semibold text-slate-800">{stats.pending}</p>
          <p>In afwachting</p>
        </div>
        <div>
          <p className="font-semibold text-slate-800">{stats.approved}</p>
          <p>Goedgekeurd</p>
        </div>
        <div>
          <p className="font-semibold text-slate-800">{stats.denied}</p>
          <p>Afgewezen</p>
        </div>
        <div>
          <p className="font-semibold text-slate-800">{stats.total}</p>
          <p>Totaal aanvragen</p>
        </div>
      </section>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <section className="space-y-4 rounded border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-medium">Nieuwe aanvraag</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <label className="text-sm text-slate-600">
            Startdatum
            <input
              className="mt-1 w-full rounded border p-2"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>
          <label className="text-sm text-slate-600">
            Einddatum
            <input
              className="mt-1 w-full rounded border p-2"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>
          <label className="text-sm text-slate-600">
            Type
            <select
              className="mt-1 w-full rounded border p-2"
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option value="vakantie">Vakantie</option>
              <option value="ziek">Ziek</option>
              <option value="adv">ADV</option>
              <option value="zorgverlof">Zorgverlof</option>
              <option value="overig">Overig</option>
            </select>
          </label>
          <label className="text-sm text-slate-600">
            Opmerking (optioneel)
            <input
              className="mt-1 w-full rounded border p-2"
              placeholder="Toelichting"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
        </div>
        <Button onClick={() => void createRequest()} disabled={loading}>
          Aanvragen
        </Button>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {(["pending", "approved", "denied", "all"] as StatusFilter[]).map((option) => (
            <Button
              key={option}
              variant={myFilter === option ? "secondary" : "ghost"}
              size="sm"
              className="rounded-full px-4"
              onClick={() => setMyFilter(option)}
            >
              {option === "pending"
                ? "In afwachting"
                : option === "approved"
                ? "Goedgekeurd"
                : option === "denied"
                ? "Afgewezen"
                : "Alles"}
            </Button>
          ))}
        </div>
        <div className="overflow-hidden rounded border bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Periode</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Kalender</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredMyRequests.map((request) => (
                <tr key={request.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-700">
                      {formatDate(request.startDate)} – {formatDate(request.endDate)}
                    </div>
                    <div className="text-xs text-slate-500">{requestDuration(request)}</div>
                  </td>
                  <td className="px-4 py-3 capitalize">{request.type}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(request.status)}`}>
                      {request.status === "pending"
                        ? "In afwachting"
                        : request.status === "approved"
                        ? "Goedgekeurd"
                        : "Afgewezen"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {request.calendarEventId ? (
                      <span className="text-brand-600">Gepland in agenda</span>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
              {!filteredMyRequests.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-5 text-center text-sm text-slate-500">
                    Geen verlofaanvragen gevonden.
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
              Beoordeel verlof aanvragen. Wanneer je ze goedkeurt, proberen we automatische agendaplanning uit te voeren.
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
                  <th className="px-4 py-3">Periode</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Kalender</th>
                  <th className="px-4 py-3">Actie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pendingRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-700">{request.user.email}</div>
                      <div className="text-xs uppercase text-slate-400">{request.user.role}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-700">
                        {formatDate(request.startDate)} – {formatDate(request.endDate)}
                      </div>
                      <div className="text-xs text-slate-500">{requestDuration(request)}</div>
                    </td>
                    <td className="px-4 py-3 capitalize">{request.type}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {request.calendarEventId ? (
                        <span className="text-brand-600">Gepland</span>
                      ) : (
                        <span className="text-slate-400">Nog niet ingepland</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-500"
                          onClick={() => void approveLeave(request.id, true)}
                        >
                          Goedkeuren
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => void approveLeave(request.id, false)}
                        >
                          Afkeuren
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!pendingRequests.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-5 text-center text-sm text-slate-500">
                      Geen aanvragen in afwachting.
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
