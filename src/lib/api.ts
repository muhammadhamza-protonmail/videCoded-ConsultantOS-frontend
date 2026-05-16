// Central API client for the ConsultantOS FastAPI backend
// All requests automatically attach the stored JWT token.

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

// ─── Token helpers ────────────────────────────────────────────────────────────
export const getToken = (): string | null =>
  typeof window !== "undefined" ? localStorage.getItem("cos_token") : null;

export const setToken = (token: string) => {
  localStorage.setItem("cos_token", token);
  // Also write a plain (non-httpOnly) cookie so middleware can read it server-side
  document.cookie = `cos_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
};

export const clearToken = () => {
  localStorage.removeItem("cos_token");
  document.cookie = "cos_token=; path=/; max-age=0; SameSite=Lax";
};

// ─── Typed interfaces matching backend schemas ────────────────────────────────
export interface User {
  id: number;
  username: string;
  email: string;
  role: "admin" | "consultant" | "client";
  is_active: boolean;
  created_at: string;
}

export interface FormTemplate {
  id: number;
  title: string;
  description?: string;
  schema_data: Record<string, unknown>;
  is_global: boolean;
  is_public?: boolean;
  share_code?: string | null;
  share_expires_at?: string | null;
  created_by?: number;
}

export interface Assignment {
  id: number;
  consultant_id: number;
  client_id: number;
  template_id: number;
  status: "not_started" | "in_progress" | "submitted" | "reviewed";
  form_data?: Record<string, unknown>;
  started_at?: string;
  submitted_at?: string;
  field_reviews?: Record<string, { ok: boolean; comment?: string }>;
  review_summary?: string;
  reviewed_at?: string;
  requires_changes?: boolean;
  case_id?: number | null;
  template?: FormTemplate;
  client?: User;
  case?: CaseItem | null;
}

export interface CaseItem {
  id: number;
  consultant_id: number;
  client_id: number;
  title: string;
  status: "open" | "closed" | "archived";
  created_at: string;
  updated_at?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface ConsultantSubscription {
  id: number;
  consultant_id: number;
  client_id: number;
  is_active: boolean;
  created_at: string;
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
export async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "1",
    ...(options.headers as Record<string, string>),
  };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  console.log(`[API] Fetching: ${path}`, options.method || "GET");
  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    console.log(`[API] Response: ${path}`, res.status);
    
    if (res.status === 401) {
      console.warn("[API] 401 Unauthorized - Clearing session");
      clearToken();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login?expired=true";
      }
      throw new Error("Session expired. Please log in again.");
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail ?? "Request failed");
    }
    if (res.status === 204) return undefined as T;
    return res.json() as T;
  } catch (err) {
    console.error(`[API] Error: ${path}`, err);
    throw err;
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: async (username: string, password: string): Promise<TokenResponse> => {
    const form = new URLSearchParams({ username, password });
    console.log("[AuthAPI] Fetching: /auth/login", "POST");
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/x-www-form-urlencoded",
          "ngrok-skip-browser-warning": "1"
        },
        body: form.toString(),
      });
      console.log("[AuthAPI] Response: /auth/login", res.status);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? "Login failed");
      }
      return res.json();
    } catch (err) {
      console.error("[AuthAPI] Error: /auth/login", err);
      throw err;
    }
  },

  register: (data: { username: string; email: string; password: string; role: string }) =>
    request<User>("/auth/register", { method: "POST", body: JSON.stringify(data) }, false),

  me: () => request<User>("/auth/me"),

  updateMe: (data: { email?: string; password?: string }) =>
    request<User>("/auth/me", { method: "PATCH", body: JSON.stringify(data) }),
  requestPasswordReset: (email: string) =>
    request<{ ok: boolean }>("/auth/password-reset/request", { method: "POST", body: JSON.stringify({ email }) }, false),
  confirmPasswordReset: (token: string, new_password: string) =>
    request<{ ok: boolean }>("/auth/password-reset/confirm", { method: "POST", body: JSON.stringify({ token, new_password }) }, false),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
  getUsers: () => request<User[]>("/admin/users"),
  toggleUserStatus: (userId: number) =>
    request<User>(`/admin/users/${userId}/status`, { method: "PATCH" }),
  getTemplates: () => request<FormTemplate[]>("/admin/templates"),
};

// ─── Consultant ───────────────────────────────────────────────────────────────
export const consultantApi = {
  getClients: () => request<User[]>("/consultant/clients"),
  getTemplates: () => request<FormTemplate[]>("/consultant/templates"),
  getTemplateById: (id: number) => request<FormTemplate>(`/consultant/templates/${id}`),
  createTemplate: (data: Omit<FormTemplate, "id" | "created_by">) =>
    request<FormTemplate>("/consultant/templates", { method: "POST", body: JSON.stringify(data) }),
  updateTemplate: (id: number, data: Partial<FormTemplate>) =>
    request<FormTemplate>(`/consultant/templates/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteTemplate: (id: number) =>
    request<void>(`/consultant/templates/${id}`, { method: "DELETE" }),
  getAssignments: () => request<Assignment[]>("/consultant/assignments"),
  createAssignment: (data: { client_id: number; template_id: number }) =>
    request<Assignment>("/consultant/assignments", { method: "POST", body: JSON.stringify(data) }),
  assignTemplateToStudents: (templateId: number, clientIds: number[]) =>
    request<Assignment[]>(`/consultant/templates/${templateId}/assign`, { method: "POST", body: JSON.stringify(clientIds) }),
  getCases: (clientId?: number) =>
    request<CaseItem[]>(`/consultant/cases${clientId ? `?client_id=${clientId}` : ""}`),
  createCase: (data: { client_id: number; title: string; status?: "open" | "closed" | "archived" }) =>
    request<CaseItem>("/consultant/cases", { method: "POST", body: JSON.stringify(data) }),
  assignAssignmentCase: (assignmentId: number, data: { case_id?: number | null; new_case_title?: string }) =>
    request<Assignment>(`/consultant/assignments/${assignmentId}/case`, { method: "PATCH", body: JSON.stringify(data) }),
  updateShareSettings: (templateId: number, data: { is_public: boolean; share_expires_at?: string | null }) =>
    request<FormTemplate>(`/consultant/templates/${templateId}/share`, { method: "PATCH", body: JSON.stringify(data) }),
  reviewAssignment: (assignmentId: number, data: { field_reviews: Record<string, { ok: boolean; comment?: string }>; review_summary?: string; requires_changes: boolean }) =>
    request<Assignment>(`/consultant/assignments/${assignmentId}/review`, { method: "PATCH", body: JSON.stringify(data) }),
  getAssignmentFiles: (assignmentId: number) =>
    request<{ files: Array<{ field_id: string; name?: string; file_path: string; url: string }> }>(`/consultant/assignments/${assignmentId}/files`),
};

export async function uploadPublicFile(shareCode: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/public/forms/${shareCode}/upload`, {
    method: "POST",
    headers: {
      "ngrok-skip-browser-warning": "1"
    },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail || "Upload failed");
  }
  return res.json();
}

// ─── Client ───────────────────────────────────────────────────────────────────
export const clientApi = {
  getMyAssignments: () => request<Assignment[]>("/client/assignments"),
  getAssignment: (id: number) => request<Assignment>(`/client/assignments/${id}`),
  startAssignment: (id: number) =>
    request<Assignment>(`/client/assignments/${id}/start`, { method: "PATCH" }),
  submitAssignment: (id: number, form_data: Record<string, unknown>) =>
    request<Assignment>(`/client/assignments/${id}/submit`, {
      method: "POST",
      body: JSON.stringify(form_data),
    }),
  uploadFieldFile: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return fetch(`${API_BASE}/client/upload-field-file`, {
      method: "POST",
      headers: (() => {
        const token = getToken();
        const baseHeaders: Record<string, string> = { "ngrok-skip-browser-warning": "1" };
        return token ? { ...baseHeaders, Authorization: `Bearer ${token}` } : baseHeaders;
      })(),
      body: form,
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Upload failed" }));
        throw new Error(err.detail || "Upload failed");
      }
      return res.json();
    });
  },
  getConsultants: () => request<User[]>("/client/consultants"),
  getSubscriptions: () => request<ConsultantSubscription[]>("/client/subscriptions"),
  subscribeToConsultant: (consultantId: number) =>
    request<ConsultantSubscription>(`/client/subscriptions/${consultantId}`, { method: "POST" }),
  unsubscribeFromConsultant: (consultantId: number) =>
    request<{ ok: boolean }>(`/client/subscriptions/${consultantId}`, { method: "DELETE" }),
};
