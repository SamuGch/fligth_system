import assert from "node:assert/strict";
import test from "node:test";
import { depositValidationError, isValidCardExpiration, nameValidationError, passengerValidationError } from "./formValidation.js";

const passenger = {
  nombre_pasajero: "María",
  apellido_pasajero: "Muñoz",
  tipo_documento: "DPI",
  numero_documento: "0123456789012",
};

test("valida nombres por longitud y caracteres, incluidos nombres compuestos", () => {
  for (const name of ["José", "Juan Carlos", "Á".repeat(20), "Jose\u0301"]) {
    assert.equal(nameValidationError(name), "", name);
  }
  for (const name of ["", "   ", "Ana", "A B", "A".repeat(21), "Juan1", "Juan-", "Juan  Carlos"]) {
    assert.notEqual(nameValidationError(name), "", name);
  }
});

test("valida DPI, pasaporte y tipos de documento", () => {
  assert.equal(passengerValidationError(passenger), "");
  for (const document of ["012345678901", "01234567890123", "012345678901A", "123 567890123"]) {
    assert.notEqual(passengerValidationError({ ...passenger, numero_documento: document }), "", document);
  }
  for (const document of ["123456", "1".repeat(20), "1234 5678"]) {
    assert.equal(passengerValidationError({ ...passenger, tipo_documento: "PASAPORTE", numero_documento: document }), "", document);
  }
  for (const document of ["12345", "1".repeat(21), "ABC-123", "ABC123"]) {
    assert.notEqual(passengerValidationError({ ...passenger, tipo_documento: "PASAPORTE", numero_documento: document }), "", document);
  }
  assert.notEqual(passengerValidationError({ ...passenger, tipo_documento: "OTRO" }), "");
  assert.notEqual(passengerValidationError({ ...passenger, apellido_pasajero: "A1" }), "");
});

test("valida importe y referencia del depósito", () => {
  assert.equal(depositValidationError("0.01", "BOLETA-BANRURAL-987654"), "");
  assert.equal(depositValidationError("999999999999.99", "12345678901234567890"), "");
  for (const amount of ["", "0", "-1", "1e2", "1.234", "1000000000000", ".5"]) {
    assert.notEqual(depositValidationError(amount, "REF-1"), "", amount);
  }
  for (const reference of ["", "REF 1", "REF/1", "1".repeat(21), "A".repeat(51)]) {
    assert.notEqual(depositValidationError("1", reference), "", reference);
  }
});

test("valida mes y vigencia de la tarjeta simulada", () => {
  const now = new Date(2026, 10, 14);
  for (const expiration of ["1126", "1226", "0127"]) {
    assert.equal(isValidCardExpiration(expiration, now), true, expiration);
  }
  for (const expiration of ["", "0027", "1327", "1026", "1225", "11/26"]) {
    assert.equal(isValidCardExpiration(expiration, now), false, expiration);
  }
});
