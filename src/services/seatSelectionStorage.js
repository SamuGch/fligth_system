
const STORAGE_KEY = "airtravel_seat_selection";
const CHECKOUT_RETURN_SELECTION_KEY = "airtravel_checkout_return_seats";

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

export function guardarSeleccionParaCheckout(asientosPorVuelo) {
  sessionStorage.setItem(
    CHECKOUT_RETURN_SELECTION_KEY,
    JSON.stringify(asientosPorVuelo),
  );
}

export function obtenerSeleccionParaCheckout() {
  try {
    const stored = sessionStorage.getItem(CHECKOUT_RETURN_SELECTION_KEY);
    if (!stored) return null;

    sessionStorage.removeItem(CHECKOUT_RETURN_SELECTION_KEY);
    const selection = JSON.parse(stored);
    return selection && typeof selection === "object" ? selection : null;
  } catch (storageError) {
    console.error("No se pudieron recuperar los asientos guardados para checkout.", storageError);
    return null;
  }
}

export function limpiarSeleccionParaCheckout() {
  try {
    sessionStorage.removeItem(CHECKOUT_RETURN_SELECTION_KEY);
  } catch (storageError) {
    console.error("No se pudieron limpiar los asientos guardados para checkout.", storageError);
  }
}
