import { hasDatabaseUrl, prisma } from "@/lib/prisma";

type AuthTokenSlice = {
  id?: string;
  email?: string | null;
  roles?: string[];
  picture?: string | null;
};

/** Maps a JWT/demo id to the live Postgres user when the cookie predates the real row. */
export async function resolveLiveUserId(userId?: string | null, email?: string | null) {
  const live = await loadLiveUser(userId, email);
  return live?.id ?? null;
}

export async function hydrateAuthToken<T extends AuthTokenSlice>(token: T): Promise<T> {
  const live = await loadLiveUser(token.id, token.email);
  if (!live) return token;
  token.id = live.id;
  token.roles = live.roles;
  if (live.image !== undefined) token.picture = live.image;
  return token;
}

async function loadLiveUser(userId?: string | null, email?: string | null) {
  if (!hasDatabaseUrl) return null;

  try {
    if (userId) {
      const byId = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, image: true, roles: { select: { role: true } } },
      });
      if (byId) {
        return { id: byId.id, roles: byId.roles.map((row) => row.role), image: byId.image };
      }
    }

    const address = email?.trim().toLowerCase();
    if (!address) return null;

    const byEmail = await prisma.user.findFirst({
      where: { email: { equals: address, mode: "insensitive" } },
      select: { id: true, image: true, roles: { select: { role: true } } },
    });
    if (!byEmail) return null;
    return { id: byEmail.id, roles: byEmail.roles.map((row) => row.role), image: byEmail.image };
  } catch {
    return null;
  }
}
