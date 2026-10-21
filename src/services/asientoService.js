
const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

async function obtenerDatos(endpoint) {
  const response = await fetch(`${API_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error(`Error al consultar ${endpoint}: ${response.status}`);
  }

  return (await response.json()) ?? [];
}

export async function obtenerAsientosPorAvion(avionId) {
  const asientos = await obtenerDatos("/asiento");

  return asientos.filter(
    (asiento) => Number(asiento.avionId) === Number(avionId)
  );
}

export async function obtenerTiposAsiento() {
  return obtenerDatos("/tipo-asiento");
}
