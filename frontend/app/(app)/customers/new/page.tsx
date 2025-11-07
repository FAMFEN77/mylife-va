"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { CustomerForm, type CustomerFormValues } from "@/components/customers/CustomerForm";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function NewCustomerPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: CustomerFormValues) => {
    setSubmitting(true);
    setError(null);
    try {
      await api.customersCreate(values);
      router.push("/customers");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opslaan mislukt.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Nieuwe klant</h1>
          <p className="text-sm text-slate-600">Voeg een nieuwe relatie toe aan je organisatie.</p>
        </div>
        <Button variant="secondary" onClick={() => router.push("/customers")}>
          Terug naar overzicht
        </Button>
      </header>

      <section className="rounded border bg-white p-6 shadow-sm">
        {error && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <CustomerForm submitLabel="Klant aanmaken" isSubmitting={submitting} onSubmit={handleSubmit} />
      </section>
    </div>
  );
}
