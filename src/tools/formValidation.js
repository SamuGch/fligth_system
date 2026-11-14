export const NAME_MAX_LENGTH = 20;
export const DOCUMENT_MAX_LENGTH = 20;

export function normalizeDocumentNumber(value) {
  return value.trim().replace(/ /g, "");
}

export function formatDocumentNumber(value) {
  return value.replace(/(.{4})(?=.)/g, "$1 ");
}

export function filterNameInput(value) {
  return value.normalize("NFC").replace(/[^\p{L}\p{M} ]/gu, "");
}

export function normalizeName(value) {
  return value.trim().normalize("NFC");
}

export function nameValidationError(value, label = "El nombre") {
  const name = normalizeName(value);
  if (!name) return `${label} es obligatorio.`;
  if (name.length > NAME_MAX_LENGTH || !/^\p{L}+(?: \p{L}+)*$/u.test(name) ||
      [...name.replaceAll(" ", "")].length < 4) {
    return `${label} debe tener entre 4 y 20 letras; solo se permiten letras y espacios entre palabras.`;
  }
  return "";
}

export function passengerValidationError(passenger) {
  const nameError = nameValidationError(passenger.nombre_pasajero, "El nombre");
  if (nameError) return nameError;
  const surnameError = nameValidationError(passenger.apellido_pasajero, "El apellido");
  if (surnameError) return surnameError;
  const document = normalizeDocumentNumber(passenger.numero_documento);
  if (passenger.tipo_documento === "DPI") {
    return /^\d{13}$/.test(document) ? "" : "El DPI debe contener exactamente 13 dígitos.";
  }
  if (passenger.tipo_documento === "PASAPORTE") {
    return /^\d{6,20}$/.test(document)
      ? ""
      : "El pasaporte debe contener entre 6 y 20 dígitos.";
  }
  return "Selecciona DPI o pasaporte.";
}

export function depositValidationError(amount, reference) {
  if (!/^(?:\d{1,12})(?:\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
    return "El monto debe ser mayor que cero y tener hasta 12 dígitos enteros y 2 decimales.";
  }
  const trimmedReference = reference.trim();
  if (!/^[A-Za-z0-9-]+$/.test(trimmedReference) ||
      trimmedReference.length > 50 || (trimmedReference.match(/\d/g) || []).length > 20) {
    return "La referencia debe tener hasta 50 caracteres, solo letras, números y guiones, y como máximo 20 dígitos.";
  }
  return "";
}

export function isValidCardExpiration(value, now = new Date()) {
  if (!/^\d{4}$/.test(value)) return false;
  const month = Number(value.slice(0, 2));
  const year = 2000 + Number(value.slice(2));
  return month >= 1 && month <= 12 &&
    (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1));
}
