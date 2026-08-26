import { prisma } from "../src/lib/prisma";
import { PLATFORM_ADMIN } from "../src/config/platform-admin";
import { ensurePlatformAdmin } from "../src/lib/auth/ensure-admin";

async function main() {
  const admin = await ensurePlatformAdmin(prisma);
  console.log(
    JSON.stringify({
      ok: true,
      id: admin.id,
      username: admin.username,
      email: admin.email,
      referralCode: admin.referralCode,
      login: PLATFORM_ADMIN.username,
    }),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
