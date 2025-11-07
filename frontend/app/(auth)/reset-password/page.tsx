"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { api } from "@/lib/api";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) {
      setError("Reset-token ontbreekt. Controleer de link in je e-mail.");
      return;
    }

    if (password.trim().length < 8) {
      setError("Kies een wachtwoord van minimaal 8 tekens.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Wachtwoorden komen niet overeen.");
      return;
    }

    setLoading(true);
    try {
      await api.passwordResetConfirm(token, password);
      setSuccess("Je wachtwoord is bijgewerkt. Je wordt doorgestuurd naar de login.");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message ?? "Kon het wachtwoord niet bijwerken.");
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !token;

  return (
    <div className="min-h-screen grid place-items-center bg-surface">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 p-6 border rounded-md bg-white shadow-sm"
      >
        <h1 className="text-xl font-semibold">Nieuw wachtwoord instellen</h1>
        {!token && (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Geen geldig reset-token gevonden. Gebruik de link uit je e-mail of vraag een
            nieuwe reset aan.
          </div>
        )}
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="password">
            Nieuw wachtwoord
          </label>
          <input
            id="password"
            type="password"
            className="w-full border rounded p-2"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="confirmPassword">
            Herhaal wachtwoord
          </label>
          <input
            id="confirmPassword"
            type="password"
            className="w-full border rounded p-2"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={8}
            required
          />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        {success && <div className="text-sm text-green-600">{success}</div>}
        <button
          type="submit"
          className="w-full bg-brand-600 text-white py-2 rounded hover:bg-brand-500 disabled:opacity-60"
          disabled={disabled}
        >
          {loading ? "Bezig..." : "Wachtwoord opslaan"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen grid place-items-center bg-surface">
          <div className="w-full max-w-sm space-y-4 p-6 text-center text-sm text-slate-500">
            Bezig met laden…
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
