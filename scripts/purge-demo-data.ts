/**
 * Elimina usuarios, productos y videos ficticios / placeholder del feed.
 * Uso: npm run db:purge-demo
 */
import { PrismaClient } from "@prisma/client";
import { purgePlaceholderFeedContent } from "../src/lib/platform/purge-placeholders";

const prisma = new PrismaClient();

async function main() {
  const result = await purgePlaceholderFeedContent();
  console.log("Purge OK");
  console.log(`  Videos eliminados: ${result.deletedVideos}`);
  console.log(`  Productos archivados (bootstrap): ${result.archivedProducts}`);
  console.log(`  Usuarios demo borrados: ${result.deletedDemoUsers}`);
  console.log(`  Productos demo borrados: ${result.deletedDemoProducts}`);
  if (result.videoTitles.length) {
    console.log("  Títulos:", result.videoTitles.join(" | "));
  }
  if (result.productSlugs.length) {
    console.log("  Slugs:", result.productSlugs.join(", "));
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
