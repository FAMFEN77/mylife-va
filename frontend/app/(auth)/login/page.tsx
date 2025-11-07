"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/app/providers/AuthProvider";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setToken, setAuthenticatedUser } = useAuth();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(email, password);

      // Bewaar tokens direct zodat andere tabs of instanties ze kunnen lezen.
      localStorage.setItem("accessToken", res.accessToken);
      if (res.refreshToken) {
        localStorage.setItem("refreshToken", res.refreshToken);
      }

      setToken(res.accessToken);
      setAuthenticatedUser(res.user);
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message ?? "Login mislukt");
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
        <h1 className="text-xl font-semibold">Inloggen</h1>
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
            required
          />
        </div>
        <p className="text-right text-sm">
          <a className="text-brand-600 hover:underline" href="/forgot-password">
            Wachtwoord vergeten?
          </a>
        </p>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button
          type="submit"
          className="w-full bg-brand-600 text-white py-2 rounded hover:bg-brand-500 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Bezig…" : "Inloggen"}
        </button>
        <p className="text-sm text-center">
          Nog geen account?{" "}
          <a className="text-brand-600 hover:underline" href="/register">
            Registreren
          </a>
        </p>
      </form>
    </div>
  );
}
