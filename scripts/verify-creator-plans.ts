import assert from "node:assert/strict";
import { ratesForCreatorPlan, resolveEffectiveCreatorPlan } from "../src/lib/commerce/creator-plans";
import { splitSaleCommissions } from "../src/lib/commerce/split";

const saleAmount = 100;

{
  const plan = ratesForCreatorPlan("payg");
  const lines = splitSaleCommissions({
    saleAmount,
    creatorId: "creator",
    plan,
  });
  const fee = lines.find((l) => l.type === "PLATFORM_FEE")!;
  const creator = lines.find((l) => l.type === "CREATOR_SALE")!;
  assert(!lines.some((l) => (l as { type: string }).type === "INVITE"), "no INVITE line");
  assert(fee.amountCents === 700, `PAYG fee expected 700 got ${fee.amountCents}`);
  assert(creator.amountCents === 9300, `PAYG creator expected 9300 got ${creator.amountCents}`);
  console.log("PAYG OK", { fee: fee.amountCents, creator: creator.amountCents });
}

{
  const plan = ratesForCreatorPlan("flat");
  const lines = splitSaleCommissions({
    saleAmount,
    creatorId: "creator",
    plan,
  });
  const fee = lines.find((l) => l.type === "PLATFORM_FEE")!;
  const creator = lines.find((l) => l.type === "CREATOR_SALE")!;
  assert(fee.amountCents === 0, `FLAT fee expected 0 got ${fee.amountCents}`);
  assert(creator.amountCents === 10000, `FLAT creator expected 10000 got ${creator.amountCents}`);
  console.log("FLAT OK", { fee: fee.amountCents, creator: creator.amountCents });
}

{
  const future = new Date(Date.now() + 86_400_000);
  const past = new Date(Date.now() - 86_400_000);
  assert(resolveEffectiveCreatorPlan({ preferredPlan: "FLAT", planUntil: future }) === "flat", "active flat");
  assert(resolveEffectiveCreatorPlan({ preferredPlan: "FLAT", planUntil: past }) === "payg", "expired flat");
  assert(resolveEffectiveCreatorPlan({ preferredPlan: "PAYG", planUntil: future }) === "payg", "prefer payg");
  console.log("resolveEffectiveCreatorPlan OK");
}

console.log("All creator plan checks passed.");
