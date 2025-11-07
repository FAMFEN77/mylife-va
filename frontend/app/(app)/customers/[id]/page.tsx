"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { CustomerForm, type CustomerFormValues } from "@/components/customers/CustomerForm";
import { DocumentUploadForm } from "@/components/documents/DocumentUploadForm";
import { DocumentExternalForm } from "@/components/documents/DocumentExternalForm";
import { DocumentList } from "@/components/documents/DocumentList";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/providers/AuthProvider";
import { api, type Customer, type DocumentListResponse } from "@/lib/api";

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const customerId = params?.id ?? "";
  const router = useRouter();
  const { authenticatedUser } = useAuth();
  const isManager = useMemo(() => (authenticatedUser?.role ?? "MEDEWERKER") === "MANAGER", [authenticatedUser]);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [customerLoading, setCustomerLoading] = useState(true);
  const [savingCustomer, setSavingCustomer] = useState(false);

  const [documents, setDocuments] = useState<DocumentListResponse>({ items: [], total: 0, page: 1, pageSize: 25 });
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [documentStatus, setDocumentStatus] = useState<"ACTIVE" | "ARCHIVED" | "ALL">("ACTIVE");
  const [documentPage, setDocumentPage] = useState(1);

  const fetchCustomer = useCallback(async () => {
    if (!customerId) return;
    setCustomerLoading(true);
    setCustomerError(null);
    try {
      const data = await api.customersGet(customerId);
      setCustomer(data);
    } catch (err) {
      setCustomerError(err instanceof Error ? err.message : "Niet gelukt om klant te laden.");
    } finally {
      setCustomerLoading(false);
    }
  }, [customerId]);

  const fetchDocuments = useCallback(async () => {
    if (!customerId) return;
    setDocumentsLoading(true);
    setDocumentsError(null);
    try {
      const data = await api.documentsList(customerId, {
        page: documentPage,
        status: documentStatus,
      });
      setDocuments(data);
      if (data.page !== documentPage) {
        setDocumentPage(data.page);
      }
    } catch (err) {
      setDocumentsError(err instanceof Error ? err.message : "Niet gelukt om documenten te laden.");
    } finally {
      setDocumentsLoading(false);
    }
  }, [customerId, documentPage, documentStatus]);

  useEffect(() => {
    void fetchCustomer();
  }, [fetchCustomer]);

  useEffect(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  const handleCustomerUpdate = async (values: CustomerFormValues) => {
    if (!customerId) return;
    setSavingCustomer(true);
    try {
      await api.customersUpdate(customerId, values);
      await fetchCustomer();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Opslaan mislukt.");
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleOpenDocument = async (documentId: string, source: "UPLOAD" | "EXTERNAL", fileUrl?: string | null) => {
    if (source === "EXTERNAL" && fileUrl) {
      window.open(fileUrl, "_blank", "noopener,noreferrer");
      return;
    }

    try {
      const blob = await api.documentsDownload(documentId);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Kon document niet openen.");
    }
  };

  const handleArchiveDocument = async (documentId: string) => {
    try {
      await api.documentsArchive(documentId);
      await fetchDocuments();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Archiveren mislukt.");
    }
  };

  const handleRestoreDocument = async (documentId: string) => {
    try {
      await api.documentsRestore(documentId);
      await fetchDocuments();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Herstellen mislukt.");
    }
  };

  if (!customerId) {
    return <p className="text-sm text-red-600">Geen klant geselecteerd.</p>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-slate-500">Klant</p>
          <h1 className="text-2xl font-semibold text-slate-900">
            {customer ? `${customer.firstName} ${customer.lastName}` : "Laden..."}
          </h1>
        </div>
        <Button variant="secondary" onClick={() => router.push("/customers")}>
          Terug naar overzicht
        </Button>
      </header>

      <section className="rounded border bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Gegevens</h2>
          <p className="text-sm text-slate-500">Pas klantinformatie aan en sla direct op.</p>
        </div>
        {customerError && (
          <p className="mb-4 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{customerError}</p>
        )}
        {customerLoading && !customer ? (
          <p className="text-sm text-slate-500">Klant wordt geladen...</p>
        ) : customer ? (
          <CustomerForm
            defaultValues={customer}
            submitLabel="Wijzigingen opslaan"
            isSubmitting={savingCustomer}
            onSubmit={handleCustomerUpdate}
          />
        ) : null}
      </section>

      <section className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <DocumentUploadForm customerId={customerId} onUploaded={fetchDocuments} />
          <DocumentExternalForm customerId={customerId} onCreated={fetchDocuments} />
        </div>
        {documentsError && (
          <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{documentsError}</p>
        )}
        <DocumentList
          documents={documents.items}
          loading={documentsLoading}
          page={documentPage}
          total={documents.total}
          pageSize={documents.pageSize}
          statusFilter={documentStatus}
          onStatusChange={(status) => {
            setDocumentStatus(status);
            setDocumentPage(1);
          }}
          onPageChange={(nextPage) => {
            setDocumentPage(nextPage);
          }}
          onOpen={(document) => handleOpenDocument(document.id, document.source, document.fileUrl)}
          onArchive={(document) => handleArchiveDocument(document.id)}
          onRestore={(document) => handleRestoreDocument(document.id)}
          isManager={isManager}
        />
      </section>
    </div>
  );
}
