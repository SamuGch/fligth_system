
const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
let airportsRequest;

export async function obtenerAeropuertos() {
  if (airportsRequest) return airportsRequest;

  airportsRequest = (async () => {
    const response = await fetch(`${API_URL}/aeropuerto`);

    if (!response.ok) {
      throw new Error("No se pudieron obtener los aeropuertos.");
    }

    const responseData = await response.json();
    const data = Array.isArray(responseData)
      ? responseData
      : responseData?.data;

    if (!Array.isArray(data)) {
      throw new Error("La API devolvió un formato de aeropuertos inválido.");
    }

    return data
      .filter((aeropuerto) => aeropuerto.activo !== false)
      .map((aeropuerto) => ({
        id: aeropuerto.id ?? aeropuerto.aeropuertoId,
        code:
          aeropuerto.codigoIata ??
          aeropuerto.codigo_iata ??
          aeropuerto.code ??
          "",
        name: aeropuerto.nombre ?? aeropuerto.name ?? "",
        city: aeropuerto.ciudad ?? aeropuerto.city ?? "",
        country: aeropuerto.pais ?? aeropuerto.country ?? "",
      }))
      .sort((a, b) => a.city.localeCompare(b.city));
  })().catch((error) => {
    airportsRequest = undefined;
    throw error;
  });

  return airportsRequest;
}