import Link from "next/link";
import { CONTRACT_PRICE_MXN } from "@/lib/constants";
import { IntegrationStatus } from "@/components/integration-status";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <section className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="stamp text-xs text-cedar-700">
            Código Civil del Estado de Hidalgo
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-ink-950 sm:text-5xl">
            Contrato de arrendamiento residencial, completo y listo para firma.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-700">
            Captura las partes, el inmueble y las condiciones. Una abogada
            virtual especializada en Derecho Civil hidalguense redacta el
            instrumento. La descarga en PDF se libera al pagar{" "}
            <strong>${CONTRACT_PRICE_MXN}.00 MXN</strong> con MercadoPago.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/registro"
              className="rounded-full bg-cedar-600 px-6 py-3 font-medium text-paper-50 hover:bg-cedar-700"
            >
              Empezar por ${CONTRACT_PRICE_MXN} MXN
            </Link>
            <Link
              href="/iniciar-sesion"
              className="rounded-full border border-ink-700/20 px-6 py-3 font-medium hover:border-cedar-600"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>
        <div className="space-y-4">
          <aside className="paper-card rounded-3xl p-8">
            <p className="stamp text-[10px] text-moss-800">Incluye</p>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed">
              <li>Arrendador y arrendatario con RFC, domicilio e identificación.</li>
              <li>Vivienda: dirección, tipo, uso habitacional y descripción.</li>
              <li>Renta en MXN, fianza, vigencia, día de pago y servicios.</li>
              <li>Cláusulas al estilo del Código Civil de Hidalgo.</li>
              <li>Checkout MercadoPago por exactamente $499.00 MXN.</li>
            </ul>
          </aside>
          <IntegrationStatus />
        </div>
      </section>
    </div>
  );
}
