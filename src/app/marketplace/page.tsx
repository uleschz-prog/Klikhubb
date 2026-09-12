import { redirect } from "next/navigation";

/** El catálogo vive dentro de Tienda (/feed). */
export default function MarketplacePage() {
  redirect("/feed");
}
