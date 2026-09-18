import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="font-serif text-4xl">Página no encontrada</h1>
      <p className="mt-3 text-ink-700">Ese recuadro no existe en RentasSeguras MX.</p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-full bg-cedar-600 px-5 py-2 text-paper-50"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
