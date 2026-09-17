import { createNotification } from "@/lib/notifications";
import { formatMoney } from "@/lib/commerce/split";
import { fromCents } from "@/lib/money/cents";

export async function notifyAcademyCommissions(settled: {
  lines: { type: string; level: number; amountCents: number; beneficiaryId: string }[];
}) {
  const unilevel = settled.lines.filter((line) => line.type === "UNILEVEL" && line.amountCents > 0);
  await Promise.all(
    unilevel.map((line) =>
      createNotification({
        userId: line.beneficiaryId,
        type: "NEW_SALE",
        title: `Qlyk Academy · nivel ${line.level}`,
        body: `Un alumno de tu red se suscribió. Ganaste ${formatMoney(fromCents(line.amountCents))}.`,
        href: "/academy/red",
      }),
    ),
  );
}
