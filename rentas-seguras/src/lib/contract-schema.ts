import { z } from "zod";
import {
  INMUEBLE_TIPOS,
  TIPOS_IDENTIFICACION,
  USOS_INMUEBLE,
} from "@/lib/constants";

const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{2,3}$/i;

const partySchema = z.object({
  nombre: z.string().trim().min(3, "Indica el nombre completo").max(160),
  rfc: z
    .string()
    .trim()
    .toUpperCase()
    .regex(rfcRegex, "RFC inválido (12 o 13 caracteres)"),
  domicilio: z.string().trim().min(8, "Indica el domicilio completo").max(400),
  tipoIdentificacion: z.enum(TIPOS_IDENTIFICACION),
  identificacion: z
    .string()
    .trim()
    .min(4, "Indica el número de identificación")
    .max(40),
});

export const contractFormSchema = z
  .object({
    arrendador: partySchema,
    arrendatario: partySchema,
    inmueble: z.object({
      direccion: z
        .string()
        .trim()
        .min(10, "Indica la dirección completa del inmueble")
        .max(400),
      tipo: z.enum(INMUEBLE_TIPOS),
      uso: z.enum(USOS_INMUEBLE),
      descripcion: z
        .string()
        .trim()
        .min(20, "Describe el inmueble (recámaras, amenidades, estado)")
        .max(2000),
    }),
    condiciones: z.object({
      rentaMensualMxn: z.coerce
        .number({ invalid_type_error: "La renta debe ser un número" })
        .positive("La renta debe ser mayor a cero")
        .max(10_000_000, "Verifica el monto de renta"),
      fianzaDepositoMxn: z.coerce
        .number({ invalid_type_error: "La fianza debe ser un número" })
        .min(0, "La fianza no puede ser negativa")
        .max(10_000_000, "Verifica el monto de fianza"),
      vigenciaInicio: z.string().min(1, "Indica la fecha de inicio"),
      vigenciaFin: z.string().min(1, "Indica la fecha de término"),
      diaPago: z.coerce
        .number({ invalid_type_error: "El día de pago debe ser un número" })
        .int()
        .min(1, "El día de pago va de 1 a 28")
        .max(28, "Usa un día entre 1 y 28 para evitar meses cortos"),
      serviciosIncluidos: z
        .string()
        .trim()
        .min(3, "Lista los servicios incluidos o escribe “Ninguno”")
        .max(1000),
      clausulasExtra: z.string().trim().max(4000).optional().default(""),
    }),
  })
  .refine(
    (value) =>
      new Date(value.condiciones.vigenciaFin) >
      new Date(value.condiciones.vigenciaInicio),
    {
      message: "La vigencia final debe ser posterior a la fecha de inicio",
      path: ["condiciones", "vigenciaFin"],
    }
  );

export type ContractFormInput = z.input<typeof contractFormSchema>;
export type ContractFormData = z.output<typeof contractFormSchema>;

export const emptyContractForm = (): ContractFormInput => ({
  arrendador: {
    nombre: "",
    rfc: "",
    domicilio: "",
    tipoIdentificacion: "Credencial para votar (INE)",
    identificacion: "",
  },
  arrendatario: {
    nombre: "",
    rfc: "",
    domicilio: "",
    tipoIdentificacion: "Credencial para votar (INE)",
    identificacion: "",
  },
  inmueble: {
    direccion: "",
    tipo: "Casa habitación",
    uso: "Habitacional",
    descripcion: "",
  },
  condiciones: {
    rentaMensualMxn: 0,
    fianzaDepositoMxn: 0,
    vigenciaInicio: "",
    vigenciaFin: "",
    diaPago: 5,
    serviciosIncluidos: "Ninguno. El arrendatario cubre luz, agua, gas e internet.",
    clausulasExtra: "",
  },
});
