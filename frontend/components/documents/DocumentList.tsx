"use client";

import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { type Document } from "@/lib/api";
import { DOCUMENT_SOURCE_LABELS, DOCUMENT_TYPE_LABELS } from "./constants";

interface DocumentListProps {
  documents: Document[];
  loading?: boolean;
  page: number;
  total: number;
  pageSize: number;
  statusFilter: "ACTIVE" | "ARCHIVED" | "ALL";
  onStatusChange: (status: "ACTIVE" | "ARCHIVED" | "ALL") => void;
  onPageChange: (page: number) => void;
  onOpen: (document: Document) => void | Promise<void>;
  onArchive: (document: Document) => void | Promise<void>;
  onRestore: (document: Document) => void | Promise<void>;
  isManager: boolean;
}

export function DocumentList({
  documents,
  loading = false,
  page,
  total,
  pageSize,
  statusFilter,
  onStatusChange,
  onPageChange,
  onOpen,
  onArchive,
  onRestore,
  isManager,
}: DocumentListProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Documenten</h3>
        <div className="flex items-center gap-2 text-sm">
          <label className="text-slate-600">Status</label>
          <select
            className="rounded border px-3 py-2"
            value={statusFilter}
            onChange={(event) => onStatusChange(event.target.value as "ACTIVE" | "ARCHIVED" | "ALL")}
          >
            <option value="ACTIVE">Actief</option>
            <option value="ARCHIVED">Gearchiveerd</option>
            <option value="ALL">Alles</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Titel</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Bron</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Datum</th>
              <th className="px-4 py-3 text-right">Acties</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={6}>
                  Laden...
                </td>
              </tr>
            ) : documents.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={6}>
                  Geen documenten gevonden.
                </td>
              </tr>
            ) : (
              documents.map((document) => (
                <tr key={document.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{document.title}</td>
                  <td className="px-4 py-3 text-slate-700">{DOCUMENT_TYPE_LABELS[document.documentType]}</td>
                  <td className="px-4 py-3 text-slate-700">{DOCUMENT_SOURCE_LABELS[document.source]}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        document.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {document.status === "ACTIVE" ? "Actief" : "Gearchiveerd"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {format(new Date(document.createdAt), "dd-MM-yyyy HH:mm")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onOpen(document)}>
                        Openen
                      </Button>
                      {document.status === "ACTIVE" ? (
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={!isManager}
                          onClick={() => isManager && onArchive(document)}
                        >
                          Archiveer
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={!isManager}
                          onClick={() => isManager && onRestore(document)}
                        >
                          Herstel
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>
          Totaal {total} documenten • Pagina {page} van {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="subtle"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            Vorige
          </Button>
          <Button
            variant="subtle"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          >
            Volgende
          </Button>
        </div>
      </div>
    </div>
  );
}
