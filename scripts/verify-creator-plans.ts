/**
 * Verificación rápida de tasas PAYG / FLAT.
 * Uso: npx tsx scripts/verify-creator-plans.ts
 */
import { splitSaleCommissions } from "../src/lib/commerce/split";
import { ratesForCreatorPlan, resolveEffectiveCreatorPlan } from "../src/lib/commerce/creator-plans";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const sale = 100;
const creatorId = "creator";
const inviterId = "friend";
const platformId = "admin";

{
  const plan = ratesForCreatorPlan("payg");
  const withInvite = splitSaleCommissions({
    saleAmount: sale,
    creatorId,
    inviterId,
    platformUserId: platformId,
    plan,
  });
  const fee = withInvite.find((l) => l.type === "PLATFORM_FEE")!;
  const creator = withInvite.find((l) => l.type === "CREATOR_SALE")!;
  const invite = withInvite.find((l) => l.type === "INVITE")!;
  assert(fee.amountCents === 700, `PAYG fee expected 700 got ${fee.amountCents}`);
  assert(creator.amountCents === 8800, `PAYG creator expected 8800 got ${creator.amountCents}`);
  assert(invite.amountCents === 500, `PAYG invite expected 500 got ${invite.amountCents}`);
  console.log("PAYG + invite OK", { fee: fee.amountCents, creator: creator.amountCents, invite: invite.amountCents });
}

{
  const plan = ratesForCreatorPlan("flat");
  const withInvite = splitSaleCommissions({
    saleAmount: sale,
    creatorId,
    inviterId,
    platformUserId: platformId,
    plan,
  });
  const fee = withInvite.find((l) => l.type === "PLATFORM_FEE")!;
  const creator = withInvite.find((l) => l.type === "CREATOR_SALE")!;
  assert(fee.amountCents === 0, `FLAT fee expected 0 got ${fee.amountCents}`);
  assert(creator.amountCents === 9500, `FLAT creator expected 9500 got ${creator.amountCents}`);
  console.log("FLAT + invite OK", { fee: fee.amountCents, creator: creator.amountCents });
}

{
  const future = new Date(Date.now() + 86400000);
  const past = new Date(Date.now() - 86400000);
  assert(resolveEffectiveCreatorPlan({ preferredPlan: "FLAT", planUntil: future }) === "flat", "active flat");
  assert(resolveEffectiveCreatorPlan({ preferredPlan: "FLAT", planUntil: past }) === "payg", "expired flat");
  assert(resolveEffectiveCreatorPlan({ preferredPlan: "PAYG", planUntil: future }) === "payg", "prefer payg");
  console.log("resolveEffectiveCreatorPlan OK");
}

console.log("All creator plan checks passed.");
