const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, { status = 0, code = "SERVER_ERROR" } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export const api = async (path, { method = "GET", body, signal } = {}) => {
  let response;

  try {
    response = await fetch(`${API_BASE}/api${path}`, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new ApiError("Network error", { code: "NETWORK" });
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.message || "Request failed", {
      status: response.status,
      code: data.code || (response.status === 401 ? "UNAUTHORIZED" : "SERVER_ERROR"),
    });
  }

  return data;
};
