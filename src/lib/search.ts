import { prisma } from "@/lib/prisma";

export type SearchResult = {
  creators: {
    username: string;
    displayName: string;
    bio: string | null;
    image: string | null;
  }[];
  products: {
    slug: string;
    title: string;
    description: string | null;
    price: number;
    currency: string;
    creatorName: string;
  }[];
  videos: {
    id: string;
    title: string;
    caption: string | null;
    thumbnailUrl: string | null;
    lane: string;
    handle: string;
  }[];
};

export async function searchPlatform(query: string): Promise<SearchResult> {
  const q = query.trim().slice(0, 80);
  if (q.length < 2) {
    return { creators: [], products: [], videos: [] };
  }

  const [creators, products, videos] = await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: "insensitive" } },
          { displayName: { contains: q, mode: "insensitive" } },
        ],
        username: { not: null },
      },
      take: 12,
      select: { username: true, displayName: true, name: true, bio: true, image: true },
    }),
    prisma.product.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 12,
      include: { creator: { select: { displayName: true, username: true } } },
    }),
    prisma.video.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { caption: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 12,
      orderBy: { publishedAt: "desc" },
      include: { creator: { select: { username: true } } },
    }),
  ]);

  return {
    creators: creators
      .filter((row) => row.username)
      .map((row) => ({
        username: row.username as string,
        displayName: row.displayName ?? row.name ?? (row.username as string),
        bio: row.bio,
        image: row.image,
      })),
    products: products.map((row) => ({
      slug: row.slug,
      title: row.title,
      description: row.description,
      price: Number(row.price),
      currency: row.currency.trim(),
      creatorName: row.creator.displayName ?? row.creator.username ?? "Creador",
    })),
    videos: videos.map((row) => ({
      id: row.id,
      title: row.title,
      caption: row.caption,
      thumbnailUrl: row.thumbnailUrl,
      lane: row.lane,
      handle: row.creator.username ?? "creator",
    })),
  };
}
