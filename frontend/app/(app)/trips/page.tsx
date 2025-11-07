"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/app/providers/AuthProvider";
import { api, type Trip, type TripWithUser } from "@/lib/api";
import { Button } from "@/components/ui/button";

type TripFilter = "pending" | "approved" | "all";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("nl-NL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

export default function TripsPage() {
  const { isManager, authenticatedUser } = useAuth();
  const [myTrips, setMyTrips] = useState<Trip[]>([]);
  const [pendingTrips, setPendingTrips] = useState<TripWithUser[]>([]);
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [distance, setDistance] = useState("");
  const [myFilter, setMyFilter] = useState<TripFilter>("pending");
  const [error, setError] = useState<string | null>(null);
  const [managerError, setManagerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadMine = useCallback(async () => {
    try {
      setError(null);
      const data = await api.tripsListMine();
      setMyTrips(data);
    } catch (err: any) {
      setError(err.message ?? "Kon ritten niet laden");
    }
  }, []);

  const loadPending = useCallback(async () => {
    if (!isManager) return;
    try {
      setManagerError(null);
      const data = await api.tripsListPending();
      setPendingTrips(data);
    } catch (err: any) {
      setManagerError(err.message ?? "Kon ritten niet laden");
    }
  }, [isManager]);

  useEffect(() => {
    void loadMine();
    void loadPending();
  }, [loadMine, loadPending]);

  const createTrip = async () => {
    if (!date || !from.trim() || !to.trim() || !distance.trim()) {
      setError("Vul datum, locaties en afstand in");
      return;
    }
    const km = Number.parseFloat(distance.replace(",", "."));
    if (!Number.isFinite(km) || km <= 0) {
      setError("Afstand moet een getal groter dan 0 zijn");
      return;
    }
    setLoading(true);
    try {
      await api.tripsCreate({
        date: new Date(date).toISOString(),
        from: from.trim(),
        to: to.trim(),
        distanceKm: km,
      });
      setFrom("");
      setTo("");
      setDistance("");
      await loadMine();
    } catch (err: any) {
      setError(err.message ?? "Kon rit niet opslaan");
    } finally {
      setLoading(false);
    }
  };

  const approveTrip = async (id: string, approve: boolean) => {
    try {
      await api.tripsApprove(id, approve);
      await loadPending();
      await loadMine();
    } catch (err: any) {
      setManagerError(err.message ?? "Kon status niet bijwerken");
    }
  };

  const filteredTrips = useMemo(() => {
    return myTrips
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter((trip) => {
        if (myFilter === "all") return true;
        return myFilter === "approved" ? trip.approved : !trip.approved;
      });
  }, [myTrips, myFilter]);

  const totals = useMemo(() => {
    const total = myTrips.reduce((sum, trip) => sum + trip.distanceKm, 0);
    const approved = myTrips
      .filter((trip) => trip.approved)
      .reduce((sum, trip) => sum + trip.distanceKm, 0);
    const pending = total - approved;
    return { total, approved, pending };
  }, [myTrips]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Ritregistratie</h1>
        <p className="text-slate-600">
          Houd gereden kilometers bij voor declaraties en rapportages. Managers keuren ritten goed.
        </p>
      </header>

      <section className="grid gap-3 rounded border bg-white p-4 shadow-sm text-sm text-slate-600 md:grid-cols-3">
        <div>
          <p className="font-semibold text-slate-800">{totals.total.toFixed(1)} km</p>
          <p>Totaal geregistreerd</p>
        </div>
        <div>
          <p className="font-semibold text-slate-800">{totals.pending.toFixed(1)} km</p>
          <p>In afwachting</p>
        </div>
        <div>
          <p className="font-semibold text-slate-800">{totals.approved.toFixed(1)} km</p>
          <p>Goedgekeurd</p>
        </div>
      </section>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <section className="space-y-4 rounded border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-medium">Rit toevoegen</h2>
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
            Van
            <input
              className="mt-1 w-full rounded border p-2"
              placeholder="Vertreklocatie"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
          </label>
          <label className="text-sm text-slate-600">
            Naar
            <input
              className="mt-1 w-full rounded border p-2"
              placeholder="Bestemming"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </label>
          <label className="text-sm text-slate-600">
            Afstand (km)
            <input
              className="mt-1 w-full rounded border p-2"
              placeholder="Bijv. 12.5"
              value={distance}
              onChange={(event) => setDistance(event.target.value)}
            />
          </label>
        </div>
        <Button onClick={() => void createTrip()} disabled={loading}>
          Rit opslaan
        </Button>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {(["pending", "approved", "all"] as TripFilter[]).map((option) => (
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
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Afstand</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTrips.map((trip) => (
                <tr key={trip.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">{formatDate(trip.date)}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-700">{trip.from}</div>
                    <div className="text-xs text-slate-500">→ {trip.to}</div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">{trip.distanceKm.toFixed(2)} km</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        trip.approved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {trip.approved ? "Goedgekeurd" : "In afwachting"}
                    </span>
                  </td>
                </tr>
              ))}
              {!filteredTrips.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-5 text-center text-sm text-slate-500">
                    Geen ritten gevonden.
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
            <p className="text-sm text-slate-600">Beoordeel ritten die nog in afwachting zijn.</p>
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
                  <th className="px-4 py-3">Route</th>
                  <th className="px-4 py-3">Afstand</th>
                  <th className="px-4 py-3">Actie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pendingTrips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-700">{trip.user.email}</div>
                      <div className="text-xs uppercase text-slate-400">{trip.user.role}</div>
                    </td>
                    <td className="px-4 py-3">{formatDate(trip.date)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-700">{trip.from}</div>
                      <div className="text-xs text-slate-500">→ {trip.to}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">{trip.distanceKm.toFixed(2)} km</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => void approveTrip(trip.id, true)}
                        >
                          Goedkeuren
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => void approveTrip(trip.id, false)}
                        >
                          Afkeuren
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!pendingTrips.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-5 text-center text-sm text-slate-500">
                      Geen ritten in afwachting.
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
