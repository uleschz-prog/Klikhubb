import { prisma } from "@/lib/prisma";

export type PublicCreatorProfile = {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  image: string | null;
  followerCount: number;
  videoCount: number;
  productCount: number;
  products: {
    slug: string;
    title: string;
    description: string | null;
    price: number;
    currency: string;
    type: string;
  }[];
  videos: {
    id: string;
    title: string;
    caption: string | null;
    thumbnailUrl: string | null;
    lane: string;
    likeCount: number;
    publishedAt: string;
  }[];
};

export async function getPublicCreatorByUsername(username: string): Promise<PublicCreatorProfile | null> {
  const handle = username.trim().replace(/^@/, "").toLowerCase();
  if (!handle) return null;

  const user = await prisma.user.findFirst({
    where: {
      username: { equals: handle, mode: "insensitive" },
      status: { in: ["ACTIVE", "PENDING"] },
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      name: true,
      bio: true,
      image: true,
      _count: {
        select: {
          followers: true,
          videos: { where: { status: "PUBLISHED" } },
          products: { where: { status: "ACTIVE" } },
        },
      },
      products: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 24,
        select: {
          slug: true,
          title: true,
          description: true,
          price: true,
          currency: true,
          type: true,
        },
      },
      videos: {
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 24,
        select: {
          id: true,
          title: true,
          caption: true,
          thumbnailUrl: true,
          lane: true,
          likeCount: true,
          publishedAt: true,
        },
      },
    },
  });

  if (!user?.username) return null;

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName ?? user.name ?? user.username,
    bio: user.bio,
    image: user.image,
    followerCount: user._count.followers,
    videoCount: user._count.videos,
    productCount: user._count.products,
    products: user.products.map((product) => ({
      ...product,
      price: Number(product.price),
      currency: product.currency.trim(),
    })),
    videos: user.videos.map((video) => ({
      id: video.id,
      title: video.title,
      caption: video.caption,
      thumbnailUrl: video.thumbnailUrl,
      lane: video.lane,
      likeCount: video.likeCount,
      publishedAt: (video.publishedAt ?? new Date()).toISOString(),
    })),
  };
}
