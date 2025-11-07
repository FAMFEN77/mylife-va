"use client";

import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/app/providers/AuthProvider";
import { api, type Invoice, type InvoiceWithUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Status = Invoice["status"];
type StatusFilter = Status | "all";

const STATUS_LABEL: Record<Status, string> = {
  draft: "Concept",
  sent: "Verzonden",
  paid: "Betaald",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(value);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("nl-NL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

export default function InvoicesPage() {
  const { isManager } = useAuth();
  const [myInvoices, setMyInvoices] = useState<Invoice[]>([]);
  const [allInvoices, setAllInvoices] = useState<InvoiceWithUser[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("all");

  const [customer, setCustomer] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [totalEx, setTotalEx] = useState("");
  const [totalInc, setTotalInc] = useState("");

  const [sendTarget, setSendTarget] = useState<string | null>(null);
  const [sendEmail, setSendEmail] = useState("");
  const [sendSubject, setSendSubject] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [managerError, setManagerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadMine = async () => {
    try {
      setError(null);
      const data = await api.invoicesListMine();
      setMyInvoices(data);
    } catch (err: any) {
      setError(err.message ?? "Kon facturen niet laden.");
    }
  };

  const loadAll = async () => {
    if (!isManager) return;
    try {
      setManagerError(null);
      const data = await api.invoicesListAll();
      setAllInvoices(data);
    } catch (err: any) {
      setManagerError(err.message ?? "Kon facturen niet laden.");
    }
  };

  useEffect(() => {
    void loadMine();
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isManager]);

  const createInvoice = async () => {
    if (!customer.trim()) {
      setError("Vul een klantnaam in.");
      return;
    }
    if (!date) {
      setError("Kies een factuurdatum.");
      return;
    }
    const ex = Number.parseFloat(totalEx.replace(",", "."));
    const inc = Number.parseFloat(totalInc.replace(",", "."));
    if (!Number.isFinite(ex) || ex <= 0 || !Number.isFinite(inc) || inc <= 0) {
      setError("Voer bedragen in voor excl. en incl. btw.");
      return;
    }

    setLoading(true);
    try {
      await api.invoicesCreate({
        customer: customer.trim(),
        date: new Date(date).toISOString(),
        totalEx: ex,
        totalInc: inc,
      });
      setCustomer("");
      setTotalEx("");
      setTotalInc("");
      await loadMine();
      await loadAll();
    } catch (err: any) {
      setError(err.message ?? "Kon factuur niet aanmaken.");
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (id: string, status: Status) => {
    try {
      await api.invoicesUpdateStatus(id, status);
      await loadMine();
      await loadAll();
    } catch (err: any) {
      setManagerError(err.message ?? "Kon status niet bijwerken.");
    }
  };

  const generatePdf = async (id: string) => {
    try {
      await api.invoicesGeneratePdf(id);
      await loadMine();
      await loadAll();
    } catch (err: any) {
      setManagerError(err.message ?? "Kon PDF niet genereren.");
    }
  };

  const sendInvoice = async (id: string) => {
    if (!sendEmail.trim()) {
      setSendError("Vul een e-mailadres in.");
      return;
    }
    setSendError(null);
    try {
      await api.invoicesSend(id, {
        recipientEmail: sendEmail.trim(),
        subject: sendSubject.trim() || undefined,
      });
      setSendTarget(null);
      setSendEmail("");
      setSendSubject("");
      await loadMine();
      await loadAll();
    } catch (err: any) {
      setSendError(err.message ?? "Kon factuur niet versturen.");
    }
  };

  const filteredMine = useMemo(() => {
    return myInvoices
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter((invoice) => (filter === "all" ? true : invoice.status === filter));
  }, [myInvoices, filter]);

  const totals = useMemo(() => {
    const total = myInvoices.reduce((sum, invoice) => sum + invoice.totalInc, 0);
    const paid = myInvoices.filter((invoice) => invoice.status === "paid").reduce((sum, invoice) => sum + invoice.totalInc, 0);
    const outstanding = total - paid;
    return { total, paid, outstanding };
  }, [myInvoices]);

  return (
    <div className="space-y-6">
      <header className="rounded border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Facturen</h1>
            <p className="mt-1 text-sm text-slate-600">
              Maak facturen aan, volg de status en verstuur ze direct via Gmail. Managers hebben daarnaast zicht op het hele team.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-3">
            <StatCard label="Totaal incl. btw" value={formatCurrency(totals.total)} />
            <StatCard label="Betaald" value={formatCurrency(totals.paid)} />
            <StatCard label="Openstaand" value={formatCurrency(totals.outstanding)} />
          </div>
        </div>
      </header>

      <section className="space-y-4 rounded border bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-lg font-medium">Nieuwe factuur</h2>
          <p className="text-sm text-slate-600">Vul klantgegevens en bedragen in. De factuur verschijnt direct in het overzicht.</p>
        </div>
        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm text-slate-600">
            Klantnaam
            <input
              className="mt-1 w-full rounded border p-2"
              placeholder="Bijv. Zorgcentrum Noord"
              value={customer}
              onChange={(event) => setCustomer(event.target.value)}
            />
          </label>
          <label className="text-sm text-slate-600">
            Factuurdatum
            <input
              className="mt-1 w-full rounded border p-2"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          <label className="text-sm text-slate-600">
            Totaal excl. btw
            <input
              className="mt-1 w-full rounded border p-2"
              placeholder="Bijv. 1000"
              value={totalEx}
              onChange={(event) => setTotalEx(event.target.value)}
            />
          </label>
          <label className="text-sm text-slate-600">
            Totaal incl. btw
            <input
              className="mt-1 w-full rounded border p-2"
              placeholder="Bijv. 1210"
              value={totalInc}
              onChange={(event) => setTotalInc(event.target.value)}
            />
          </label>
        </div>
        <Button onClick={() => void createInvoice()} disabled={loading}>
          Opslaan
        </Button>
      </section>

      <section className="space-y-3 rounded border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "draft", "sent", "paid"] as StatusFilter[]).map((option) => (
            <Button
              key={option}
              variant={filter === option ? "secondary" : "ghost"}
              size="sm"
              className="rounded-full px-4"
              onClick={() => setFilter(option)}
            >
              {option === "all" ? "Alle statussen" : STATUS_LABEL[option as Status]}
            </Button>
          ))}
        </div>
        <div className="overflow-hidden rounded border bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Datum</th>
                <th className="px-4 py-3">Klant</th>
                <th className="px-4 py-3">Bedragen</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Rapport</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredMine.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">{formatDate(invoice.date)}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{invoice.customer}</td>
                  <td className="px-4 py-3 text-slate-500">
                    <div>Excl.: {formatCurrency(invoice.totalEx)}</div>
                    <div>Incl.: {formatCurrency(invoice.totalInc)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={badgeVariant(invoice.status)}>{STATUS_LABEL[invoice.status]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {invoice.pdfUrl ? (
                      <a
                        href={invoice.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-brand-600 hover:underline"
                      >
                        Bekijk
                      </a>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="px-0 text-sm text-brand-600 hover:text-brand-700"
                        onClick={() => void generatePdf(invoice.id)}
                      >
                        Genereren
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {!filteredMine.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-5 text-center text-sm text-slate-500">
                    Geen facturen gevonden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isManager && (
        <section className="space-y-4 rounded border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Beheer (manager)</h2>
            <span className="text-xs text-slate-500">{allInvoices.length} facturen in totaal</span>
          </div>
          {managerError && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {managerError}
            </div>
          )}
          <div className="overflow-x-auto rounded border bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Datum</th>
                  <th className="px-4 py-3">Klant</th>
                  <th className="px-4 py-3">Bedrag incl.</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Medewerker</th>
                  <th className="px-4 py-3">PDF</th>
                  <th className="px-4 py-3">Verzenden</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {allInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{formatDate(invoice.date)}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">{invoice.customer}</td>
                    <td className="px-4 py-3">{formatCurrency(invoice.totalInc)}</td>
                    <td className="px-4 py-3">
                      <select
                        className="rounded border p-2 text-sm"
                        value={invoice.status}
                        onChange={(event) => changeStatus(invoice.id, event.target.value as Status)}
                      >
                        {(["draft", "sent", "paid"] as Status[]).map((statusOption) => (
                          <option key={statusOption} value={statusOption}>
                            {STATUS_LABEL[statusOption]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{invoice.user.email}</td>
                    <td className="px-4 py-3">
                      {invoice.pdfUrl ? (
                        <a
                          href={invoice.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-brand-600 hover:underline"
                        >
                          Bekijk
                        </a>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="px-0 text-sm text-brand-600 hover:text-brand-700"
                          onClick={() => void generatePdf(invoice.id)}
                        >
                          Genereren
                        </Button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {sendTarget === invoice.id ? (
                        <div className="space-y-2">
                          {sendError && (
                            <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                              {sendError}
                            </div>
                          )}
                          <input
                            className="w-full rounded border p-2 text-sm"
                            placeholder="E-mailadres klant"
                            value={sendEmail}
                            onChange={(event) => setSendEmail(event.target.value)}
                          />
                          <input
                            className="w-full rounded border p-2 text-sm"
                            placeholder="Onderwerp (optioneel)"
                            value={sendSubject}
                            onChange={(event) => setSendSubject(event.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => void sendInvoice(invoice.id)}>
                              Versturen
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="px-0 text-xs text-slate-500 hover:text-slate-700"
                              onClick={() => {
                                setSendTarget(null);
                                setSendEmail("");
                                setSendSubject("");
                                setSendError(null);
                              }}
                            >
                              Annuleren
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="px-0 text-sm text-brand-600 hover:text-brand-700"
                          onClick={() => {
                            setSendTarget(invoice.id);
                            setSendEmail("");
                            setSendSubject("");
                            setSendError(null);
                          }}
                        >
                          Verstuur
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {!allInvoices.length && (
                  <tr>
                    <td colSpan={7} className="px-4 py-5 text-center text-sm text-slate-500">
                      Geen facturen gevonden.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function badgeVariant(status: Status): "neutral" | "info" | "warning" | "success" {
  switch (status) {
    case "draft":
      return "neutral";
    case "sent":
      return "info";
    case "paid":
      return "success";
    default:
      return "neutral";
  }
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border bg-white px-4 py-3 shadow-sm">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}
