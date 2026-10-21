
const STORAGE_KEY = "airtravel_seat_selection";

export function guardarSeleccion(vueloId, avionId, asientos) {
  if (vueloId == null || avionId == null) return;

  const data = {
    vueloId: String(vueloId),
    avionId: String(avionId),
    asientoIds: asientos.map((asiento) => asiento.databaseId),
    fechaGuardado: Date.now(),
  };

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function obtenerSeleccion(vueloId, avionId) {
  if (vueloId == null || avionId == null) return [];

  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);

    if (!saved) return [];

    const data = JSON.parse(saved);

    if (
      String(data.vueloId) !== String(vueloId) ||
      String(data.avionId) !== String(avionId)
    ) {
      return [];
    }

    if (!Array.isArray(data.asientoIds)) return [];

    return data.asientoIds;
  } catch {
    return [];
  }
}

export function limpiarSeleccion() {
  sessionStorage.removeItem(STORAGE_KEY);
}
