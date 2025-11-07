"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, type Board } from "@/lib/api";
import { useAuth } from "@/app/providers/AuthProvider";
import { usePlan } from "@/lib/hooks/usePlan";

export default function BoardsPage() {
  const { authenticatedUser } = useAuth();
  const plan = usePlan();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newBoardName, setNewBoardName] = useState("");
  const organisationId = authenticatedUser?.organisationId ?? null;

  const loadBoards = async () => {
    if (!organisationId) {
      setBoards([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await api.boardsList({ orgId: organisationId });
      setBoards(data);
    } catch (err: any) {
      setError(err.message ?? "Kan boards niet laden.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBoards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organisationId]);

  const handleCreate = async () => {
    if (!organisationId) return;
    const name = newBoardName.trim();
    if (!name) return;
    try {
      setError(null);
      await api.boardsCreate({ organisationId, name });
      setNewBoardName("");
      await loadBoards();
    } catch (err: any) {
      setError(err.message ?? "Kan board niet aanmaken.");
    }
  };

  const proFeatures = useMemo(
    () => [
      "AI-samenvattingen van comments",
      "OCR op bijlagen",
      "Herhalende taken via automatisering",
    ],
    [],
  );

  return (
    <div className="space-y-10">
      <header className="rounded-[32px] border border-white/60 bg-white/75 p-8 shadow-glass">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <Badge className="bg-brand-100 text-brand-700">Kanban</Badge>
            <h1 className="text-3xl font-semibold text-ink md:text-4xl">
              Jouw boards voor planning en teamwork
            </h1>
            <p className="max-w-2xl text-sm text-ink/60">
              Maak boards per klant, project of team. Sleep taken tussen kolommen en organiseer alles vanaf één plek.
            </p>
          </div>
          <div className="flex w-full max-w-md items-center gap-3 md:w-auto">
            <input
              type="text"
              value={newBoardName}
              placeholder="Nieuwe boardnaam"
              onChange={(event) => setNewBoardName(event.target.value)}
              className="w-full rounded-2xl border border-brand-100 bg-white/80 px-4 py-2 text-sm text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
            <Button
              onClick={handleCreate}
              className="shrink-0"
              disabled={!organisationId || !newBoardName.trim()}
            >
              Nieuw board
            </Button>
          </div>
        </div>
        <div className="mt-6 rounded-3xl border border-brand-100 bg-brand-50/60 p-6 text-sm text-brand-700">
          <p className="font-medium">
            {plan === "PRO" || plan === "ENTERPRISE"
              ? "Je plan ontgrendelt alle geavanceerde Kanban features."
              : "Upgrade naar Pro voor extra workflows:"}
          </p>
          {plan !== "PRO" && plan !== "ENTERPRISE" && (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {proFeatures.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          )}
        </div>
      </header>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">Boards</h2>
          <Button variant="ghost" onClick={() => void loadBoards()}>
            Vernieuwen
          </Button>
        </div>
        {loading ? (
          <div className="rounded-3xl border border-brand-100 bg-white/70 p-6 text-sm text-ink/60">
            Boards laden...
          </div>
        ) : boards.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {boards.map((board) => (
              <Card key={board.id} className="flex flex-col gap-4 p-5">
                <div>
                  <h3 className="text-lg font-semibold text-ink">{board.name}</h3>
                  <p className="mt-1 text-xs uppercase tracking-wide text-ink/40">
                    {board.columns.length} kolom{board.columns.length === 1 ? "" : "men"}
                  </p>
                </div>
                <div className="flex grow flex-wrap gap-2 text-xs text-ink/50">
                  {board.columns.slice(0, 3).map((column) => (
                    <span
                      key={column.id}
                      className="rounded-full border border-brand-100 bg-brand-50/80 px-3 py-1"
                    >
                      {column.name}
                    </span>
                  ))}
                  {board.columns.length > 3 && (
                    <span className="rounded-full border border-brand-100 bg-brand-50/60 px-3 py-1">
                      +{board.columns.length - 3}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <Link
                    href={`/boards/${board.id}`}
                    className="text-sm font-medium text-brand-600 hover:text-brand-700"
                  >
                    Open board →
                  </Link>
                  <span className="text-xs text-ink/40">
                    Laatst geüpdatet: {new Date(board.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-brand-100 bg-white/60 p-10 text-center text-sm text-ink/60">
            Nog geen boards. Maak er één aan met de knop hierboven.
          </div>
        )}
      </section>
    </div>
  );
}
