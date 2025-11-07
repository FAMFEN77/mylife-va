import { DocumentSource, DocumentType } from "@/lib/api";

export const DOCUMENT_TYPE_OPTIONS: Array<{ value: DocumentType; label: string }> = [
  { value: "CONTRACT", label: "Contract" },
  { value: "INSPECTIE", label: "Inspectie" },
  { value: "BEHANDELPLAN", label: "Behandelplan" },
  { value: "RAPPORT", label: "Rapport" },
  { value: "OVERIG", label: "Overig" },
];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = DOCUMENT_TYPE_OPTIONS.reduce(
  (acc, option) => {
    acc[option.value] = option.label;
    return acc;
  },
  {} as Record<DocumentType, string>,
);

export const DOCUMENT_SOURCE_LABELS: Record<DocumentSource, string> = {
  UPLOAD: "Upload",
  EXTERNAL: "Extern",
};
