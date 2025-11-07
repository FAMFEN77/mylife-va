"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, FormEvent, useState } from "react";

import { api, type CustomerImportResult } from "@/lib/api";
import { Button } from "@/components/ui/button";

export interface CsvImportDialogProps {
  onImported?: (result: CustomerImportResult) => void;
}

const HEADER_EXAMPLE =
  "companyName,firstName,lastName,email,phone,street,houseNumber,postalCode,city,country,kvkNumber,vatNumber";

export function CsvImportDialog({ onImported }: CsvImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CustomerImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setIsOpen(false);
    setFile(null);
    setError(null);
    setResult(null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file && !csvText.trim()) {
      setError("Upload een CSV-bestand of plak de inhoud.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.customersImportCsv({ file: file ?? undefined, data: csvText.trim() || undefined });
      setResult(response);
      onImported?.(response);
      setCsvText("");
      setFile(null);
    } catch (err: any) {
      setError(err.message ?? "Import mislukt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="secondary" onClick={() => setIsOpen(true)}>
        CSV-import
      </Button>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={close}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/40" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">CSV-import</Dialog.Title>
                  <p className="mt-1 text-sm text-slate-600">
                    Gebruik kolommen: {HEADER_EXAMPLE}. De e-mailkolom bepaalt of een klant wordt bijgewerkt of nieuw
                    wordt aangemaakt.
                  </p>

                  <form className="mt-4 space-y-4" onSubmit={submit}>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Bestand uploaden</label>
                      <input
                        type="file"
                        accept=".csv,text/csv"
                        className="mt-1 w-full rounded border p-2 text-sm"
                        onChange={(event) => {
                          const newFile = event.target.files?.[0] ?? null;
                          setFile(newFile);
                        }}
                      />
                      <p className="mt-1 text-xs text-slate-500">Laat leeg als je de CSV hieronder plakt.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700">CSV-inhoud</label>
                      <textarea
                        className="mt-1 h-40 w-full rounded border p-2 font-mono text-xs"
                        placeholder={HEADER_EXAMPLE}
                        value={csvText}
                        onChange={(event) => setCsvText(event.target.value)}
                      />
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}
                    {result && (
                      <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                        <p>
                          Aangemaakt: <strong>{result.created}</strong>, bijgewerkt: <strong>{result.updated}</strong>
                        </p>
                        {result.errors.length > 0 && (
                          <ul className="mt-2 list-disc pl-4">
                            {result.errors.map((item, index) => (
                              <li key={index}>
                                Regel {item.line}: {item.message}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={close}>
                        Sluiten
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? "Importeren..." : "Importeren"}
                      </Button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}

