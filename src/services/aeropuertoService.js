
const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8080"
).replace(/\/$/, "");

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
      code: aeropuerto.codigoIata,
      name: aeropuerto.nombre,
      city: aeropuerto.ciudad,
      country: aeropuerto.pais,
    }))
    .sort((a, b) => a.city.localeCompare(b.city));
}