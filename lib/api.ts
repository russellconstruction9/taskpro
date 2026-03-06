/**
 * Type-safe API client for TaskPro.
 * Wraps fetch with error handling and auth.
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    public data: Record<string, unknown>
  ) {
    super(data.error as string || `API Error ${status}`);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, data);
  }
  return res.json() as Promise<T>;
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | null | undefined>): string {
  const url = new URL(path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

export const api = {
  get<T>(path: string, params?: Record<string, string | number | boolean | null | undefined>): Promise<T> {
    return fetch(buildUrl(path, params), {
      credentials: "include",
    }).then((res) => handleResponse<T>(res));
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return fetch(path, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    }).then((res) => handleResponse<T>(res));
  },

  patch<T>(path: string, body?: unknown): Promise<T> {
    return fetch(path, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    }).then((res) => handleResponse<T>(res));
  },

  delete<T>(path: string): Promise<T> {
    return fetch(path, {
      method: "DELETE",
      credentials: "include",
    }).then((res) => handleResponse<T>(res));
  },

  uploadForm<T>(path: string, formData: FormData): Promise<T> {
    return fetch(path, {
      method: "POST",
      credentials: "include",
      body: formData,
    }).then((res) => handleResponse<T>(res));
  },
};

// ─── API Types ───────────────────────────────────────────────
export interface JobResponse {
  id: number;
  businessId: number;
  title: string;
  description: string | null;
  address: string | null;
  status: string;
  createdAt: string;
}

export interface TaskResponse {
  id: number;
  businessId: number;
  jobId: number;
  assignedTo: number | null;
  title: string;
  description: string | null;
  status: string;
  requiresPhoto: boolean;
  createdAt: string;
  completedAt: string | null;
  assigneeName: string | null;
  photoCount: number;
}

export interface WorkerResponse {
  id: number;
  fullName: string;
  role: string;
  email: string | null;
  hourlyRate: string;
  isActive: boolean;
  createdAt: string;
}

export interface TimeEntryResponse {
  id: number;
  businessId: number;
  profileId: number;
  taskId: number | null;
  clockIn: string;
  clockOut: string | null;
  workerName: string | null;
  hourlyRate: string | null;
}

export interface PhotoResponse {
  id: number;
  taskId: number;
  mimeType: string;
  fileSizeBytes: number | null;
  caption: string | null;
  createdAt: string;
}
