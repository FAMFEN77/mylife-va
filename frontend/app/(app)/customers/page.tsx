"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/app/providers/AuthProvider";
import { api, type Customer, type CustomerImportResult } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CustomerTable } from "@/components/customers/CustomerTable";
import { CsvImportDialog } from "@/components/customers/CsvImportDialog";

type Filters = {
  q?: string;
  city?: string;
  archived?: "only" | "exclude" | "include";
  page?: number;
};

const DEFAULT_PAGE_SIZE = 25;

function parseFilters(search: URLSearchParams): Filters {
  const filters: Filters = {};
  const q = search.get("q");
  if (q) filters.q = q;
  const city = search.get("city");
  if (city) filters.city = city;
  const archived = search.get("archived");
  if (archived === "only" || archived === "include" || archived === "exclude") {
    filters.archived = archived;
  }
  const pageValue = Number(search.get("page") ?? "1");
  if (!Number.isNaN(pageValue) && pageValue > 0) {
    filters.page = pageValue;
  }
  return filters;
}

export default function CustomersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { authenticatedUser, isManager } = useAuth();
  const [filters, setFilters] = useState<Filters>(() => parseFilters(searchParams));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ items: Customer[]; total: number; page: number; pageSize: number }>({
    items: [],
    total: 0,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  useEffect(() => {
    setFilters(parseFilters(searchParams));
  }, [searchParams]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    api
      .customersList({
        q: filters.q,
        city: filters.city,
        archived: filters.archived,
        page: filters.page,
        pageSize: DEFAULT_PAGE_SIZE,
      })
      .then((response) => {
        if (!mounted) return;
        setData(response);
      })
      .catch((err: any) => {
        if (!mounted) return;
        setError(err.message ?? "Kon klanten niet laden.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [filters]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data.total ?? 0) / (data.pageSize ?? DEFAULT_PAGE_SIZE))),
    [data.total, data.pageSize],
  );

  const updateQuery = (next: Filters) => {
    const search = new URLSearchParams();
    if (next.q) search.set("q", next.q);
    if (next.city) search.set("city", next.city);
    if (next.archived) search.set("archived", next.archived);
    if (next.page && next.page > 1) search.set("page", next.page.toString());
    router.replace(`${pathname}?${search.toString()}`, { scroll: false });
  };

  const handleArchive = async (customer: Customer) => {
    if (!confirm("Weet je zeker dat je deze klant wilt archiveren?")) return;
    try {
      await api.customersArchive(customer.id);
      setFilters((prev) => ({ ...prev }));
    } catch (err: any) {
      alert(err.message ?? "Archiveren mislukt.");
    }
  };

  const handleRestore = async (customer: Customer) => {
    try {
      await api.customersRestore(customer.id);
      setFilters((prev) => ({ ...prev }));
    } catch (err: any) {
      alert(err.message ?? "Herstellen mislukt.");
    }
  };

  const handleImport = (result: CustomerImportResult) => {
    setFilters((prev) => ({ ...prev }));
    alert(`Import voltooid. Aangemaakt: ${result.created}, bijgewerkt: ${result.updated}`);
  };

  const handleSubmitFilters = (formData: FormData) => {
    const next: Filters = {
      q: (formData.get("q") as string)?.trim() || undefined,
      city: (formData.get("city") as string)?.trim() || undefined,
      archived: (formData.get("archived") as Filters["archived"]) || "exclude",
      page: 1,
    };
    updateQuery(next);
  };

  const goToPage = (page: number) => {
    updateQuery({ ...filters, page });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Klanten</h1>
          <p className="text-slate-600">Beheer contactpersonen en klantgegevens.</p>
        </div>
        <div className="flex gap-2">
          <CsvImportDialog onImported={handleImport} />
          <Button asChild>
            <Link href="/customers/new">Nieuwe klant</Link>
          </Button>
        </div>
      </header>

      <section className="rounded border bg-white p-4 shadow-sm">
        <form
          className="grid gap-4 md:grid-cols-[1fr_1fr_150px_auto]"
          action={async (formData) => handleSubmitFilters(formData)}
        >
          <div>
            <label className="block text-sm font-medium text-slate-700">Zoeken</label>
            <input
              name="q"
              defaultValue={filters.q ?? ""}
              placeholder="Zoek op naam, bedrijf, e-mail of telefoon"
              className="mt-1 w-full rounded border p-2"
              type="search"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Plaats</label>
            <input
              name="city"
              defaultValue={filters.city ?? ""}
              placeholder="Bijv. Zwolle"
              className="mt-1 w-full rounded border p-2"
              type="text"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Status</label>
            <select
              name="archived"
              defaultValue={filters.archived ?? "exclude"}
              className="mt-1 w-full rounded border p-2 text-sm"
            >
              <option value="exclude">Alleen actieve</option>
              <option value="include">Inclusief gearchiveerd</option>
              <option value="only">Alleen gearchiveerd</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit" className="w-full">
              Toepassen
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                updateQuery({});
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      </section>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <CustomerTable
        items={data.items}
        loading={loading}
        isManager={(authenticatedUser?.role ?? "MEDEWERKER") === "MANAGER"}
        onArchive={handleArchive}
        onRestore={handleRestore}
      />

      <footer className="flex items-center justify-between text-sm text-slate-600">
        <div>
          Totaal {data.total} klanten • Pagina {data.page} van {totalPages}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={data.page <= 1}
            onClick={() => goToPage(Math.max(1, (data.page ?? 1) - 1))}
          >
            Vorige
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={data.page >= totalPages}
            onClick={() => goToPage(Math.min(totalPages, (data.page ?? 1) + 1))}
          >
            Volgende
          </Button>
        </div>
      </footer>
    </div>
  );
}

