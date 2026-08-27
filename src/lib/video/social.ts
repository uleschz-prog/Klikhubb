import { prisma } from "@/lib/prisma";

export class SocialError extends Error {
  constructor(
    message: string,
    public readonly code: "NOT_FOUND" | "SELF" | "UNAUTHORIZED",
  ) {
    super(message);
  }
}

export type PublicComment = {
  id: string;
  body: string;
  handle: string;
  authorName: string;
  createdAt: string;
};

export async function toggleVideoLike(videoId: string, userId: string) {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: { id: true, likeCount: true },
  });
  if (!video) throw new SocialError("Video no encontrado.", "NOT_FOUND");

  const actor = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!actor) throw new SocialError("Vuelve a entrar para guardar el like.", "UNAUTHORIZED");

  const existing = await prisma.videoLike.findUnique({
    where: { videoId_userId: { videoId, userId } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.videoLike.delete({ where: { videoId_userId: { videoId, userId } } }),
      prisma.video.updateMany({
        where: { id: videoId, likeCount: { gt: 0 } },
        data: { likeCount: { decrement: 1 } },
      }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.videoLike.create({ data: { videoId, userId } }),
      prisma.video.update({
        where: { id: videoId },
        data: { likeCount: { increment: 1 } },
      }),
    ]);
  }

  const next = await prisma.video.findUnique({
    where: { id: videoId },
    select: { likeCount: true },
  });
  return { liked: !existing, likeCount: next?.likeCount ?? video.likeCount };
}

export async function toggleVideoSave(videoId: string, userId: string) {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: { id: true, saveCount: true },
  });
  if (!video) throw new SocialError("Video no encontrado.", "NOT_FOUND");

  const actor = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!actor) throw new SocialError("Vuelve a entrar para guardar el clip.", "UNAUTHORIZED");

  const existing = await prisma.videoSave.findUnique({
    where: { videoId_userId: { videoId, userId } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.videoSave.delete({ where: { videoId_userId: { videoId, userId } } }),
      prisma.video.updateMany({
        where: { id: videoId, saveCount: { gt: 0 } },
        data: { saveCount: { decrement: 1 } },
      }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.videoSave.create({ data: { videoId, userId } }),
      prisma.video.update({
        where: { id: videoId },
        data: { saveCount: { increment: 1 } },
      }),
    ]);
  }

  const next = await prisma.video.findUnique({
    where: { id: videoId },
    select: { saveCount: true },
  });
  return { saved: !existing, saveCount: next?.saveCount ?? video.saveCount };
}

export async function toggleFollowByHandle(followerId: string, handle: string) {
  const actor = await prisma.user.findUnique({ where: { id: followerId }, select: { id: true } });
  if (!actor) throw new SocialError("Vuelve a entrar para seguir.", "UNAUTHORIZED");

  const username = handle.replace(/^@/, "").trim();
  const target = await prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
    select: { id: true, username: true },
  });
  if (!target?.username) throw new SocialError("Ese creador no existe.", "NOT_FOUND");
  if (target.id === followerId) throw new SocialError("No puedes seguirte a ti mismo.", "SELF");

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId: target.id } },
  });

  if (existing) {
    await prisma.follow.delete({
      where: { followerId_followingId: { followerId, followingId: target.id } },
    });
    return { following: false, handle: target.username };
  }

  await prisma.follow.create({
    data: { followerId, followingId: target.id },
  });
  return { following: true, handle: target.username };
}

export async function listFollowingHandles(userId: string) {
  const rows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { following: { select: { username: true } } },
  });
  return rows
    .map((row) => row.following.username)
    .filter((handle): handle is string => Boolean(handle));
}

export async function listVideoComments(videoId: string) {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: { id: true },
  });
  if (!video) throw new SocialError("Video no encontrado.", "NOT_FOUND");

  const [rows, commentCount] = await Promise.all([
    prisma.videoComment.findMany({
      where: { videoId, parentId: null },
      orderBy: { createdAt: "asc" },
      take: 80,
      include: { author: { select: { displayName: true, username: true, name: true } } },
    }),
    prisma.videoComment.count({ where: { videoId } }),
  ]);

  return {
    comments: rows.map(toPublicComment),
    commentCount,
  };
}

export async function addVideoComment(videoId: string, userId: string, body: string) {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: { id: true },
  });
  if (!video) throw new SocialError("Video no encontrado.", "NOT_FOUND");

  const actor = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!actor) throw new SocialError("Vuelve a entrar para comentar.", "UNAUTHORIZED");

  const created = await prisma.$transaction(async (tx) => {
    const comment = await tx.videoComment.create({
      data: { videoId, authorId: userId, body },
      include: { author: { select: { displayName: true, username: true, name: true } } },
    });
    const commentCount = await tx.videoComment.count({ where: { videoId } });
    await tx.video.update({
      where: { id: videoId },
      data: { commentCount },
    });
    return { comment, commentCount };
  });

  return {
    comment: toPublicComment(created.comment),
    commentCount: created.commentCount,
  };
}

export async function registerShare(videoId: string) {
  const video = await prisma.video.findUnique({ where: { id: videoId }, select: { id: true } });
  if (!video) throw new SocialError("Video no encontrado.", "NOT_FOUND");
  const updated = await prisma.video.update({
    where: { id: videoId },
    data: { shareCount: { increment: 1 } },
    select: { shareCount: true },
  });
  return { shareCount: updated.shareCount };
}

function toPublicComment(row: {
  id: string;
  body: string;
  createdAt: Date;
  author: { displayName: string | null; username: string | null; name: string | null };
}): PublicComment {
  return {
    id: row.id,
    body: row.body,
    handle: row.author.username ?? "qlyk",
    authorName: row.author.displayName ?? row.author.name ?? "Miembro",
    createdAt: row.createdAt.toISOString(),
  };
}
