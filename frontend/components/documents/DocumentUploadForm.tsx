"use client";

import { useRef, useState } from "react";

import { api, type DocumentType } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { DOCUMENT_TYPE_OPTIONS } from "./constants";

interface DocumentUploadFormProps {
  customerId: string;
  onUploaded?: () => void;
}

export function DocumentUploadForm({ customerId, onUploaded }: DocumentUploadFormProps) {
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setError("Kies een PDF-bestand om te uploaden.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await api.documentsUpload(customerId, {
        file,
        title: title.trim() || undefined,
        documentType: (documentType || undefined) as DocumentType | undefined,
      });
      setTitle("");
      setDocumentType("");
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onUploaded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Uploaden is mislukt.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-3 rounded border bg-white p-4 shadow-sm" onSubmit={handleSubmit}>
      <h3 className="text-sm font-semibold text-slate-700">Upload document</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-600">Bestand</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="mt-1 w-full rounded border p-2 text-sm"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setError(null);
            }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-600">Titel</label>
          <input
            type="text"
            className="mt-1 w-full rounded border p-2 text-sm"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Bijv. Contract 2025"
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
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Uploaden..." : "Uploaden"}
      </Button>
    </form>
  );
}
