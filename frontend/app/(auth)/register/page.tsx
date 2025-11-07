"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.register(email, password);
      window.location.href = "/login";
    } catch (err: any) {
      setError(err.message ?? "Registratie mislukt");
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
        <h1 className="text-xl font-semibold">Registreren</h1>
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="email">
            E-mailadres
          </label>
          <input
            id="email"
            type="email"
            className="w-full border rounded p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="password">
            Wachtwoord
          </label>
          <input
            id="password"
            type="password"
            className="w-full border rounded p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button
          type="submit"
          className="w-full bg-brand-600 text-white py-2 rounded hover:bg-brand-500 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Bezig…" : "Registreren"}
        </button>
        <p className="text-sm text-center">
          Al een account?{" "}
          <a className="text-brand-600 hover:underline" href="/login">
            Inloggen
          </a>
        </p>
      </form>
    </div>
  );
}
