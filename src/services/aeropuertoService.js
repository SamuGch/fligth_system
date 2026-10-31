
const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export async function obtenerAeropuertos() {
  const response = await fetch(`${API_URL}/aeropuerto`);

  if (!response.ok) {
    throw new Error("No se pudieron obtener los aeropuertos.");
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("La API devolvió un formato de aeropuertos inválido.");
  }

  return data
    .filter((aeropuerto) => aeropuerto.activo === true)
    .map((aeropuerto) => ({
      id: aeropuerto.id,
      iata:
        aeropuerto.codigo_iata ??
        aeropuerto.codigoIata ??
        aeropuerto.code ??
        "",
      nombre: aeropuerto.nombre ?? aeropuerto.name ?? "",
      ciudad: aeropuerto.ciudad ?? aeropuerto.city ?? "",
      pais: aeropuerto.pais ?? aeropuerto.country ?? "",
    }))
    .sort((a, b) => a.ciudad.localeCompare(b.ciudad));
}