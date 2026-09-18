export const APP_NAME = "RentasSeguras MX";
export const CONTRACT_PRICE_MXN = 499;
export const CONTRACT_CURRENCY = "MXN" as const;
export const PAYMENT_COOKIE = "rs_mp_payment_id";
export const FORM_STORAGE_KEY = "rs_contract_form";
export const MARKDOWN_STORAGE_KEY = "rs_contract_markdown";

export const INMUEBLE_TIPOS = [
  "Casa habitación",
  "Departamento",
  "Vivienda en condominio",
  "Cuarto amueblado",
  "Casa en fraccionamiento",
] as const;

export const USOS_INMUEBLE = [
  "Habitacional",
  "Habitacional con home office",
  "Habitacional mixto (con autorización expresa)",
] as const;

export const TIPOS_IDENTIFICACION = [
  "Credencial para votar (INE)",
  "Pasaporte",
  "Cédula profesional",
  "Cartilla del servicio militar",
] as const;
