"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog } from "@headlessui/react";
import {
  IconX,
  IconTrash,
  IconCalendar,
  IconPlayerPlay,
  IconRotateClockwise,
  IconSparkles,
  IconWand,
} from "@tabler/icons-react";
import clsx from "clsx";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { KanbanTask, KanbanChecklistItem, PlanType } from "@/lib/api";

type Props = {
  task: KanbanTask;
  plan: PlanType;
  onClose: () => void;
  onSave: (taskId: string, changes: Partial<KanbanTask>) => Promise<void>;
  onDone: (taskId: string) => Promise<void>;
  onReopen: (taskId: string) => Promise<void>;
  onSummarize: (taskId: string) => Promise<string>;
  onRecurrenceSave: (taskId: string, rule: string) => Promise<void>;
  onRecurrenceRemove: (recurrenceId: string) => Promise<void>;
  onRunOcr: (taskId: string) => Promise<{ ocrPayload: Record<string, unknown> }>;
};

const STATUS_OPTIONS: Array<{ label: string; value: KanbanTask["status"] }> = [
  { label: "Open", value: "open" },
  { label: "In behandeling", value: "in_progress" },
  { label: "Voltooid", value: "done" },
];

const PRIORITY_OPTIONS = [
  { label: "Laag", value: "low" },
  { label: "Normaal", value: "normal" },
  { label: "Hoog", value: "high" },
  { label: "Urgent", value: "urgent" },
];

const RECURRENCE_OPTIONS = [
  { value: "NONE", label: "Geen herhaling" },
  { value: "FREQ=DAILY", label: "Dagelijks" },
  { value: "FREQ=WEEKLY", label: "Wekelijks" },
  { value: "FREQ=MONTHLY", label: "Maandelijks" },
];

export function TaskDrawer({
  task,
  plan,
  onClose,
  onSave,
  onDone,
  onReopen,
  onSummarize,
  onRecurrenceSave,
  onRecurrenceRemove,
  onRunOcr,
}: Props) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [status, setStatus] = useState<KanbanTask["status"]>(task.status);
  const [priority, setPriority] = useState(task.priority ?? "normal");
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.slice(0, 10) : "");
  const [saving, setSaving] = useState(false);

  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [recurrenceRule, setRecurrenceRule] = useState(task.recurrence?.rule ?? "NONE");
  const [recurrenceSaving, setRecurrenceSaving] = useState(false);
  const [recurrenceMessage, setRecurrenceMessage] = useState<string | null>(null);

  const [ocrResult, setOcrResult] = useState<Record<string, unknown> | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description ?? "");
    setStatus(task.status);
    setPriority(task.priority ?? "normal");
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
    setRecurrenceRule(task.recurrence?.rule ?? "NONE");
    setSummary(null);
    setSummaryError(null);
    setRecurrenceMessage(null);
    setOcrResult(null);
    setOcrError(null);
  }, [task]);

  const hasChanges = useMemo(() => {
    return (
      title.trim() !== task.title ||
      description !== (task.description ?? "") ||
      status !== task.status ||
      (priority ?? "") !== (task.priority ?? "") ||
      (dueDate || null) !== (task.dueDate ? task.dueDate.slice(0, 10) : null)
    );
  }, [title, description, status, priority, dueDate, task]);

  const isPro = plan === "PRO" || plan === "ENTERPRISE";
  const isDone = status === "done";

  const handleSubmit = async () => {
    if (!hasChanges) return;
    setSaving(true);
    try {
      await onSave(task.id, {
        title: title.trim(),
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteToggle = async () => {
    if (isDone) {
      await onReopen(task.id);
    } else {
      await onDone(task.id);
    }
    onClose();
  };

  const handleGenerateSummary = async () => {
    if (!isPro) return;
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const result = await onSummarize(task.id);
      setSummary(result);
    } catch (error: any) {
      setSummaryError(error.message ?? "Kon samenvatting niet ophalen.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleRecurrenceSave = async () => {
    if (!isPro) return;
    setRecurrenceSaving(true);
    setRecurrenceMessage(null);
    try {
      if (recurrenceRule === "NONE") {
        if (task.recurrence) {
          await onRecurrenceRemove(task.recurrence.id);
        }
        setRecurrenceMessage("Herhaling verwijderd.");
      } else {
        await onRecurrenceSave(task.id, recurrenceRule);
        setRecurrenceMessage("Herhaling opgeslagen.");
      }
    } catch (error: any) {
      setRecurrenceMessage(error.message ?? "Kon herhaling niet opslaan.");
    } finally {
      setRecurrenceSaving(false);
    }
  };

  const handleOcrDemo = async () => {
    if (!isPro) return;
    setOcrLoading(true);
    setOcrError(null);
    setOcrResult(null);
    try {
      const result = await onRunOcr(task.id);
      setOcrResult(result.ocrPayload);
    } catch (error: any) {
      setOcrError(error.message ?? "OCR kon niet uitgevoerd worden.");
    } finally {
      setOcrLoading(false);
    }
  };

  const checklistProgress = computeChecklist(task.checklist);
  const nextOccurrenceText = task.recurrence?.nextOccurrence
    ? new Date(task.recurrence.nextOccurrence).toLocaleString()
    : null;

  return (
    <Dialog open onClose={onClose} className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur" aria-hidden="true" />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-ink/40">
            <Badge>{task.columnId}</Badge>
            <span>{new Date(task.createdAt).toLocaleString()}</span>
          </div>
          <button
            type="button"
            className="rounded-full border border-slate-200 p-1 text-slate-500 hover:text-ink"
            onClick={onClose}
          >
            <IconX size={18} />
          </button>
        </header>
        <main className="flex flex-col gap-6 px-6 py-6">
          <div className="space-y-3">
            <label className="text-xs font-medium uppercase text-ink/40">Titel</label>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-brand-400 focus:ring focus:ring-brand-100"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="space-y-3">
            <label className="text-xs font-medium uppercase text-ink/40">Beschrijving</label>
            <textarea
              className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-brand-400 focus:ring focus:ring-brand-100"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase text-ink/40">Status</label>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-ink"
                value={status}
                onChange={(event) => setStatus(event.target.value as KanbanTask["status"])}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase text-ink/40">Prioriteit</label>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-ink"
                value={priority ?? "normal"}
                onChange={(event) => setPriority(event.target.value)}
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-medium uppercase text-ink/40">
              <IconCalendar size={14} />
              Vervaldatum
            </label>
            <input
              type="date"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-ink"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>
          {task.assignee && (
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase text-ink/40">Toegewezen aan</label>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-ink">
                <span className="rounded-full bg-brand-100 px-2 py-1 text-xs text-brand-700">
                  {task.assignee.email}
                </span>
                <span className="text-xs text-ink/40">{task.assignee.role}</span>
              </div>
            </div>
          )}
          {checklistProgress && (
            <div className="text-xs text-ink/50">
              Checklist: {checklistProgress.completed}/{checklistProgress.total}
            </div>
          )}
          <section className="space-y-3 rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
            <header className="flex items-center gap-2 text-sm font-semibold text-brand-800">
              <IconSparkles size={16} />
              AI-samenvatting
            </header>
            {isPro ? (
              <>
                <Button
                  variant="secondary"
                  onClick={handleGenerateSummary}
                  disabled={summaryLoading}
                  className="text-sm"
                >
                  {summaryLoading ? "Samenvatting ophalen..." : "Genereer samenvatting"}
                </Button>
                {summaryError && <p className="text-xs text-red-600">{summaryError}</p>}
                {summary && (
                  <pre className="whitespace-pre-wrap rounded-xl border border-brand-100 bg-white px-3 py-2 text-xs text-ink/70">
                    {summary}
                  </pre>
                )}
              </>
            ) : (
              <p className="text-xs text-ink/60">
                Beschikbaar voor Pro en Enterprise plannen.
              </p>
            )}
          </section>
          <section className="space-y-3 rounded-2xl border border-brand-100 bg-brand-50/40 p-4">
            <header className="text-sm font-semibold text-brand-800">Herhaling</header>
            {isPro ? (
              <>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-ink"
                  value={recurrenceRule}
                  onChange={(event) => setRecurrenceRule(event.target.value)}
                >
                  {RECURRENCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {nextOccurrenceText && (
                  <p className="text-xs text-ink/50">
                    Volgende uitvoering gepland op {nextOccurrenceText}
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <Button onClick={handleRecurrenceSave} disabled={recurrenceSaving} variant="secondary">
                    {recurrenceSaving ? "Opslaan..." : "Opslaan"}
                  </Button>
                  {recurrenceMessage && (
                    <p className="text-xs text-ink/50">{recurrenceMessage}</p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-xs text-ink/60">
                Herhalende taken zijn beschikbaar in het Pro plan.
              </p>
            )}
          </section>
          <section className="space-y-3 rounded-2xl border border-brand-100 bg-brand-50/40 p-4">
            <header className="flex items-center gap-2 text-sm font-semibold text-brand-800">
              <IconWand size={16} />
              OCR-verwerking
            </header>
            {isPro ? (
              <>
                <Button onClick={handleOcrDemo} disabled={ocrLoading} variant="secondary">
                  {ocrLoading ? "Analyseren..." : "Voer OCR-demo uit"}
                </Button>
                {ocrError && <p className="text-xs text-red-600">{ocrError}</p>}
                {ocrResult && (
                  <pre className="whitespace-pre-wrap rounded-xl border border-brand-100 bg-white px-3 py-2 text-xs text-ink/70">
                    {JSON.stringify(ocrResult, null, 2)}
                  </pre>
                )}
              </>
            ) : (
              <p className="text-xs text-ink/60">
                OCR op bijlagen is beschikbaar voor Pro en Enterprise.
              </p>
            )}
          </section>
        </main>
        <footer className="mt-auto flex flex-col gap-3 border-t border-slate-200 px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleSubmit}
              disabled={saving || !hasChanges}
              className={clsx({ "opacity-60": !hasChanges })}
            >
              Wijzigingen opslaan
            </Button>
            <Button
              variant="secondary"
              onClick={handleCompleteToggle}
              className="flex items-center gap-2"
            >
              {isDone ? (
                <>
                  <IconRotateClockwise size={16} />
                  Heropen taak
                </>
              ) : (
                <>
                  <IconPlayerPlay size={16} />
                  Markeer als gereed
                </>
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between text-xs text-ink/40">
            <span>Laatste update: {new Date(task.updatedAt).toLocaleString()}</span>
            <Button variant="ghost" size="sm" className="flex items-center gap-2 text-red-500" disabled>
              <IconTrash size={16} />
              Verwijderen via column menu
            </Button>
          </div>
        </footer>
      </div>
    </Dialog>
  );
}

function computeChecklist(items: KanbanChecklistItem[]) {
  if (!items.length) return null;
  const completed = items.filter((item) => item.done).length;
  return { completed, total: items.length };
}
