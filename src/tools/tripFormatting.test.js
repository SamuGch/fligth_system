import assert from "node:assert/strict";
import test from "node:test";
import { canDownloadTicket } from "./tripFormatting.js";

test("solo permite boletos de reservas confirmadas o completadas", () => {
  for (const status of ["CONFIRMADA", "CONFIRMADO", "COMPLETADA", "COMPLETADO"]) {
    assert.equal(canDownloadTicket({ estado_resumen: status }), true, status);
  }

  for (const status of [
    "EXPIRADA",
    "EXPIRADO",
    "CANCELADA",
    "PENDIENTE_PAGO",
    "PAGO_EN_REVISION",
    "PENDIENTE_DATOS",
    "PENDIENTE_CONFIRMACION",
    "PENDIENTE_CANCELACION",
    "DESCONOCIDO",
  ]) {
    assert.equal(canDownloadTicket({ estado_resumen: status }), false, status);
  }
  assert.equal(canDownloadTicket(null), false);
  assert.equal(canDownloadTicket({}), false);
});

test("bloquea boletos cuando hay datos de pago o reserva contradictorios", () => {
  const confirmed = { estado_resumen: "CONFIRMADA" };
  for (const extra of [
    { estado_reserva: "EXPIRADA" },
    { debe_registrar_pago: true },
    { pago_completo: false },
    { saldo_pendiente: 10 },
    { debe_confirmar_datos: true },
    { pago: { estado: "PENDIENTE" } },
    { pago: { estado: "RECHAZADO" } },
  ]) {
    assert.equal(canDownloadTicket({ ...confirmed, ...extra }), false);
  }
  assert.equal(canDownloadTicket({
    ...confirmed,
    estado_reserva: "CONFIRMADA",
    pago_completo: true,
    saldo_pendiente: 0,
    pago: { estado: "APROBADO" },
  }), true);
});
