import { PrismaClient, CommissionType, RewardType, ProductType, ProductStatus, RoleCode } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DEMO_PASSWORD = "KlikHubb2026!";

async function main() {
  const plan = await prisma.compensationPlan.upsert({
    where: { code: "klikhubb-v1" },
    update: {
      name: "KlikHubb Creator 80",
      maxUnilevelDepth: 1,
      binaryEnabled: false,
      platformFeeRate: 0.1,
      creatorRate: 0.8,
    },
    create: {
      code: "klikhubb-v1",
      name: "KlikHubb Creator 80",
      maxUnilevelDepth: 1,
      binaryEnabled: false,
      platformFeeRate: 0.1,
      creatorRate: 0.8,
      holdDays: 14,
      isActive: true,
      levels: {
        create: [
          { level: 0, type: CommissionType.CREATOR_SALE, rate: 0.8 },
          { level: 1, type: CommissionType.DIRECT, rate: 0.1 },
        ],
      },
    },
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
      description: "Publicaste o compraste por primera vez en KlikHubb.",
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

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const maya = await ensureUser({
    email: "maya@klikhubb.dev",
    displayName: "Maya Chen",
    username: "mayaclose",
    referralCode: "MAYA",
    roles: [RoleCode.CREATOR, RoleCode.STUDENT],
    passwordHash,
  });
  await ensureUser({
    email: "platform@klikhubb.internal",
    displayName: "KlikHubb",
    username: "platform",
    referralCode: "PLATFORM",
    roles: [RoleCode.ADMIN],
    passwordHash,
  });
  const leo = await ensureUser({
    email: "leo@klikhubb.dev",
    displayName: "Leo Vargas",
    username: "leov",
    referralCode: "LEO",
    roles: [RoleCode.CREATOR, RoleCode.STUDENT],
    passwordHash,
    invitedById: maya.id,
  });
  const amina = await ensureUser({
    email: "amina@klikhubb.dev",
    displayName: "Amina Rahim",
    username: "amina",
    referralCode: "AMINA",
    roles: [RoleCode.STUDENT],
    passwordHash,
    invitedById: leo.id,
  });
  await ensureUser({
    email: "rafa@klikhubb.dev",
    displayName: "Rafa Díaz",
    username: "rafa",
    referralCode: "RAFA",
    roles: [RoleCode.STUDENT],
    passwordHash,
    invitedById: amina.id,
  });

  const products = [
    {
      slug: "cierre-elite",
      title: "Academia Cierre Élite",
      description: "Cierre en video corto. El CTA vive en el feed.",
      price: 497,
      type: ProductType.COURSE,
    },
    {
      slug: "inner-circle",
      title: "Inner Circle",
      description: "Membresía de comunidad y wins semanales.",
      price: 49,
      type: ProductType.MEMBERSHIP,
    },
    {
      slug: "red-binaria",
      title: "De view a cliente",
      description: "Convierte atención en compras sin salir del video.",
      price: 197,
      type: ProductType.COURSE,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: { title: product.title, description: product.description, status: ProductStatus.ACTIVE, price: product.price },
      create: {
        creatorId: maya.id,
        type: product.type,
        title: product.title,
        slug: product.slug,
        description: product.description,
        price: product.price,
        currency: "USD",
        status: ProductStatus.ACTIVE,
      },
    });
  }

  const cierre = await prisma.product.findUniqueOrThrow({ where: { slug: "cierre-elite" } });
  const inner = await prisma.product.findUniqueOrThrow({ where: { slug: "inner-circle" } });

  const sampleVideos = [
    {
      id: "vid_maya_cierre",
      creatorId: maya.id,
      title: "El botón vende",
      caption: "Empaqué mi curso en 18 segundos. El botón vende. Yo cobro sin salir del feed.",
      videoUrl: "/videos/maya-cierre.mp4",
      productId: cierre.id,
    },
    {
      id: "vid_leo_inner",
      creatorId: leo.id,
      title: "Audiencia propia",
      caption: "Mi comunidad no es un chat suelto. Quien compra, se queda. Así se siente tener audiencia propia.",
      videoUrl: "/videos/leo-inner.mp4",
      productId: inner.id,
    },
    {
      id: "vid_amina_clic",
      creatorId: amina.id,
      title: "Un clic",
      caption: "Dejé de pedir likes. Ahora pido un clic. El feed paga a quien crea.",
      videoUrl: "/videos/amina-clic.mp4",
      productId: null as string | null,
    },
  ];

  for (const item of sampleVideos) {
    await prisma.video.upsert({
      where: { id: item.id },
      update: {
        title: item.title,
        caption: item.caption,
        videoUrl: item.videoUrl,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
      create: {
        id: item.id,
        creatorId: item.creatorId,
        title: item.title,
        caption: item.caption,
        videoUrl: item.videoUrl,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
    if (item.productId) {
      await prisma.videoProduct.upsert({
        where: { videoId_productId: { videoId: item.id, productId: item.productId } },
        update: { isPrimary: true },
        create: { videoId: item.id, productId: item.productId, isPrimary: true, ctaLabel: "Comprar" },
      });
    }
  }

  console.log(`Seed OK — plan ${plan.code}. Creador 80% · plataforma 10% · invitación 10%.`);
}

async function ensureUser(input: {
  email: string;
  displayName: string;
  username: string;
  referralCode: string;
  roles: RoleCode[];
  passwordHash: string;
  invitedById?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    if (input.invitedById && !existing.invitedById) {
      return prisma.user.update({
        where: { id: existing.id },
        data: { invitedById: input.invitedById },
      });
    }
    return existing;
  }

  return prisma.user.create({
    data: {
      email: input.email,
      name: input.displayName,
      displayName: input.displayName,
      username: input.username,
      referralCode: input.referralCode,
      hashedPassword: input.passwordHash,
      status: "ACTIVE",
      invitedById: input.invitedById,
      roles: { create: input.roles.map((role) => ({ role })) },
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
