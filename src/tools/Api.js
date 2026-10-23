const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

async function procesarRespuesta(response) {
  if (!response.ok) {
    throw new Error(`Error en la solicitud: ${response.status}`);
  }

  if (response.status === 204) return null;

  return response.json();
}

export async function get(endpoint) {
  const response = await fetch(`${API_URL}${endpoint}`);
  return procesarRespuesta(response);
}

export async function post(endpoint, body) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  return procesarRespuesta(response);
}

export async function put(endpoint, body) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  return procesarRespuesta(response);
}