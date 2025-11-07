"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IconGripVertical } from "@tabler/icons-react";

import { useAuth } from "@/app/providers/AuthProvider";
import { api, type InspectionWithUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type InspectionInput = {
  description: string;
  score: number;
  notes?: string;
};

const SCORE_OPTIONS = [1, 2, 3, 4, 5];

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("nl-NL", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function InspectionsPage() {
  const { isManager } = useAuth();
  const [inspections, setInspections] = useState<InspectionWithUser[]>([]);
  const [locationFilter, setLocationFilter] = useState("");
  const [listError, setListError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [location, setLocation] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InspectionInput[]>([{ description: "", score: 3 }]);

  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [reportEmail, setReportEmail] = useState("");
  const [reportMessage, setReportMessage] = useState("");
  const [sendingReport, setSendingReport] = useState(false);

  const loadInspections = async () => {
    try {
      setListError(null);
      const data = await api.inspectionsList({
        location: locationFilter.trim() ? locationFilter.trim() : undefined,
      });
      setInspections(data);
    } catch (err: any) {
      setListError(err.message ?? "Kon inspecties niet laden");
    }
  };

  useEffect(() => {
    void loadInspections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredInspections = useMemo(() => {
    return inspections
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter((inspection) =>
        locationFilter.trim()
          ? inspection.location.toLowerCase().includes(locationFilter.trim().toLowerCase())
          : true,
      );
  }, [inspections, locationFilter]);

  const stats = useMemo(() => {
    const total = inspections.length;
    const withPdf = inspections.filter((inspection) => inspection.pdfUrl).length;
    const last = inspections[0]?.date ? formatDateTime(inspections[0].date) : "n.v.t.";
    return { total, withPdf, last };
  }, [inspections]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const updateItem = (index: number, patch: Partial<InspectionInput>) => {
    setItems((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  const addItem = () => {
    setItems((prev) => [...prev, { description: "", score: 3, notes: "" }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== index)));
  };

  const handleChecklistDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const fromIndex = prev.findIndex((_, idx) => idx.toString() === active.id);
      const toIndex = prev.findIndex((_, idx) => idx.toString() === over.id);
      if (fromIndex === -1 || toIndex === -1) return prev;
      return arrayMove(prev, fromIndex, toIndex);
    });
  };

  const resetCreationForm = () => {
    setLocation("");
    setDate(new Date().toISOString().slice(0, 16));
    setNotes("");
    setItems([{ description: "", score: 3 }]);
  };

  const submitInspection = async () => {
    if (!isManager) return;
    if (!location.trim()) {
      setCreateError("Locatie is verplicht");
      return;
    }
    if (!date) {
      setCreateError("Datum en tijd zijn verplicht");
      return;
    }
    const sanitizedItems = items
      .map((item) => ({
        description: item.description.trim(),
        score: item.score,
        notes: item.notes?.trim() || undefined,
      }))
      .filter((item) => item.description.length > 0);
    if (!sanitizedItems.length) {
      setCreateError("Voeg minimaal één inspectie-item toe");
      return;
    }

    setCreateError(null);
    setLoading(true);
    try {
      await api.inspectionsCreate({
        location: location.trim(),
        date: new Date(date).toISOString(),
        notes: notes.trim() || undefined,
        items: sanitizedItems,
      });
      resetCreationForm();
      await loadInspections();
    } catch (err: any) {
      setCreateError(err.message ?? "Kon inspectie niet opslaan");
    } finally {
      setLoading(false);
    }
  };

  const generatePdf = async (id: string) => {
    setReportError(null);
    try {
      await api.inspectionsGeneratePdf(id);
      await loadInspections();
    } catch (err: any) {
      setReportError(err.message ?? "Kon PDF niet genereren");
    }
  };

  const sendReport = async (id: string) => {
    if (!reportEmail.trim()) {
      setReportError("Vul een e-mailadres in");
      return;
    }
    setReportError(null);
    setSendingReport(true);
    try {
      await api.inspectionsSendReport(id, {
        recipientEmail: reportEmail.trim(),
        message: reportMessage.trim() || undefined,
      });
      setReportTarget(null);
      setReportEmail("");
      setReportMessage("");
    } catch (err: any) {
      setReportError(err.message ?? "Kon rapport niet versturen");
    } finally {
      setSendingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="rounded border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Kwaliteitsinspecties</h1>
            <p className="mt-1 text-sm text-slate-600">
              Registreer inspecties, genereer rapporten en mail deze direct naar klanten.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm text-slate-600 md:grid-cols-3">
            <StatCard label="Totaal" value={stats.total.toString()} />
            <StatCard label="Met PDF" value={stats.withPdf.toString()} />
            <StatCard label="Laatste inspectie" value={stats.last} />
          </div>
        </div>
      </header>

      <section className="rounded border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-medium text-slate-900">Overzicht</h2>
            <p className="text-sm text-slate-600">
              Filter op locatie of voeg nieuwe inspecties toe.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              className="w-full rounded border p-2 text-sm md:w-64"
              placeholder="Filter op locatie..."
              value={locationFilter}
              onChange={(event) => setLocationFilter(event.target.value)}
            />
            <Button variant="ghost" size="sm" onClick={() => void loadInspections()}>
              Vernieuwen
            </Button>
          </div>
        </div>
        {listError && (
          <div className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {listError}
          </div>
        )}
      </section>

      {isManager && (
        <section className="space-y-4 rounded border bg-white p-4 shadow-sm">
          <div>
            <h2 className="text-lg font-medium text-slate-900">Nieuwe inspectie</h2>
            <p className="text-sm text-slate-600">
              Stel een checklist samen en registreer observaties per locatie.
            </p>
          </div>
          {createError && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {createError}
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs font-semibold uppercase text-slate-500">
              Locatie
              <input
                className="mt-1 w-full rounded border p-2 text-sm"
                placeholder="Bijv. Kliniek Utrecht Zuid"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </label>
            <label className="text-xs font-semibold uppercase text-slate-500">
              Datum & tijd
              <input
                type="datetime-local"
                className="mt-1 w-full rounded border p-2 text-sm"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
          </div>
          <label className="text-xs font-semibold uppercase text-slate-500">
            Algemene notities
            <textarea
              className="mt-1 w-full rounded border p-2 text-sm"
              rows={3}
              placeholder="Opmerkingen of aandachtspunten voor deze inspectie"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>

          <div className="rounded border border-dashed border-slate-300 bg-slate-50 p-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Checklist</h3>
              <Button variant="secondary" size="sm" onClick={() => addItem()}>
                Item toevoegen
              </Button>
            </div>
            <DndContext sensors={sensors} onDragEnd={handleChecklistDragEnd}>
              <SortableContext
                items={items.map((_, index) => index.toString())}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <SortableChecklistItem
                      key={index}
                      id={index.toString()}
                      item={item}
                      canRemove={items.length > 1}
                      onChange={(patch) => updateItem(index, patch)}
                      onRemove={() => removeItem(index)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => void submitInspection()} disabled={loading}>
              Inspectie opslaan
            </Button>
          </div>
        </section>
      )}

      <section className="space-y-4 rounded border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">Recente inspecties</h2>
        {reportError && (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {reportError}
          </div>
        )}
        <div className="space-y-4">
          {filteredInspections.map((inspection) => (
            <Fragment key={inspection.id}>
              <article className="space-y-3 rounded border bg-slate-50 p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">{inspection.location}</h3>
                      {inspection.pdfUrl ? (
                        <Badge variant="success">PDF beschikbaar</Badge>
                      ) : (
                        <Badge variant="warning">Nog geen PDF</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {formatDateTime(inspection.date)} — Inspecteur {inspection.inspector.email}
                    </p>
                    {inspection.notes && (
                      <p className="mt-2 text-sm text-slate-600">Opmerking: {inspection.notes}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => void generatePdf(inspection.id)}
                    >
                      PDF genereren
                    </Button>
                    {inspection.pdfUrl && (
                      <a
                        href={inspection.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Download
                      </a>
                    )}
                    {isManager && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReportError(null);
                          setReportTarget((current) => (current === inspection.id ? null : inspection.id));
                          setReportEmail("");
                          setReportMessage("");
                        }}
                      >
                        Rapport mailen
                      </Button>
                    )}
                  </div>
                </div>

                <div className="overflow-hidden rounded border bg-white">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-100 text-left text-xs font-semibold uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Item</th>
                        <th className="px-3 py-2">Score</th>
                        <th className="px-3 py-2">Notitie</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {inspection.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2">{item.description}</td>
                          <td className="px-3 py-2 font-medium text-slate-700">{item.score}/5</td>
                          <td className="px-3 py-2 text-slate-500">{item.notes ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {reportTarget === inspection.id && (
                  <div className="rounded border border-slate-200 bg-white p-3">
                    <div className="grid gap-2 md:grid-cols-[2fr,3fr,auto]">
                      <input
                        className="rounded border p-2 text-sm"
                        placeholder="E-mailadres klant"
                        value={reportEmail}
                        onChange={(event) => setReportEmail(event.target.value)}
                      />
                      <input
                        className="rounded border p-2 text-sm"
                        placeholder="Optioneel bericht"
                        value={reportMessage}
                        onChange={(event) => setReportMessage(event.target.value)}
                      />
                      <div className="flex flex-col gap-2 md:flex-row">
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={sendingReport}
                          onClick={() => void sendReport(inspection.id)}
                        >
                          Versturen
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setReportTarget(null);
                            setReportEmail("");
                            setReportMessage("");
                            setReportError(null);
                          }}
                        >
                          Annuleren
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            </Fragment>
          ))}
          {!filteredInspections.length && (
            <div className="rounded border border-dashed bg-white p-4 text-center text-sm text-slate-500">
              Geen inspecties gevonden.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

type SortableChecklistItemProps = {
  id: string;
  item: InspectionInput;
  canRemove: boolean;
  onChange: (patch: Partial<InspectionInput>) => void;
  onRemove: () => void;
};

function SortableChecklistItem({ id, item, canRemove, onChange, onRemove }: SortableChecklistItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid gap-3 rounded border bg-white p-3 shadow-sm md:grid-cols-[auto,1fr,150px,1fr] ${
        isDragging ? "border-brand-200 shadow-lg" : "border-slate-200"
      }`}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="hidden cursor-grab border border-dashed border-slate-300 text-slate-400 hover:text-brand-500 md:inline-flex"
        {...listeners}
        {...attributes}
      >
        <IconGripVertical className="h-4 w-4" />
      </Button>
      <label className="text-xs text-slate-600">
        Omschrijving
        <input
          className="mt-1 w-full rounded border p-2 text-sm"
          placeholder="Bijv. Schoonmaak woonkamer"
          value={item.description}
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </label>
      <label className="text-xs text-slate-600">
        Score
        <select
          className="mt-1 w-full rounded border p-2 text-sm"
          value={item.score}
          onChange={(event) => onChange({ score: Number.parseInt(event.target.value, 10) })}
        >
          {SCORE_OPTIONS.map((score) => (
            <option key={score} value={score}>
              {score}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-slate-600">
        Notities (optioneel)
        <div className="mt-1 flex items-center gap-2">
          <input
            className="w-full rounded border p-2 text-sm"
            placeholder="Opmerkingen"
            value={item.notes ?? ""}
            onChange={(event) => onChange({ notes: event.target.value })}
          />
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-500"
              onClick={onRemove}
            >
              Verwijderen
            </Button>
          )}
        </div>
      </label>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border bg-white px-4 py-3 shadow-sm">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}

