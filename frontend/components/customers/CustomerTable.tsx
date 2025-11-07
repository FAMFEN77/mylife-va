"use client";

import { Customer } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export interface CustomerTableProps {
  items: Customer[];
  isManager: boolean;
  onArchive: (customer: Customer) => Promise<void> | void;
  onRestore: (customer: Customer) => Promise<void> | void;
  loading?: boolean;
}

export function CustomerTable({ items, isManager, onArchive, onRestore, loading = false }: CustomerTableProps) {
  if (loading) {
    return <p className="text-sm text-slate-500">Laden...</p>;
  }

  if (!items.length) {
    return <p className="text-sm text-slate-500">Nog geen klanten gevonden.</p>;
  }

  return (
    <div className="overflow-x-auto rounded border bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
          <tr>
            <th className="px-4 py-3">Naam</th>
            <th className="px-4 py-3">Bedrijf</th>
            <th className="px-4 py-3">E-mail</th>
            <th className="px-4 py-3">Telefoon</th>
            <th className="px-4 py-3">Plaats</th>
            <th className="px-4 py-3">Aangemaakt op</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Acties</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {items.map((customer) => {
            const name = `${customer.firstName} ${customer.lastName}`.trim();
            const status = customer.archivedAt ? "Gearchiveerd" : "Actief";
            return (
              <tr key={customer.id}>
                <td className="px-4 py-3 font-medium text-slate-800">{name}</td>
                <td className="px-4 py-3 text-slate-700">{customer.companyName ?? "—"}</td>
                <td className="px-4 py-3 text-slate-700">{customer.email}</td>
                <td className="px-4 py-3 text-slate-700">{customer.phone ?? "—"}</td>
                <td className="px-4 py-3 text-slate-700">{customer.city ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">
                  {format(new Date(customer.createdAt), "dd-MM-yyyy HH:mm")}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      customer.archivedAt
                        ? "bg-orange-100 text-orange-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/customers/${customer.id}`}>Bekijken</a>
                    </Button>
                    {customer.archivedAt ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!isManager}
                        onClick={() => {
                          if (isManager) void onRestore(customer);
                        }}
                      >
                        Herstellen
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={!isManager}
                        onClick={() => {
                          if (isManager) void onArchive(customer);
                        }}
                      >
                        Archiveren
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

