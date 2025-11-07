"use client";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  type KanbanTask,
  type BoardColumn,
  type KanbanChecklistItem,
  type PlanType,
} from "@/lib/api";

import { TaskDrawer } from "./TaskDrawer";

type ColumnWithTasks = BoardColumn & { tasks: KanbanTask[] };

type Props = {
  plan: PlanType;
  columns: ColumnWithTasks[];
  onCreateTask: (columnId: string) => Promise<void>;
  onTaskDrop: (taskId: string, targetColumnId: string) => Promise<void>;
  onTaskUpdate: (taskId: string, changes: Partial<KanbanTask>) => Promise<void>;
  onTaskClose: (taskId: string) => Promise<void>;
  onTaskReopen: (taskId: string) => Promise<void>;
  onSummarize: (taskId: string) => Promise<string>;
  onRecurrenceSave: (taskId: string, rule: string) => Promise<void>;
  onRecurrenceRemove: (recurrenceId: string) => Promise<void>;
  onRunOcr: (taskId: string) => Promise<{ ocrPayload: Record<string, unknown> }>;
  onRenameColumn: (columnId: string, name: string) => Promise<void>;
  onDeleteColumn: (columnId: string) => Promise<void>;
};

export function KanbanBoard({
  plan,
  columns,
  onCreateTask,
  onTaskDrop,
  onTaskUpdate,
  onTaskClose,
  onTaskReopen,
  onSummarize,
  onRecurrenceSave,
  onRecurrenceRemove,
  onRunOcr,
  onRenameColumn,
  onDeleteColumn,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id.toString();
    const destinationColumn =
      over.data.current?.columnId ??
      (over.data.current?.type === "column" ? over.id.toString() : null);
    if (!destinationColumn) return;
    const currentColumn = active.data.current?.columnId;
    if (currentColumn === destinationColumn) return;
    await onTaskDrop(taskId, destinationColumn);
  };

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid gap-5 md:grid-cols-3 xl:grid-cols-4">
          {columns.map((column) => (
            <ColumnCard
              key={column.id}
              column={column}
              onCreate={() => onCreateTask(column.id)}
              onOpenTask={setActiveTask}
              onRename={(name) => onRenameColumn(column.id, name)}
              onDelete={() => onDeleteColumn(column.id)}
            />
          ))}
        </div>
      </DndContext>
      {activeTask && (
        <TaskDrawer
          task={activeTask}
          plan={plan}
          onClose={() => setActiveTask(null)}
          onSave={onTaskUpdate}
          onDone={onTaskClose}
          onReopen={onTaskReopen}
          onSummarize={onSummarize}
          onRecurrenceSave={onRecurrenceSave}
          onRecurrenceRemove={onRecurrenceRemove}
          onRunOcr={onRunOcr}
        />
      )}
    </>
  );
}

type ColumnCardProps = {
  column: ColumnWithTasks;
  onCreate: () => Promise<void>;
  onOpenTask: (task: KanbanTask) => void;
  onRename: (name: string) => Promise<void>;
  onDelete: () => Promise<void>;
};

function ColumnCard({ column, onCreate, onOpenTask, onRename, onDelete }: ColumnCardProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(column.name);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(column.name);
  }, [column.name]);

  const saveName = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === column.name) {
      setEditing(false);
      setName(column.name);
      return;
    }
    try {
      setSaving(true);
      await onRename(trimmed);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      void saveName();
    } else if (event.key === "Escape") {
      setEditing(false);
      setName(column.name);
    }
  };

  return (
    <Card className="flex h-full flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {editing ? (
            <input
              value={name}
              autoFocus
              disabled={saving}
              onChange={(event) => setName(event.target.value)}
              onBlur={() => void saveName()}
              onKeyDown={handleKeyDown}
              className="w-40 rounded-lg border border-brand-100 bg-white px-2 py-1 text-sm text-ink outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
          ) : (
            <h2 className="text-lg font-semibold text-ink">{column.name}</h2>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-ink/40">
            {column.tasks.length} kaart{column.tasks.length === 1 ? "" : "en"}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-ink/50 hover:text-ink"
            onClick={() => setEditing((prev) => !prev)}
          >
            <IconEdit size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-600"
            onClick={() => {
              if (
                confirm(
                  "Kolom verwijderen? Taken in deze kolom moeten eerst verplaatst of verwijderd worden.",
                )
              ) {
                void onDelete();
              }
            }}
          >
            <IconTrash size={16} />
          </Button>
        </div>
      </div>
      <div className="flex grow flex-col gap-3">
        <DroppableColumn id={column.id}>
          <SortableContext
            items={column.tasks.map((task) => task.id)}
            strategy={verticalListSortingStrategy}
          >
            {column.tasks.length ? (
              column.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  columnId={column.id}
                  onOpen={() => onOpenTask(task)}
                />
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-brand-100 bg-white/70 p-4 text-xs text-ink/40">
                Nog geen taken in deze kolom.
              </div>
            )}
          </SortableContext>
        </DroppableColumn>
      </div>
      <Button
        onClick={() => void onCreate()}
        className="flex items-center gap-2"
        variant="secondary"
      >
        <IconPlus size={16} />
        Nieuwe taak
      </Button>
    </Card>
  );
}

type TaskCardProps = {
  task: KanbanTask;
  columnId: string;
  onOpen: () => void;
};

function TaskCard({ task, columnId, onOpen }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
    data: { columnId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const checklistProgress = computeChecklist(task.checklist);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        "group cursor-grab rounded-2xl border border-brand-100 bg-white p-4 shadow-sm transition hover:shadow-md active:cursor-grabbing",
      )}
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-ink">{task.title}</p>
        {task.status === "done" && (
          <span className="rounded-full bg-mint-100 px-2 py-0.5 text-xs text-mint-700">
            Gereed
          </span>
        )}
      </div>
      {task.description && (
        <p className="mt-2 line-clamp-2 text-xs text-ink/60">{task.description}</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink/40">
        {task.assignee && (
          <span className="rounded-full border border-brand-100 bg-brand-50/80 px-2 py-1">
            {task.assignee.email}
          </span>
        )}
        {task.dueDate && (
          <span className="rounded-full border border-brand-100 bg-brand-50/60 px-2 py-1">
            Deadline: {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
        {checklistProgress && (
          <span className="rounded-full border border-brand-100 bg-brand-50/60 px-2 py-1">
            Checklist {checklistProgress.completed}/{checklistProgress.total}
          </span>
        )}
      </div>
    </div>
  );
}

type DroppableColumnProps = {
  id: string;
  children: React.ReactNode;
};

function DroppableColumn({ id, children }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: "column", columnId: id },
  });

  return (
    <div
      ref={setNodeRef}
      className={clsx("h-full space-y-3 rounded-2xl p-0.5 transition", {
        "bg-brand-50/60": isOver,
      })}
    >
      {children}
    </div>
  );
}

function computeChecklist(items: KanbanChecklistItem[]) {
  if (!items.length) return null;
  const completed = items.filter((item) => item.done).length;
  return { completed, total: items.length };
}
