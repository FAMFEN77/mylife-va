"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { api, type GoogleStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/brand";

function formatDate(iso?: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
}

export default function SettingsPage() {
  const [status, setStatus] = useState<GoogleStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const params = useSearchParams();

  const successNotice = useMemo(() => {
    const marker = params?.get("google");
    if (marker === "connected") {
      return "Google-account verbonden.";
    }
    if (marker === "error") {
      return "Google-koppeling is mislukt. Probeer het opnieuw.";
    }
    return null;
  }, [params]);

  useEffect(() => {
    let active = true;
    const fetchStatus = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await api.googleStatus();
        if (active) {
          setStatus(result);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void fetchStatus();
    return () => {
      active = false;
    };
  }, []);

  const startConnect = async () => {
    if (typeof window === "undefined") return;
    setConnecting(true);
    setError(null);

    try {
      const returnTo = `${window.location.origin}/settings?google=connected`;
      const { url } = await api.googleAuth(returnTo);
      if (!url) {
        throw new Error("Backend gaf geen auth-URL terug.");
      }
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Instellingen</h1>
        <p className="text-sm text-slate-600">Koppel externe diensten aan je {APP_NAME}-assistent.</p>
      </div>

      {successNotice && (
        <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {successNotice}
        </div>
      )}

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded border bg-white p-4 shadow-sm">
        <header className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Google integratie</h2>
            <p className="text-sm text-slate-500">
              Verstuur e-mails en maak agenda-afspraken rechtstreeks vanuit de assistent.
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              status?.connected ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-700"
            }`}
          >
            {status?.connected ? "Verbonden" : "Niet verbonden"}
          </span>
        </header>

        <div className="space-y-3 text-sm text-slate-600">
          <p>
            {loading
              ? "Status controleren..."
              : status?.connected
              ? "Je Google-account is gekoppeld. Nieuwe AI-acties kunnen nu mail sturen en afspraken aanmaken."
              : "Koppel je Google-account om automatische e-mails en agenda-verzoeken via de assistent mogelijk te maken."}
          </p>
          {status?.expiresAt && (
            <p>
              Token verloopt rond: <span className="font-medium">{formatDate(status.expiresAt)}</span>
            </p>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Button onClick={startConnect} disabled={connecting}>
            {status?.connected ? "Opnieuw verbinden" : "Verbind met Google"}
          </Button>
        </div>
      </section>
    </div>
  );
}
