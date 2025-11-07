const PUBLIC_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";
const INTERNAL_BASE = process.env.API_INTERNAL_BASE_URL ?? PUBLIC_BASE;
const API_BASE = typeof window === "undefined" ? INTERNAL_BASE : PUBLIC_BASE;

type RequestOptions = RequestInit & { headers?: HeadersInit };

function authHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init: RequestOptions = {}): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(init.headers || {}),
      ...authHeaders(),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export type Role = "MANAGER" | "MEDEWERKER";
export type PlanType = "STARTER" | "PRO" | "ENTERPRISE";

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  organisationId?: string | null;
  plan?: PlanType;
};

export type GoogleStatus = { connected: boolean; expiresAt?: string };

export type Reminder = {
  id: string;
  userId: string;
  text: string;
  remindAt: string;
  sent: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AssistantReply = {
  intent: string;
  parameters: Record<string, unknown>;
  result?: Record<string, unknown>;
  message?: string;
  confidence?: number;
};

export type TeamMember = {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
};

export type TimeEntry = {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMin: number;
  projectId?: string | null;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TimeEntryWithUser = TimeEntry & {
  user: { id: string; email: string; role: Role };
};

export type Trip = {
  id: string;
  userId: string;
  date: string;
  from: string;
  to: string;
  distanceKm: number;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TripWithUser = Trip & { user: { id: string; email: string; role: Role } };

export type Expense = {
  id: string;
  userId: string;
  date: string;
  amount: number;
  category: string;
  receiptUrl?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseWithUser = Expense & {
  user: { id: string; email: string; role: Role };
};

export type InvoiceStatus = "draft" | "sent" | "paid";

export type Invoice = {
  id: string;
  userId: string;
  customer: string;
  date: string;
  totalEx: number;
  totalInc: number;
  status: InvoiceStatus;
  pdfUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceWithUser = Invoice & {
  user: { id: string; email: string; role: Role };
};

export type LeaveRequest = {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  type: string;
  status: string;
  calendarEventId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LeaveRequestWithUser = LeaveRequest & {
  user: { id: string; email: string; role: Role };
};

export type AvailabilityEntry = {
  id: string;
  userId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  location?: string | null;
  maxHoursPerWeek?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type AvailabilityPayloadEntry = {
  weekday: number;
  startTime: string;
  endTime: string;
  location?: string;
};

export type PlanningSuggestion = {
  user: AuthUser;
  location?: string | null;
  availableFrom: string;
  availableUntil: string;
  assignedTasksThatDay: number;
};

export type InspectionItem = {
  id: string;
  inspectionId: string;
  description: string;
  score: number;
  notes?: string | null;
};

export type Inspection = {
  id: string;
  inspectorId: string;
  location: string;
  date: string;
  notes?: string | null;
  pdfUrl?: string | null;
  status?: string;
  createdAt: string;
  updatedAt: string;
  items: InspectionItem[];
};

export type Customer = {
  id: string;
  organisationId: string;
  companyName?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  street?: string | null;
  houseNumber?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  kvkNumber?: string | null;
  vatNumber?: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
  createdById?: string | null;
};

export type CustomerListResponse = {
  items: Customer[];
  total: number;
  page: number;
  pageSize: number;
};

export type CustomerImportResult = {
  created: number;
  updated: number;
  errors: Array<{ line: number; message: string }>;
};

export type DocumentSource = "UPLOAD" | "EXTERNAL";
export type DocumentType = "CONTRACT" | "INSPECTIE" | "BEHANDELPLAN" | "RAPPORT" | "OVERIG";
export type DocumentStatus = "ACTIVE" | "ARCHIVED";

export type Document = {
  id: string;
  customerId: string;
  title: string;
  documentType: DocumentType;
  source: DocumentSource;
  fileUrl?: string | null;
  status: DocumentStatus;
  createdAt: string;
  archivedAt?: string | null;
  createdById?: string | null;
};

export type DocumentListResponse = {
  items: Document[];
  total: number;
  page: number;
  pageSize: number;
};

export type InspectionWithUser = Inspection & {
  inspector: { id: string; email: string };
};

export type BoardColumn = {
  id: string;
  boardId: string;
  name: string;
  position: number;
};

export type BoardLabel = {
  id: string;
  boardId: string;
  name: string;
  color?: string | null;
};

export type Board = {
  id: string;
  organisationId: string;
  projectId?: string | null;
  name: string;
  columns: BoardColumn[];
  labels: BoardLabel[];
  createdAt: string;
  updatedAt: string;
};

export type KanbanChecklistItem = {
  id: string;
  taskId: string;
  text: string;
  done: boolean;
  position: number;
  doneAt?: string | null;
};

export type KanbanAttachment = {
  id: string;
  taskId: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  ocrPayload?: Record<string, unknown> | null;
  createdAt: string;
};

export type KanbanComment = {
  id: string;
  taskId: string;
  author: { id: string; email: string; role: Role };
  body: string;
  createdAt: string;
};

export type KanbanTask = {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description?: string | null;
  status: "open" | "in_progress" | "done";
  priority?: string | null;
  dueDate?: string | null;
  assignee?: { id: string; email: string; role: Role } | null;
  labels: Array<{ label: BoardLabel }>;
  checklist: KanbanChecklistItem[];
  attachments: KanbanAttachment[];
  comments: KanbanComment[];
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
  recurrence?: { id: string; rule: string; nextOccurrence: string | null; active: boolean } | null;
};

export const api = {
  login(email: string, password: string) {
    return request<{ accessToken: string; refreshToken?: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  register(email: string, password: string) {
    return request<{ message: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  me() {
    return request<AuthUser>("/auth/me", { method: "GET" });
  },
  googleStatus() {
    return request<GoogleStatus>("/google/status", { method: "GET" });
  },
  googleAuth(returnTo?: string) {
    const search = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : "";
    return request<{ url: string }>(`/google/auth${search}`, { method: "GET" });
  },
  passwordResetRequest(email: string) {
    return request<{ message: string }>("/auth/password/forgot", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
  passwordResetConfirm(token: string, password: string) {
    return request<{ message: string }>("/auth/password/reset", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
  },
  assistantMessage(message: string, options: { channel?: string } = {}) {
    const payload =
      options.channel && options.channel.trim().length > 0
        ? { message, channel: options.channel }
        : { message };
    return request<AssistantReply>("/assistant/message", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  remindersList() {
    return request<Reminder[]>("/reminders", { method: "GET" });
  },
  remindersCreate(text: string, remindAt: string) {
    return request<Reminder>("/reminders", {
      method: "POST",
      body: JSON.stringify({ text, remindAt }),
    });
  },
  remindersDelete(reminderId: string) {
    return request<void>(`/reminders/${reminderId}`, { method: "DELETE" });
  },
  teamList() {
    return request<TeamMember[]>("/team/members", { method: "GET" });
  },
  teamInvite(email: string, role: Role = "MEDEWERKER") {
    return request<TeamMember>("/team/invite", {
      method: "POST",
      body: JSON.stringify({ email, role }),
    });
  },
  teamUpdateRole(userId: string, role: Role) {
    return request<TeamMember>(`/team/members/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  },
  teamRemove(userId: string) {
    return request<void>(`/team/members/${userId}`, { method: "DELETE" });
  },
  availabilityList(userId?: string) {
    const suffix = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    return request<AvailabilityEntry[]>(`/availability${suffix}`, { method: "GET" });
  },
  availabilityUpsert(payload: { userId?: string; entries: AvailabilityPayloadEntry[] }) {
    return request<AvailabilityEntry[]>("/availability", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  planningSuggest(payload: {
    date: string;
    startTime: string;
    endTime: string;
    location?: string;
    preferredUserIds?: string[];
  }) {
    return request<PlanningSuggestion[]>("/planning/suggest", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  timeAdd(payload: { date: string; startTime: string; endTime: string; projectId?: string }) {
    return request<TimeEntry>("/time/add", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  timeListMine(params?: { from?: string; to?: string; approved?: boolean }) {
    const search = new URLSearchParams();
    if (params?.from) search.set("from", params.from);
    if (params?.to) search.set("to", params.to);
    if (params?.approved !== undefined) search.set("approved", String(params.approved));
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<TimeEntry[]>(`/time/me${suffix}`, { method: "GET" });
  },
  timeListAll(params?: { from?: string; to?: string; approved?: boolean }) {
    const search = new URLSearchParams();
    if (params?.from) search.set("from", params.from);
    if (params?.to) search.set("to", params.to);
    if (params?.approved !== undefined) search.set("approved", String(params.approved));
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<TimeEntryWithUser[]>(`/time/all${suffix}`, { method: "GET" });
  },
  timeApprove(entryId: string, approve = true) {
    const path = approve ? `/time/${entryId}/approve` : `/time/${entryId}/reject`;
    return request<TimeEntry>(path, { method: "POST" });
  },
  tripsListMine(params?: { from?: string; to?: string; approved?: boolean }) {
    const search = new URLSearchParams();
    if (params?.from) search.set("from", params.from);
    if (params?.to) search.set("to", params.to);
    if (params?.approved !== undefined) search.set("approved", String(params.approved));
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<Trip[]>(`/trips/me${suffix}`, { method: "GET" });
  },
  tripsListPending(params?: { from?: string; to?: string }) {
    const search = new URLSearchParams();
    if (params?.from) search.set("from", params.from);
    if (params?.to) search.set("to", params.to);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<TripWithUser[]>(`/trips/pending${suffix}`, { method: "GET" });
  },
  tripsCreate(payload: { date: string; from: string; to: string; distanceKm: number }) {
    return request<Trip>("/trips", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  tripsApprove(tripId: string, approve = true) {
    const path = approve ? `/trips/${tripId}/approve` : `/trips/${tripId}/reject`;
    return request<Trip>(path, { method: "POST" });
  },
  expensesCreate(payload: { date: string; amount: number; category: string; receiptUrl?: string }) {
    return request<Expense>("/expenses", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  expensesListMine(params?: { from?: string; to?: string; status?: string }) {
    const search = new URLSearchParams();
    if (params?.from) search.set("from", params.from);
    if (params?.to) search.set("to", params.to);
    if (params?.status) search.set("status", params.status);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<Expense[]>(`/expenses/me${suffix}`, { method: "GET" });
  },
  expensesListPending(params?: { from?: string; to?: string; status?: string }) {
    const search = new URLSearchParams();
    if (params?.from) search.set("from", params.from);
    if (params?.to) search.set("to", params.to);
    if (params?.status) search.set("status", params.status);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<ExpenseWithUser[]>(`/expenses/pending${suffix}`, { method: "GET" });
  },
  expensesApprove(expenseId: string, approve = true) {
    const path = approve ? `/expenses/${expenseId}/approve` : `/expenses/${expenseId}/reject`;
    return request<Expense>(path, { method: "POST" });
  },
  expensesUploadReceipt(expenseId: string, base64?: string) {
    return request<{ receiptUrl: string; recognizedAmount: number; ocrSummary: string }>(
      `/expenses/${expenseId}/upload`,
      {
        method: "POST",
        body: JSON.stringify({ base64 }),
      },
    );
  },
  invoicesListMine() {
    return request<Invoice[]>("/invoices/me", { method: "GET" });
  },
  invoicesListAll() {
    return request<InvoiceWithUser[]>("/invoices/all", { method: "GET" });
  },
  invoicesCreate(payload: { customer: string; date: string; totalEx: number; totalInc: number }) {
    return request<Invoice>("/invoices", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  invoicesUpdateStatus(invoiceId: string, status: "draft" | "sent" | "paid") {
    return request<Invoice>(`/invoices/${invoiceId}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
  },
  invoicesGeneratePdf(invoiceId: string) {
    return request<{ pdfUrl: string }>(`/invoices/${invoiceId}/generate`, { method: "POST" });
  },
  invoicesSend(invoiceId: string, payload: { recipientEmail: string; subject?: string }) {
    return request<{ sent: boolean; pdfUrl: string }>(`/invoices/${invoiceId}/send`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  leaveRequest(payload: { startDate: string; endDate: string; type: string; note?: string }) {
    return request<LeaveRequest>("/leave/request", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  leaveListMine(params?: { from?: string; to?: string; status?: string }) {
    const search = new URLSearchParams();
    if (params?.from) search.set("from", params.from);
    if (params?.to) search.set("to", params.to);
    if (params?.status) search.set("status", params.status);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<LeaveRequest[]>(`/leave/mine${suffix}`, { method: "GET" });
  },
  leaveListPending(params?: { from?: string; to?: string; status?: string }) {
    const search = new URLSearchParams();
    if (params?.from) search.set("from", params.from);
    if (params?.to) search.set("to", params.to);
    if (params?.status) search.set("status", params.status);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<LeaveRequestWithUser[]>(`/leave/pending${suffix}`, { method: "GET" });
  },
  leaveApprove(requestId: string, approve = true) {
    const path = approve ? `/leave/${requestId}/approve` : `/leave/${requestId}/deny`;
    return request<LeaveRequest>(path, { method: "POST" });
  },
  inspectionsList(params?: { from?: string; to?: string; location?: string }) {
    const search = new URLSearchParams();
    if (params?.from) search.set("from", params.from);
    if (params?.to) search.set("to", params.to);
    if (params?.location) search.set("location", params.location);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<InspectionWithUser[]>(`/inspections${suffix}`, { method: "GET" });
  },
  inspectionsCreate(payload: {
    location: string;
    date: string;
    notes?: string;
    items: Array<{ description: string; score: number; notes?: string }>;
  }) {
    return request<Inspection>("/inspections", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  inspectionsGeneratePdf(id: string) {
    return request<{ pdfUrl: string }>(`/inspections/${id}/generate-pdf`, { method: "POST" });
  },
  inspectionsSendReport(
    id: string,
    payload: { recipientEmail: string; subject?: string; message?: string },
  ) {
    return request<{ sent: boolean; pdfUrl: string }>(`/inspections/${id}/send-report`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  boardsList(params?: { orgId?: string; projectId?: string }) {
    const search = new URLSearchParams();
    if (params?.orgId) search.set("orgId", params.orgId);
    if (params?.projectId) search.set("projectId", params.projectId);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<Board[]>(`/boards${suffix}`, { method: "GET" });
  },
  boardsGet(boardId: string) {
    return request<Board>(`/boards/${boardId}`, { method: "GET" });
  },
  boardsCreate(payload: { organisationId: string; name: string; projectId?: string | null }) {
    return request<Board>("/boards", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  boardsUpdate(boardId: string, payload: { name?: string }) {
    return request<Board>(`/boards/${boardId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  boardsDelete(boardId: string) {
    return request<void>(`/boards/${boardId}`, { method: "DELETE" });
  },
  columnsCreate(boardId: string, payload: { name: string; position: number }) {
    return request<BoardColumn>(`/boards/${boardId}/columns`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  columnsUpdate(columnId: string, payload: { name?: string; position?: number }) {
    return request<BoardColumn>(`/columns/${columnId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  columnsDelete(columnId: string) {
    return request<void>(`/columns/${columnId}`, { method: "DELETE" });
  },
  boardTasksList(
    boardId: string,
    params?: { assigneeId?: string; status?: "open" | "in_progress" | "done"; labelId?: string; dueBefore?: string },
  ) {
    const search = new URLSearchParams();
    if (params?.assigneeId) search.set("assigneeId", params.assigneeId);
    if (params?.status) search.set("status", params.status);
    if (params?.labelId) search.set("labelId", params.labelId);
    if (params?.dueBefore) search.set("dueBefore", params.dueBefore);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<KanbanTask[]>(`/boards/${boardId}/tasks${suffix}`, { method: "GET" });
  },
  boardTasksCreate(
    boardId: string,
    payload: {
      columnId: string;
      title: string;
      description?: string;
      status?: "open" | "in_progress" | "done";
      priority?: "low" | "normal" | "high" | "urgent";
      dueDate?: string;
      assigneeId?: string;
      labelIds?: string[];
    },
  ) {
    return request<KanbanTask>(`/boards/${boardId}/tasks`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  boardTasksUpdate(
    boardId: string,
    taskId: string,
    payload: {
      columnId?: string;
      title?: string;
      description?: string | null;
      status?: "open" | "in_progress" | "done";
      priority?: "low" | "normal" | "high" | "urgent";
      dueDate?: string | null;
      assigneeId?: string | null;
      labelIds?: string[];
    },
  ) {
    return request<KanbanTask>(`/boards/${boardId}/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  boardTasksDelete(boardId: string, taskId: string) {
    return request<void>(`/boards/${boardId}/tasks/${taskId}`, { method: "DELETE" });
  },
  boardTasksClose(taskId: string) {
    return request<KanbanTask>(`/tasks/${taskId}/close`, { method: "POST" });
  },
  boardTasksReopen(taskId: string) {
    return request<KanbanTask>(`/tasks/${taskId}/reopen`, { method: "POST" });
  },
  tasksSummary(taskId: string) {
    return request<{ summary: string }>(`/tasks/${taskId}/summary`, { method: "GET" });
  },
  tasksSetRecurrence(taskId: string, rule: string) {
    return request<{ id: string; rule: string; nextOccurrence: string | null }>(
      `/tasks/${taskId}/recurrence`,
      {
        method: "POST",
        body: JSON.stringify({ rule }),
      },
    );
  },
  tasksRemoveRecurrence(recurrenceId: string) {
    return request<{ success: boolean }>(`/recurrence/${recurrenceId}`, { method: "DELETE" });
  },
  tasksRunOcr(taskId: string) {
    return request<{ ocrPayload: Record<string, unknown> }>(`/tasks/${taskId}/attachments/ocr`, {
      method: "POST",
    });
  },
  customersList(params?: {
    q?: string;
    city?: string;
    email?: string;
    page?: number;
    pageSize?: number;
    sort?: "createdAt" | "lastName" | "companyName";
    dir?: "asc" | "desc";
    archived?: "only" | "exclude" | "include";
  }) {
    const search = new URLSearchParams();
    if (params?.q) search.set("q", params.q);
    if (params?.city) search.set("city", params.city);
    if (params?.email) search.set("email", params.email);
    if (params?.page) search.set("page", String(params.page));
    if (params?.pageSize) search.set("pageSize", String(params.pageSize));
    if (params?.sort) search.set("sort", params.sort);
    if (params?.dir) search.set("dir", params.dir);
    if (params?.archived) search.set("archived", params.archived);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<CustomerListResponse>(`/customers${suffix}`, { method: "GET" });
  },
  customersGet(id: string) {
    return request<Customer>(`/customers/${id}`, { method: "GET" });
  },
  customersCreate(payload: {
    companyName?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    street?: string;
    houseNumber?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    kvkNumber?: string;
    vatNumber?: string;
  }) {
    return request<Customer>("/customers", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  customersUpdate(
    id: string,
    payload: Partial<{
      companyName?: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      street?: string;
      houseNumber?: string;
      postalCode?: string;
      city?: string;
      country?: string;
      kvkNumber?: string;
      vatNumber?: string;
    }>,
  ) {
    return request<Customer>(`/customers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  customersArchive(id: string) {
    return request<void>(`/customers/${id}`, { method: "DELETE" });
  },
  customersRestore(id: string) {
    return request<Customer>(`/customers/${id}/restore`, { method: "POST" });
  },
  customersImportCsv(payload: { file?: File; data?: string }) {
    const form = new FormData();
    if (payload.file) {
      form.append("file", payload.file);
    } else if (payload.data) {
      form.append("data", payload.data);
    }
    return request<CustomerImportResult>("/customers/import/csv", {
      method: "POST",
      body: form,
    });
  },
  documentsList(customerId: string, params?: { page?: number; pageSize?: number; status?: "ACTIVE" | "ARCHIVED" | "ALL" }) {
    const search = new URLSearchParams();
    if (params?.page) search.set("page", String(params.page));
    if (params?.pageSize) search.set("pageSize", String(params.pageSize));
    if (params?.status) search.set("status", params.status);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<DocumentListResponse>(`/documents/customer/${customerId}${suffix}`, { method: "GET" });
  },
  documentsUpload(
    customerId: string,
    payload: { file: File; title?: string; documentType?: DocumentType },
  ) {
    const formData = new FormData();
    formData.append("file", payload.file);
    if (payload.title) formData.append("title", payload.title);
    if (payload.documentType) formData.append("documentType", payload.documentType);
    return request<Document>(`/documents/${customerId}/upload`, {
      method: "POST",
      body: formData,
    });
  },
  documentsExternal(
    customerId: string,
    payload: { title: string; fileUrl: string; documentType?: DocumentType },
  ) {
    return request<Document>(`/documents/${customerId}/external`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  documentsArchive(documentId: string) {
    return request<Document>(`/documents/${documentId}/archive`, { method: "POST" });
  },
  documentsRestore(documentId: string) {
    return request<Document>(`/documents/${documentId}/restore`, { method: "POST" });
  },
  async documentsDownload(documentId: string): Promise<Blob> {
    const res = await fetch(`${API_BASE}/documents/${documentId}/file`, {
      method: "GET",
      headers: {
        ...authHeaders(),
      },
      credentials: "include",
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
    }
    return res.blob();
  },
};
