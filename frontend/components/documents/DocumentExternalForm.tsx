"use client";

import { useState } from "react";

import { api, type DocumentType } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { DOCUMENT_TYPE_OPTIONS } from "./constants";

interface DocumentExternalFormProps {
  customerId: string;
  onCreated?: () => void;
}

export function DocumentExternalForm({ customerId, onCreated }: DocumentExternalFormProps) {
  const [title, setTitle] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType | "">("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !fileUrl.trim()) {
      setError("Titel en URL zijn verplicht.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.documentsExternal(customerId, {
        title: title.trim(),
        fileUrl: fileUrl.trim(),
        documentType: (documentType || undefined) as DocumentType | undefined,
      });
      setTitle("");
      setFileUrl("");
      setDocumentType("");
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opslaan is mislukt.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-3 rounded border bg-white p-4 shadow-sm" onSubmit={handleSubmit}>
      <h3 className="text-sm font-semibold text-slate-700">Extern document</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-600">Titel</label>
          <input
            type="text"
            className="mt-1 w-full rounded border p-2 text-sm"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Bijv. Inspectierapport"
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-600">Type</label>
          <select
            className="mt-1 w-full rounded border p-2 text-sm"
            value={documentType}
            onChange={(event) => setDocumentType(event.target.value as DocumentType | "")}
          >
            <option value="">Selecteer type</option>
            {DOCUMENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-600">URL</label>
          <input
            type="url"
            className="mt-1 w-full rounded border p-2 text-sm"
            value={fileUrl}
            onChange={(event) => setFileUrl(event.target.value)}
            placeholder="https://example.com/document.pdf"
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Button type="submit" variant="secondary" disabled={submitting}>
        {submitting ? "Opslaan..." : "Opslaan"}
      </Button>
    </form>
  );
}
