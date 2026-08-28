import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { hydrateAuthToken } from "@/lib/auth/resolve-user";

const googleConfigured =
  Boolean(process.env.GOOGLE_CLIENT_ID) && Boolean(process.env.GOOGLE_CLIENT_SECRET);

export const authOptions: NextAuthOptions = {
  secret:
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    "klikhubb-demo-secret",
  adapter: hasDatabaseUrl ? PrismaAdapter(prisma) : undefined,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    ...(googleConfigured
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const identifier = credentials.email.trim();
        const email = identifier.toLowerCase();

        try {
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email },
                { username: { equals: identifier, mode: "insensitive" } },
              ],
            },
            include: { roles: true },
          });
          if (!user?.hashedPassword || user.status === "BANNED" || user.status === "SUSPENDED") {
            return null;
          }
          const valid = await bcrypt.compare(credentials.password, user.hashedPassword);
          if (!valid) return null;
          await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => undefined);
          return {
            id: user.id,
            email: user.email,
            name: user.displayName ?? user.name,
            image: user.image,
            roles: user.roles.map((role) => role.role),
          };
        } catch (error) {
          const { demoFindUserByLogin, isConnectionError } = await import("@/lib/demo/store");
          if (!isConnectionError(error)) return null;
          const user = await demoFindUserByLogin(identifier);
          if (!user) return null;
          const valid = await bcrypt.compare(credentials.password, user.hashedPassword);
          if (!valid) return null;
          return {
            id: user.id,
            email: user.email,
            name: user.displayName,
            image: user.image ?? null,
            roles: user.roles,
          };
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.roles = user.roles ?? [];
        if (user.email) token.email = user.email;
        if (user.image) token.picture = user.image;
      }
      if (trigger === "update" && session && "image" in session) {
        token.picture = (session as { image?: string | null }).image ?? null;
      }
      return hydrateAuthToken(token);
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.roles = (token.roles as string[]) ?? [];
        session.user.image = (token.picture as string | null | undefined) ?? null;
      }
      return session;
    },
  },
};
