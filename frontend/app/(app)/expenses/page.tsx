"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/app/providers/AuthProvider";
import { api, type Expense, type ExpenseWithUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type StatusFilter = "pending" | "approved" | "rejected" | "all";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("nl-NL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount);

export default function ExpensesPage() {
  const { isManager } = useAuth();
  const [myExpenses, setMyExpenses] = useState<Expense[]>([]);
  const [pendingExpenses, setPendingExpenses] = useState<ExpenseWithUser[]>([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [lastUploadInfo, setLastUploadInfo] = useState<string | null>(null);
  const [myFilter, setMyFilter] = useState<StatusFilter>("pending");
  const [error, setError] = useState<string | null>(null);
  const [managerError, setManagerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadMine = useCallback(async () => {
    try {
      setError(null);
      const data = await api.expensesListMine();
      setMyExpenses(data);
    } catch (err: any) {
      setError(err.message ?? "Kon declaraties niet laden");
    }
  }, []);

  const loadPending = useCallback(async () => {
    if (!isManager) return;
    try {
      setManagerError(null);
      const data = await api.expensesListPending();
      setPendingExpenses(data);
    } catch (err: any) {
      setManagerError(err.message ?? "Kon declaraties niet laden");
    }
  }, [isManager]);

  useEffect(() => {
    void loadMine();
    void loadPending();
  }, [loadMine, loadPending]);

  const createExpense = async () => {
    if (!date || !amount.trim() || !category.trim()) {
      setError("Vul datum, categorie en bedrag in");
      return;
    }
    const parsed = Number.parseFloat(amount.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Bedrag moet een getal groter dan 0 zijn");
      return;
    }
    setLoading(true);
    try {
      await api.expensesCreate({
        date: new Date(date).toISOString(),
        amount: parsed,
        category: category.trim(),
        receiptUrl: receiptUrl.trim() || undefined,
      });
      setAmount("");
      setCategory("");
      setReceiptUrl("");
      setLastUploadInfo(null);
      await loadMine();
    } catch (err: any) {
      setError(err.message ?? "Kon declaratie niet opslaan");
    } finally {
      setLoading(false);
    }
  };

  const uploadReceiptStub = async (expenseId: string) => {
    try {
      const result = await api.expensesUploadReceipt(expenseId);
      setLastUploadInfo(
        `Stub geupload: ${result.receiptUrl} | Herkend bedrag: EUR ${result.recognizedAmount.toFixed(
          2,
        )} | OCR: ${result.ocrSummary}`,
      );
      await loadMine();
    } catch (err: any) {
      setError(err.message ?? "Kan bon niet uploaden");
    }
  };

  const approveExpense = async (expenseId: string, approve: boolean) => {
    try {
      await api.expensesApprove(expenseId, approve);
      await loadPending();
      await loadMine();
    } catch (err: any) {
      setManagerError(err.message ?? "Kon status niet bijwerken");
    }
  };

  const filteredExpenses = useMemo(() => {
    return myExpenses
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter((expense) => {
        if (myFilter === "all") return true;
        return expense.status === myFilter;
      });
  }, [myExpenses, myFilter]);

  const totals = useMemo(() => {
    const total = myExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const approved = myExpenses
      .filter((expense) => expense.status === "approved")
      .reduce((sum, expense) => sum + expense.amount, 0);
    const pending = myExpenses
      .filter((expense) => expense.status === "pending")
      .reduce((sum, expense) => sum + expense.amount, 0);
    return { total, approved, pending };
  }, [myExpenses]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Declaraties</h1>
        <p className="text-slate-600">
          Dien declaraties in met bonnen. Managers kunnen deze hier goed- of afkeuren.
        </p>
      </header>

      <section className="grid gap-3 rounded border bg-white p-4 shadow-sm text-sm text-slate-600 md:grid-cols-3">
        <div>
          <p className="font-semibold text-slate-800">{formatCurrency(totals.total)}</p>
          <p>Totaal gedeclareerd</p>
        </div>
        <div>
          <p className="font-semibold text-slate-800">{formatCurrency(totals.pending)}</p>
          <p>In afwachting</p>
        </div>
        <div>
          <p className="font-semibold text-slate-800">{formatCurrency(totals.approved)}</p>
          <p>Goedgekeurd</p>
        </div>
      </section>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <section className="space-y-4 rounded border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-medium">Nieuwe declaratie</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <label className="text-sm text-slate-600">
            Datum
            <input
              className="mt-1 w-full rounded border p-2"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          <label className="text-sm text-slate-600">
            Bedrag (EUR)
            <input
              className="mt-1 w-full rounded border p-2"
              placeholder="Bijv. 12,50"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
          <label className="text-sm text-slate-600">
            Categorie
            <input
              className="mt-1 w-full rounded border p-2"
              placeholder="Bijv. Reiskosten"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            />
          </label>
          <label className="text-sm text-slate-600">
            Bon-URL (optioneel)
            <input
              className="mt-1 w-full rounded border p-2"
              placeholder="https://..."
              value={receiptUrl}
              onChange={(event) => setReceiptUrl(event.target.value)}
            />
          </label>
        </div>
        <Button onClick={() => void createExpense()} disabled={loading}>
          Opslaan
        </Button>
      </section>

      {lastUploadInfo && (
        <div className="rounded border bg-emerald-50 p-3 text-sm text-emerald-700">{lastUploadInfo}</div>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {(["pending", "approved", "rejected", "all"] as StatusFilter[]).map((option) => (
            <Button
              key={option}
              variant={myFilter === option ? "secondary" : "ghost"}
              size="sm"
              className="rounded-full px-4"
              onClick={() => setMyFilter(option)}
            >
              {option === "pending"
                ? "In afwachting"
                : option === "approved"
                ? "Goedgekeurd"
                : option === "rejected"
                ? "Afgewezen"
                : "Alles"}
            </Button>
          ))}
        </div>
        <div className="overflow-hidden rounded border bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Datum</th>
                <th className="px-4 py-3">Categorie</th>
                <th className="px-4 py-3">Bedrag</th>
                <th className="px-4 py-3">Bon</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">{formatDate(expense.date)}</td>
                  <td className="px-4 py-3">{expense.category}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="px-4 py-3">
                    {expense.receiptUrl ? (
                      <a
                        href={expense.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-brand-600 hover:underline"
                      >
                        Open
                      </a>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => void uploadReceiptStub(expense.id)}>
                        Upload bon
                      </Button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        expense.status === "approved"
                          ? "success"
                          : expense.status === "rejected"
                          ? "danger"
                          : "warning"
                      }
                    >
                      {expense.status === "pending"
                        ? "In afwachting"
                        : expense.status === "approved"
                        ? "Goedgekeurd"
                        : "Afgewezen"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {expense.receiptUrl ? "" : "Geen bon"}
                  </td>
                </tr>
              ))}
              {!filteredExpenses.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-5 text-center text-sm text-slate-500">
                    Geen declaraties gevonden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isManager && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Goedkeuringen (manager)</h2>
            <p className="text-sm text-slate-600">Beoordeel declaraties en keur bonnen goed of af.</p>
          </div>
          {managerError && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {managerError}
            </div>
          )}
          <div className="overflow-hidden rounded border bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Medewerker</th>
                  <th className="px-4 py-3">Datum</th>
                  <th className="px-4 py-3">Categorie</th>
                  <th className="px-4 py-3">Bedrag</th>
                  <th className="px-4 py-3">Bon</th>
                  <th className="px-4 py-3">Actie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pendingExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-700">{expense.user.email}</div>
                      <div className="text-xs uppercase text-slate-400">{expense.user.role}</div>
                    </td>
                    <td className="px-4 py-3">{formatDate(expense.date)}</td>
                    <td className="px-4 py-3">{expense.category}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-4 py-3">
                      {expense.receiptUrl ? (
                        <a
                          href={expense.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-brand-600 hover:underline"
                        >
                          Bekijk bon
                        </a>
                      ) : (
                        <span className="text-sm text-slate-400">Geen bon</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => void approveExpense(expense.id, true)}
                        >
                          Goedkeuren
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => void approveExpense(expense.id, false)}
                        >
                          Afkeuren
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!pendingExpenses.length && (
                  <tr>
                    <td colSpan={6} className="px-4 py-5 text-center text-sm text-slate-500">
                      Geen declaraties in afwachting.
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
