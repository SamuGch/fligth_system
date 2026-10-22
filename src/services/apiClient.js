import { supabase } from "../lib/supabase";

const apiBaseUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(path, options = {}) {
  const { accessToken, ...fetchOptions } = options;
  let token = accessToken;

  if (!token) {
    const { data } = await supabase.auth.getSession();
    token = data?.session?.access_token;
  }

  const headers = new Headers(fetchOptions.headers);
  headers.set("Accept", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (fetchOptions.body) headers.set("Content-Type", "application/json");

  let response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, { ...fetchOptions, headers });
  } catch {
    throw new ApiError("No fue posible conectar con el servidor.");
  }

  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  const payload = isJson ? await response.json() : null;
  if (!response.ok) {
    // A rejected/expired bearer token cannot authorize private screens. Let
    // Supabase clear its persisted session; AuthProvider reacts to the event.
    if (response.status === 401) await supabase.auth.signOut();
    throw new ApiError(
      payload?.message || payload?.error || "La solicitud no pudo completarse.",
      response.status,
    );
  }
  return payload?.data ?? payload;
}

export const syncClient = (accessToken) =>
  request("/clientes/sync", { method: "POST", accessToken });
export const getMyProfile = (accessToken) =>
  request("/clientes/me", { accessToken });
export const updateMyProfile = (profile) =>
  request("/clientes/me", { method: "PUT", body: JSON.stringify(profile) });
