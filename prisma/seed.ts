import { PrismaClient, CommissionType, RewardType, RoleCode } from "@prisma/client";
import { ensurePlatformAdmin } from "../src/lib/auth/ensure-admin";

const prisma = new PrismaClient();

async function main() {
  const plan = await prisma.compensationPlan.upsert({
    where: { code: "klikhubb-v1" },
    update: {
      name: "Qlyk Creator PAYG 7",
      maxUnilevelDepth: 1,
      binaryEnabled: false,
      platformFeeRate: 0.07,
      creatorRate: 0.88,
    },
    create: {
      code: "klikhubb-v1",
      name: "Qlyk Creator PAYG 7",
      maxUnilevelDepth: 1,
      binaryEnabled: false,
      platformFeeRate: 0.07,
      creatorRate: 0.88,
      holdDays: 14,
      isActive: true,
      levels: {
        create: [
          { level: 0, type: CommissionType.CREATOR_SALE, rate: 0.88 },
          { level: 1, type: CommissionType.DIRECT, rate: 0.05 },
        ],
      },
    },
  });

  // Sincroniza niveles del plan PAYG (88/7/5).
  await prisma.commissionLevel.deleteMany({ where: { planId: plan.id } });
  await prisma.commissionLevel.createMany({
    data: [
      { planId: plan.id, level: 0, type: CommissionType.CREATOR_SALE, rate: 0.88 },
      { planId: plan.id, level: 1, type: CommissionType.DIRECT, rate: 0.05 },
    ],
  });
  await prisma.compensationPlan.update({
    where: { id: plan.id },
    data: { holdDays: 14, isActive: true, platformFeeRate: 0.07, creatorRate: 0.88 },
  });

  const ranks = [
    { slug: "spark", name: "Spark", minPersonalVolume: 0, minGroupVolume: 0, minDirectRecruits: 0, sortOrder: 0 },
    { slug: "builder", name: "Builder", minPersonalVolume: 250, minGroupVolume: 0, minDirectRecruits: 0, sortOrder: 1 },
    { slug: "leader", name: "Leader", minPersonalVolume: 1000, minGroupVolume: 0, minDirectRecruits: 0, sortOrder: 2 },
    { slug: "elite", name: "Elite", minPersonalVolume: 2500, minGroupVolume: 0, minDirectRecruits: 0, sortOrder: 3 },
    { slug: "crown", name: "Crown", minPersonalVolume: 5000, minGroupVolume: 0, minDirectRecruits: 0, sortOrder: 4 },
  ];

  for (const rank of ranks) {
    await prisma.rank.upsert({
      where: { slug: rank.slug },
      update: rank,
      create: rank,
    });
  }

  const spark = await prisma.rank.findUniqueOrThrow({ where: { slug: "spark" } });
  const builder = await prisma.rank.findUniqueOrThrow({ where: { slug: "builder" } });

  const rewards = [
    {
      name: "Primer clic",
      description: "Publicaste o compraste por primera vez en Qlyk.",
      pointsCost: 0,
      rankId: spark.id,
      type: RewardType.BADGE,
    },
    {
      name: "Audiencia propia",
      description: "Vendiste y tu gente se quedó en tu comunidad.",
      pointsCost: null,
      rankId: builder.id,
      type: RewardType.BADGE,
    },
  ];

  for (const reward of rewards) {
    const existing = await prisma.reward.findFirst({ where: { name: reward.name } });
    if (!existing) {
      await prisma.reward.create({ data: reward });
    }
  }

  await ensurePlatformAdmin(prisma);

  console.log(`Seed OK — plan ${plan.code}. Solo configuración de plataforma (sin usuarios ni contenido ficticio).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
