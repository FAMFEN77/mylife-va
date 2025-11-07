"use client";

import { useState } from "react";
import Link from "next/link";

import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await api.passwordResetRequest(email.trim());
      setSuccess(
        "Als dit e-mailadres bij ons bekend is, ontvang je binnen enkele minuten een reset-link."
      );
      setEmail("");
    } catch (err: any) {
      setError(err.message ?? "Kon wachtwoordreset niet starten.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-surface">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 p-6 border rounded-md bg-white shadow-sm"
      >
        <h1 className="text-xl font-semibold">Wachtwoord vergeten</h1>
        <p className="text-sm text-slate-600">
          Vul je e-mailadres in. We sturen je een link om een nieuw wachtwoord
          in te stellen.
        </p>
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="email">
            E-mailadres
          </label>
          <input
            id="email"
            type="email"
            className="w-full border rounded p-2"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        {success && <div className="text-sm text-green-600">{success}</div>}
        <button
          type="submit"
          className="w-full bg-brand-600 text-white py-2 rounded hover:bg-brand-500 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Bezig..." : "Verstuur reset-link"}
        </button>
        <p className="text-sm text-center">
          <Link className="text-brand-600 hover:underline" href="/login">
            Terug naar inloggen
          </Link>
        </p>
      </form>
    </div>
  );
}
