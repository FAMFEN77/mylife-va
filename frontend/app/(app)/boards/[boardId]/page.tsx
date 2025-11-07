"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { IconRefresh } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { api, type Board, type KanbanTask, type BoardColumn } from "@/lib/api";
import { usePlan } from "@/lib/hooks/usePlan";

import { KanbanBoard } from "./components/KanbanBoard";

type ColumnWithTasks = BoardColumn & { tasks: KanbanTask[] };

export default function BoardDetailPage() {
  const params = useParams<{ boardId: string }>();
  const boardId = params?.boardId as string | undefined;
  const plan = usePlan();
  const [board, setBoard] = useState<Board | null>(null);
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newColumnName, setNewColumnName] = useState("");
  const [creatingColumn, setCreatingColumn] = useState(false);

  const load = useCallback(async () => {
    if (!boardId) return;
    try {
      setLoading(true);
      setError(null);
      const [boardResponse, taskResponse] = await Promise.all([
        api.boardsGet(boardId),
        api.boardTasksList(boardId),
      ]);
      setBoard(boardResponse);
      setTasks(taskResponse);
    } catch (err: any) {
      setError(err.message ?? "Kan board niet laden.");
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    void load();
  }, [load]);

  const sortedColumns = useMemo(() => {
    if (!board) return [];
    return board.columns.slice().sort((a, b) => a.position - b.position);
  }, [board]);

  const columns = useMemo<ColumnWithTasks[]>(() => {
    return sortedColumns.map((column) => ({
      ...column,
      tasks: tasks.filter((task) => task.columnId === column.id),
    }));
  }, [sortedColumns, tasks]);

  const handleCreateTask = async (columnId: string) => {
    if (!boardId) return;
    try {
      await api.boardTasksCreate(boardId, {
        columnId,
        title: "Nieuwe taak",
        status: "open",
      });
      await load();
    } catch (err: any) {
      setError(err.message ?? "Kan taak niet aanmaken.");
    }
  };

  const handleTaskDrop = async (taskId: string, targetColumnId: string) => {
    if (!boardId) return;
    try {
      await api.boardTasksUpdate(boardId, taskId, { columnId: targetColumnId });
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                columnId: targetColumnId,
              }
            : task,
        ),
      );
    } catch (err: any) {
      setError(err.message ?? "Kan taak niet verplaatsen.");
      await load();
    }
  };

  const handleTaskUpdate = async (taskId: string, changes: Partial<KanbanTask>) => {
    if (!boardId) return;
    const payload: Record<string, unknown> = {};
    if (changes.columnId) payload.columnId = changes.columnId;
    if (changes.title !== undefined) payload.title = changes.title;
    if (changes.description !== undefined) payload.description = changes.description;
    if (changes.status) payload.status = changes.status;
    if (changes.priority) payload.priority = changes.priority;
    if (changes.dueDate !== undefined) payload.dueDate = changes.dueDate;
    if ((changes as any).assigneeId !== undefined) payload.assigneeId = (changes as any).assigneeId;
    if ((changes as any).labelIds) payload.labelIds = (changes as any).labelIds;
    await api.boardTasksUpdate(boardId, taskId, payload as any);
    await load();
  };

  const handleTaskClose = async (taskId: string) => {
    await api.boardTasksClose(taskId);
    await load();
  };

  const handleTaskReopen = async (taskId: string) => {
    await api.boardTasksReopen(taskId);
    await load();
  };

  const handleSummarize = useCallback(
    async (taskId: string) => {
      const { summary } = await api.tasksSummary(taskId);
      return summary;
    },
    [],
  );

  const handleRecurrenceSave = useCallback(
    async (taskId: string, rule: string) => {
      await api.tasksSetRecurrence(taskId, rule);
      await load();
    },
    [load],
  );

  const handleRecurrenceRemove = useCallback(
    async (recurrenceId: string) => {
      await api.tasksRemoveRecurrence(recurrenceId);
      await load();
    },
    [load],
  );

  const handleRunOcr = useCallback(async (taskId: string) => api.tasksRunOcr(taskId), []);

  const handleCreateColumn = useCallback(async () => {
    if (!boardId) return;
    const name = newColumnName.trim();
    if (!name) return;
    try {
      setCreatingColumn(true);
      setError(null);
      const nextPosition = sortedColumns.length
        ? sortedColumns[sortedColumns.length - 1].position + 1
        : 0;
      await api.columnsCreate(boardId, { name, position: nextPosition });
      setNewColumnName("");
      await load();
    } catch (err: any) {
      setError(err.message ?? "Kan kolom niet aanmaken.");
    } finally {
      setCreatingColumn(false);
    }
  }, [boardId, newColumnName, sortedColumns, load]);

  const handleUpdateColumn = useCallback(
    async (columnId: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      try {
        await api.columnsUpdate(columnId, { name: trimmed });
        await load();
      } catch (err: any) {
        setError(err.message ?? "Kan kolom niet bijwerken.");
      }
    },
    [load],
  );

  const handleDeleteColumn = useCallback(
    async (columnId: string) => {
      try {
        await api.columnsDelete(columnId);
        await load();
      } catch (err: any) {
        setError(err.message ?? "Kan kolom niet verwijderen.");
      }
    },
    [load],
  );

  if (!boardId) {
    return (
      <div className="rounded-3xl border border-red-100 bg-red-50 p-6 text-sm text-red-600">
        Geen board geselecteerd.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="/boards" className="text-xs text-ink/40 hover:text-ink/60">
            ← Terug naar boards
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <Badge className="bg-brand-100 text-brand-700">Board</Badge>
            {board?.projectId && (
              <span className="rounded-full border border-brand-100 bg-brand-50/80 px-3 py-1 text-xs text-brand-700">
                Project: {board.projectId}
              </span>
            )}
          </div>
          <h1 className="mt-2 text-3xl font-semibold text-ink md:text-4xl">
            {board?.name ?? "Board"}
          </h1>
          <p className="text-sm text-ink/50">
            Sleep taken naar andere kolommen om de workflow up-to-date te houden.
          </p>
        </div>
        <Button variant="ghost" onClick={() => void load()} className="flex items-center gap-2">
          <IconRefresh size={16} />
          Vernieuwen
        </Button>
      </div>

      <Card className="flex flex-col gap-3 border-brand-100 bg-white/70 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink">Kolommen beheren</h2>
          <span className="text-xs text-ink/40">
            {sortedColumns.length} kolom{sortedColumns.length === 1 ? "" : "men"}
          </span>
        </div>
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            placeholder="Bijv. Backlog"
            value={newColumnName}
            onChange={(event) => setNewColumnName(event.target.value)}
            className="w-full rounded-2xl border border-brand-100 bg-white/80 px-4 py-2 text-sm text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
          />
          <Button
            onClick={() => void handleCreateColumn()}
            disabled={creatingColumn || !newColumnName.trim()}
            className="md:w-auto"
          >
            Kolom toevoegen
          </Button>
        </div>
      </Card>
      {plan !== "PRO" && plan !== "ENTERPRISE" && (
        <Card className="border-dashed border-brand-200 bg-brand-50/40 p-5 text-sm text-brand-700">
          <p>
            Upgrade naar Pro om AI-samenvattingen, OCR op bijlagen en herhalende taken op dit board te activeren.
          </p>
        </Card>
      )}

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-brand-100 bg-white/70 p-6 text-sm text-ink/60">
          Board laden...
        </div>
      ) : columns.length === 0 ? (
        <Card className="border-dashed border-brand-200 bg-white/70 p-6 text-sm text-ink/60">
          Nog geen kolommen. Voeg er een toe met het formulier hierboven.
        </Card>
      ) : (
        <KanbanBoard
          plan={plan}
          columns={columns}
          onCreateTask={handleCreateTask}
          onTaskDrop={handleTaskDrop}
          onTaskUpdate={handleTaskUpdate}
          onTaskClose={handleTaskClose}
          onTaskReopen={handleTaskReopen}
          onSummarize={handleSummarize}
          onRecurrenceSave={handleRecurrenceSave}
          onRecurrenceRemove={handleRecurrenceRemove}
          onRunOcr={handleRunOcr}
          onRenameColumn={handleUpdateColumn}
          onDeleteColumn={handleDeleteColumn}
        />
      )}
      <aside className="rounded-3xl border border-brand-100 bg-brand-50/50 p-6 text-xs text-ink/50">
        <p>
          Checklist en bijlagen worden binnenkort aan deze view toegevoegd. Tot die tijd kun je ze inzien via de detaildrawer.
        </p>
      </aside>
    </div>
  );
}




