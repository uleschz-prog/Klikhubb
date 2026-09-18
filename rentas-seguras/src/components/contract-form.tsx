"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  INMUEBLE_TIPOS,
  TIPOS_IDENTIFICACION,
  USOS_INMUEBLE,
  FORM_STORAGE_KEY,
} from "@/lib/constants";
import {
  contractFormSchema,
  emptyContractForm,
  type ContractFormInput,
} from "@/lib/contract-schema";

type PartyKey = "arrendador" | "arrendatario";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-ink-800">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-ink-700/20 bg-white px-3 py-2 text-sm outline-none ring-cedar-600/30 focus:ring";

export function ContractForm() {
  const router = useRouter();
  const [form, setForm] = useState<ContractFormInput>(emptyContractForm);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(FORM_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as ContractFormInput;
      setForm({ ...emptyContractForm(), ...parsed });
    } catch {
      sessionStorage.removeItem(FORM_STORAGE_KEY);
    }
  }, []);

  function updateParty(
    party: PartyKey,
    field: keyof ContractFormInput["arrendador"],
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [party]: { ...current[party], [field]: value },
    }));
  }

  const errorList = useMemo(() => Object.values(errors).flat(), [errors]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    const parsed = contractFormSchema.safeParse(form);
    if (!parsed.success) {
      const nextErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".") || "form";
        nextErrors[key] = [...(nextErrors[key] ?? []), issue.message];
      }
      setErrors(nextErrors);
      setFormError("Revisa los campos marcados antes de continuar.");
      return;
    }
    sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(parsed.data));
    router.push("/contrato/resultado");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="paper-card rounded-2xl p-6">
        <p className="stamp text-[10px] text-cedar-700">1 · Partes</p>
        <h2 className="font-serif text-2xl">Arrendador</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Nombre completo">
            <input
              className={inputClass}
              value={form.arrendador.nombre}
              onChange={(event) =>
                updateParty("arrendador", "nombre", event.target.value)
              }
            />
          </Field>
          <Field label="RFC">
            <input
              className={inputClass}
              value={form.arrendador.rfc}
              onChange={(event) =>
                updateParty("arrendador", "rfc", event.target.value.toUpperCase())
              }
            />
          </Field>
          <Field label="Domicilio">
            <input
              className={inputClass}
              value={form.arrendador.domicilio}
              onChange={(event) =>
                updateParty("arrendador", "domicilio", event.target.value)
              }
            />
          </Field>
          <Field label="Identificación">
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                className={inputClass}
                value={form.arrendador.tipoIdentificacion}
                onChange={(event) =>
                  updateParty(
                    "arrendador",
                    "tipoIdentificacion",
                    event.target.value
                  )
                }
              >
                {TIPOS_IDENTIFICACION.map((tipo) => (
                  <option key={tipo}>{tipo}</option>
                ))}
              </select>
              <input
                className={inputClass}
                placeholder="Número"
                value={form.arrendador.identificacion}
                onChange={(event) =>
                  updateParty("arrendador", "identificacion", event.target.value)
                }
              />
            </div>
          </Field>
        </div>
      </section>

      <section className="paper-card rounded-2xl p-6">
        <p className="stamp text-[10px] text-cedar-700">2 · Partes</p>
        <h2 className="font-serif text-2xl">Arrendatario</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Nombre completo">
            <input
              className={inputClass}
              value={form.arrendatario.nombre}
              onChange={(event) =>
                updateParty("arrendatario", "nombre", event.target.value)
              }
            />
          </Field>
          <Field label="RFC">
            <input
              className={inputClass}
              value={form.arrendatario.rfc}
              onChange={(event) =>
                updateParty(
                  "arrendatario",
                  "rfc",
                  event.target.value.toUpperCase()
                )
              }
            />
          </Field>
          <Field label="Domicilio">
            <input
              className={inputClass}
              value={form.arrendatario.domicilio}
              onChange={(event) =>
                updateParty("arrendatario", "domicilio", event.target.value)
              }
            />
          </Field>
          <Field label="Identificación">
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                className={inputClass}
                value={form.arrendatario.tipoIdentificacion}
                onChange={(event) =>
                  updateParty(
                    "arrendatario",
                    "tipoIdentificacion",
                    event.target.value
                  )
                }
              >
                {TIPOS_IDENTIFICACION.map((tipo) => (
                  <option key={tipo}>{tipo}</option>
                ))}
              </select>
              <input
                className={inputClass}
                placeholder="Número"
                value={form.arrendatario.identificacion}
                onChange={(event) =>
                  updateParty(
                    "arrendatario",
                    "identificacion",
                    event.target.value
                  )
                }
              />
            </div>
          </Field>
        </div>
      </section>

      <section className="paper-card rounded-2xl p-6">
        <p className="stamp text-[10px] text-cedar-700">3 · Inmueble</p>
        <h2 className="font-serif text-2xl">Datos de la vivienda</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Dirección completa">
              <input
                className={inputClass}
                value={form.inmueble.direccion}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    inmueble: { ...current.inmueble, direccion: event.target.value },
                  }))
                }
              />
            </Field>
          </div>
          <Field label="Tipo">
            <select
              className={inputClass}
              value={form.inmueble.tipo}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  inmueble: { ...current.inmueble, tipo: event.target.value as typeof current.inmueble.tipo },
                }))
              }
            >
              {INMUEBLE_TIPOS.map((tipo) => (
                <option key={tipo}>{tipo}</option>
              ))}
            </select>
          </Field>
          <Field label="Uso">
            <select
              className={inputClass}
              value={form.inmueble.uso}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  inmueble: { ...current.inmueble, uso: event.target.value as typeof current.inmueble.uso },
                }))
              }
            >
              {USOS_INMUEBLE.map((uso) => (
                <option key={uso}>{uso}</option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Descripción">
              <textarea
                rows={4}
                className={inputClass}
                placeholder="Recámaras, baños, estacionamiento, estado de conservación, mobiliario…"
                value={form.inmueble.descripcion}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    inmueble: {
                      ...current.inmueble,
                      descripcion: event.target.value,
                    },
                  }))
                }
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="paper-card rounded-2xl p-6">
        <p className="stamp text-[10px] text-cedar-700">4 · Condiciones</p>
        <h2 className="font-serif text-2xl">Renta, fianza y vigencia</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Renta mensual (MXN)">
            <input
              type="number"
              min={1}
              step="1"
              className={inputClass}
              value={form.condiciones.rentaMensualMxn || ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  condiciones: {
                    ...current.condiciones,
                    rentaMensualMxn: Number(event.target.value),
                  },
                }))
              }
            />
          </Field>
          <Field label="Fianza / depósito (MXN)">
            <input
              type="number"
              min={0}
              step="1"
              className={inputClass}
              value={form.condiciones.fianzaDepositoMxn || ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  condiciones: {
                    ...current.condiciones,
                    fianzaDepositoMxn: Number(event.target.value),
                  },
                }))
              }
            />
          </Field>
          <Field label="Vigencia · inicio">
            <input
              type="date"
              className={inputClass}
              value={form.condiciones.vigenciaInicio}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  condiciones: {
                    ...current.condiciones,
                    vigenciaInicio: event.target.value,
                  },
                }))
              }
            />
          </Field>
          <Field label="Vigencia · fin">
            <input
              type="date"
              className={inputClass}
              value={form.condiciones.vigenciaFin}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  condiciones: {
                    ...current.condiciones,
                    vigenciaFin: event.target.value,
                  },
                }))
              }
            />
          </Field>
          <Field label="Día de pago (1–28)">
            <input
              type="number"
              min={1}
              max={28}
              className={inputClass}
              value={form.condiciones.diaPago}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  condiciones: {
                    ...current.condiciones,
                    diaPago: Number(event.target.value),
                  },
                }))
              }
            />
          </Field>
          <Field label="Servicios incluidos">
            <input
              className={inputClass}
              value={form.condiciones.serviciosIncluidos}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  condiciones: {
                    ...current.condiciones,
                    serviciosIncluidos: event.target.value,
                  },
                }))
              }
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Cláusulas extra (opcional)">
              <textarea
                rows={4}
                className={inputClass}
                placeholder="Mascotas, mantenimiento de jardín, reglamento del condominio, fiador…"
                value={form.condiciones.clausulasExtra ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    condiciones: {
                      ...current.condiciones,
                      clausulasExtra: event.target.value,
                    },
                  }))
                }
              />
            </Field>
          </div>
        </div>
      </section>

      {formError ? (
        <div className="rounded-xl bg-cedar-600/10 px-4 py-3 text-sm text-cedar-700">
          <p className="font-medium">{formError}</p>
          {errorList.length ? (
            <ul className="mt-2 list-disc pl-5">
              {errorList.slice(0, 6).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-700">
          El PDF se desbloquea al pagar <strong>$499.00 MXN</strong> con
          MercadoPago.
        </p>
        <button
          type="submit"
          className="rounded-full bg-cedar-600 px-6 py-2.5 font-medium text-paper-50 hover:bg-cedar-700"
        >
          Continuar al contrato
        </button>
      </div>
    </form>
  );
}
