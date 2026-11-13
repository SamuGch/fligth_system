export function getAuthErrorMessage(error) {
  const message = error?.message || "";

  if (
    error?.code === "email_address_not_authorized" ||
    message.toLowerCase().includes("email address not authorized")
  ) {
    return "Supabase no autorizó el envío a este correo. El SMTP predeterminado solo envía a correos autorizados del equipo; configura un SMTP personalizado en Authentication > SMTP.";
  }

  if (
    error?.code === "over_email_send_rate_limit" ||
    message.toLowerCase().includes("email rate limit")
  ) {
    return "Se alcanzó el límite de envío de correos de Supabase. Espera e inténtalo más tarde o configura un SMTP personalizado.";
  }

  return message || "No fue posible completar la solicitud.";
}
