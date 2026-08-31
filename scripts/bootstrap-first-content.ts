/**
 * Publica el curso oficial y clips iniciales de Qlyk.
 * Uso: npm run db:bootstrap-content
 */
import { PrismaClient } from "@prisma/client";
import { bootstrapFirstContent, getFirstContentStatus } from "../src/lib/platform/first-content";

const prisma = new PrismaClient();

async function main() {
  const before = await getFirstContentStatus();
  console.log("Estado previo:", JSON.stringify(before, null, 2));

  const result = await bootstrapFirstContent();
  console.log("\nResultado:", JSON.stringify(result, null, 2));

  if (result.ready) {
    console.log("\n✓ Contenido real listo en Shop, Play y marketplace.");
  } else {
    console.warn("\n! Revisa el estado: algo quedó incompleto.");
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
