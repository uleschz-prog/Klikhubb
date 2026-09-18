import { contractFormSchema, emptyContractForm } from "../src/lib/contract-schema";

const valid = {
  arrendador: {
    nombre: "María Elena López García",
    rfc: "LOGM800101ABC",
    domicilio: "Calle Juárez 120, Col. Centro, Pachuca, Hidalgo",
    tipoIdentificacion: "Credencial para votar (INE)" as const,
    identificacion: "HIDA1234567890",
  },
  arrendatario: {
    nombre: "Juan Pérez Hernández",
    rfc: "PEHJ900202XYZ",
    domicilio: "Av. Revolución 45, Mineral de la Reforma, Hidalgo",
    tipoIdentificacion: "Pasaporte" as const,
    identificacion: "G12345678",
  },
  inmueble: {
    direccion:
      "Privada de los Pinos 8, Col. Periodistas, Pachuca de Soto, Hidalgo, C.P. 42060",
    tipo: "Departamento" as const,
    uso: "Habitacional" as const,
    descripcion:
      "Departamento de 2 recámaras, 1 baño, sala-comedor, cocina integral y un cajón de estacionamiento.",
  },
  condiciones: {
    rentaMensualMxn: 8500,
    fianzaDepositoMxn: 8500,
    vigenciaInicio: "2026-10-01",
    vigenciaFin: "2027-09-30",
    diaPago: 5,
    serviciosIncluidos: "Ninguno. El arrendatario cubre luz, agua, gas e internet.",
    clausulasExtra: "No se permiten mascotas sin autorización escrita.",
  },
};

const ok = contractFormSchema.safeParse(valid);
if (!ok.success) {
  console.error(ok.error.format());
  process.exit(1);
}

const empty = contractFormSchema.safeParse(emptyContractForm());
if (empty.success) {
  console.error("empty form should fail");
  process.exit(1);
}

console.log("contract-schema: ok");
