import { prisma } from "@/lib/prisma";
import { demoUpdateAvatar, shouldUseDemoFallback } from "@/lib/demo/store";

export async function updateUserAvatar(userId: string, imageUrl: string | null) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { image: imageUrl },
      select: { id: true, image: true, displayName: true },
    });
    return { image: user.image, mode: "postgres" as const };
  } catch (error) {
    if (!shouldUseDemoFallback(error)) throw error;
  }

  const user = await demoUpdateAvatar(userId, imageUrl);
  return { image: user.image ?? null, mode: "demo" as const };
}
