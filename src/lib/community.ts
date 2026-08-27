import { CommunityRole, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isConnectionError } from "@/lib/demo/store";

const POST_POINTS = 5;

export class CommunityError extends Error {
  constructor(
    message: string,
    public readonly code: "NOT_FOUND" | "UNAUTHORIZED" | "FORBIDDEN",
  ) {
    super(message);
    this.name = "CommunityError";
  }
}

export type MembershipProduct = {
  id: string;
  slug: string;
  title: string;
  description: string;
  creatorId: string;
};

export type CommunityListItem = {
  slug: string;
  name: string;
  description: string;
  memberCount: number;
  role: "creator" | "member";
  lastPost: string | null;
};

export type CommunityPost = {
  id: string;
  title: string | null;
  body: string;
  likeCount: number;
  likedByMe: boolean;
  authorName: string;
  handle: string;
  createdAt: string;
};

export type CommunitySpace = {
  slug: string;
  name: string;
  description: string;
  memberCount: number;
  role: "creator" | "member";
  productSlug: string | null;
  posts: CommunityPost[];
};

type AuthorRow = { displayName: string | null; username: string | null; name: string | null };

function toPublicPost(
  row: {
    id: string;
    title: string | null;
    body: string;
    likeCount: number;
    createdAt: Date;
    author: AuthorRow;
  },
  likedByMe: boolean,
): CommunityPost {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    likeCount: row.likeCount,
    likedByMe,
    authorName: row.author.displayName ?? row.author.name ?? "Miembro",
    handle: row.author.username ?? "qlyk",
    createdAt: row.createdAt.toISOString(),
  };
}

export async function ensureCommunityForProduct(
  tx: Prisma.TransactionClient,
  product: MembershipProduct,
) {
  let community = await tx.community.findUnique({ where: { productId: product.id } });
  if (!community) {
    community = await tx.community.create({
      data: {
        ownerId: product.creatorId,
        productId: product.id,
        name: product.title,
        slug: product.slug,
        description: product.description || product.title,
        isPaid: true,
        memberCount: 0,
      },
    });
  } else if (community.slug !== product.slug) {
    const taken = await tx.community.findUnique({
      where: { slug: product.slug },
      select: { id: true },
    });
    if (!taken) {
      community = await tx.community.update({
        where: { id: community.id },
        data: { slug: product.slug },
      });
    }
  }

  await ensureMember(tx, community.id, product.creatorId, "OWNER");
  return community;
}

export async function ensureMember(
  tx: Prisma.TransactionClient,
  communityId: string,
  userId: string,
  role: CommunityRole,
) {
  const existing = await tx.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId } },
  });
  if (existing) {
    if (role === "OWNER" && existing.role !== "OWNER") {
      await tx.communityMember.update({
        where: { communityId_userId: { communityId, userId } },
        data: { role: "OWNER" },
      });
    }
    return;
  }

  await tx.communityMember.create({
    data: { communityId, userId, role },
  });
  await tx.community.update({
    where: { id: communityId },
    data: { memberCount: { increment: 1 } },
  });
}

export async function joinMembershipCommunity(
  tx: Prisma.TransactionClient,
  product: MembershipProduct,
  userId: string,
) {
  const community = await ensureCommunityForProduct(tx, product);
  await ensureMember(tx, community.id, userId, userId === product.creatorId ? "OWNER" : "MEMBER");
  return community;
}

async function backfillAccess(userId: string) {
  const [owned, enrolled] = await Promise.all([
    prisma.product.findMany({
      where: { creatorId: userId, status: "ACTIVE", type: "MEMBERSHIP" },
      select: { id: true, slug: true, title: true, description: true, creatorId: true },
    }),
    prisma.enrollment.findMany({
      where: { userId, status: "ACTIVE", product: { type: "MEMBERSHIP" } },
      select: {
        product: { select: { id: true, slug: true, title: true, description: true, creatorId: true } },
      },
    }),
  ]);

  const products = new Map<string, MembershipProduct>();
  for (const product of owned) products.set(product.id, product);
  for (const row of enrolled) products.set(row.product.id, row.product);
  if (products.size === 0) return;

  await prisma.$transaction(async (tx) => {
    for (const product of Array.from(products.values())) {
      await joinMembershipCommunity(tx, product, userId);
    }
  });
}

export async function listMyCommunities(userId: string): Promise<CommunityListItem[]> {
  try {
    await backfillAccess(userId);
    const rows = await prisma.communityMember.findMany({
      where: { userId },
      orderBy: { joinedAt: "desc" },
      include: {
        community: {
          select: {
            slug: true,
            name: true,
            description: true,
            memberCount: true,
            posts: {
              where: { parentId: null },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { title: true, body: true },
            },
          },
        },
      },
    });

    return rows.map((row) => {
      const last = row.community.posts[0];
      return {
        slug: row.community.slug,
        name: row.community.name,
        description: row.community.description,
        memberCount: row.community.memberCount,
        role: row.role === "OWNER" ? "creator" : "member",
        lastPost: last ? last.title?.trim() || last.body : null,
      };
    });
  } catch (error) {
    if (!isConnectionError(error)) throw error;
    return [];
  }
}

export async function loadCommunity(
  userId: string,
  slug: string,
): Promise<CommunitySpace | "not_found" | "forbidden"> {
  try {
    let community = await prisma.community.findUnique({
      where: { slug },
      include: {
        product: {
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            creatorId: true,
            type: true,
            status: true,
          },
        },
      },
    });

    const product =
      community?.product ??
      (await prisma.product.findFirst({
        where: { slug, type: "MEMBERSHIP", status: "ACTIVE" },
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          creatorId: true,
          type: true,
          status: true,
        },
      }));

    if (!community && !product) return "not_found";

    const isCreator = Boolean(
      (product && product.creatorId === userId) || community?.ownerId === userId,
    );
    const enrollment = product
      ? await prisma.enrollment.findUnique({
          where: { userId_productId: { userId, productId: product.id } },
        })
      : null;
    const isStudent = enrollment?.status === "ACTIVE";

    if (product && (isCreator || isStudent)) {
      const ensured = await prisma.$transaction(async (tx) =>
        joinMembershipCommunity(tx, product, userId),
      );
      community = await prisma.community.findUnique({
        where: { id: ensured.id },
        include: {
          product: {
            select: {
              id: true,
              slug: true,
              title: true,
              description: true,
              creatorId: true,
              type: true,
              status: true,
            },
          },
        },
      });
    } else if (community && community.ownerId === userId) {
      await prisma.$transaction(async (tx) => {
        await ensureMember(tx, community!.id, userId, "OWNER");
      });
    }

    if (!community) return "not_found";

    const membership = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId } },
    });
    if (!membership) return "forbidden";

    const posts = await prisma.communityPost.findMany({
      where: { communityId: community.id, parentId: null },
      orderBy: { createdAt: "desc" },
      take: 80,
      include: { author: { select: { displayName: true, username: true, name: true } } },
    });
    const liked = await prisma.postLike.findMany({
      where: { userId, postId: { in: posts.map((post) => post.id) } },
      select: { postId: true },
    });
    const likedIds = new Set(liked.map((row) => row.postId));

    return {
      slug: community.slug,
      name: community.name,
      description: community.description,
      memberCount: community.memberCount,
      role: membership.role === "OWNER" ? "creator" : "member",
      productSlug: community.product?.slug ?? product?.slug ?? null,
      posts: posts.map((post) => toPublicPost(post, likedIds.has(post.id))),
    };
  } catch (error) {
    if (!isConnectionError(error)) throw error;
    return "not_found";
  }
}

export async function createCommunityPost(
  userId: string,
  slug: string,
  input: { body: string; title?: string },
) {
  const community = await prisma.community.findUnique({ where: { slug }, select: { id: true } });
  if (!community) throw new CommunityError("Comunidad no encontrada.", "NOT_FOUND");

  const membership = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId: community.id, userId } },
  });
  if (!membership) {
    throw new CommunityError("Entra a esta comunidad para publicar.", "FORBIDDEN");
  }

  const title = input.title?.trim() || null;

  return prisma.$transaction(async (tx) => {
    const post = await tx.communityPost.create({
      data: {
        communityId: community.id,
        authorId: userId,
        type: "DISCUSSION",
        title,
        body: input.body,
        pointsAwarded: POST_POINTS,
      },
      include: { author: { select: { displayName: true, username: true, name: true } } },
    });
    await tx.communityMember.update({
      where: { communityId_userId: { communityId: community.id, userId } },
      data: { points: { increment: POST_POINTS } },
    });
    const stats = await tx.userStats.upsert({
      where: { userId },
      create: { userId, points: POST_POINTS },
      update: { points: { increment: POST_POINTS } },
    });
    await tx.pointLedger.create({
      data: {
        userId,
        delta: POST_POINTS,
        balanceAfter: stats.points,
        reason: "POST",
        refType: "community_post",
        refId: post.id,
      },
    });
    return toPublicPost(post, false);
  });
}

export async function togglePostLike(postId: string, userId: string) {
  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    select: { id: true, communityId: true, likeCount: true },
  });
  if (!post) throw new CommunityError("Post no encontrado.", "NOT_FOUND");

  const membership = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId: post.communityId, userId } },
  });
  if (!membership) {
    throw new CommunityError("Entra a esta comunidad para dar like.", "FORBIDDEN");
  }

  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.postLike.delete({ where: { postId_userId: { postId, userId } } }),
      prisma.communityPost.updateMany({
        where: { id: postId, likeCount: { gt: 0 } },
        data: { likeCount: { decrement: 1 } },
      }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.postLike.create({ data: { postId, userId } }),
      prisma.communityPost.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
      }),
    ]);
  }

  const next = await prisma.communityPost.findUnique({
    where: { id: postId },
    select: { likeCount: true },
  });
  return { liked: !existing, likeCount: next?.likeCount ?? post.likeCount };
}
