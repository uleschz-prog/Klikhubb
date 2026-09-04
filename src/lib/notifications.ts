import type { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { emailFrom, getResend } from "@/lib/email/resend";
import { siteUrl } from "@/config/site";

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string | null;
}) {
  try {
    return await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        href: input.href ?? null,
      },
    });
  } catch (error) {
    console.error("notification create", error);
    return null;
  }
}

export async function listNotifications(userId: string, limit = 30) {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    href: row.href,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function unreadNotificationCount(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function markNotificationsRead(userId: string, ids?: string[]) {
  await prisma.notification.updateMany({
    where: {
      userId,
      readAt: null,
      ...(ids?.length ? { id: { in: ids } } : {}),
    },
    data: { readAt: new Date() },
  });
}

export async function notifyAndEmail(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string | null;
  emailSubject?: string;
}) {
  await createNotification(input);

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { email: true, displayName: true },
  });
  if (!user?.email) return;

  const resend = getResend();
  if (!resend) return;

  const link = input.href ? `${siteUrl()}${input.href}` : siteUrl();
  try {
    await resend.emails.send({
      from: emailFrom(),
      to: user.email,
      subject: input.emailSubject ?? input.title,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#111">
          <p style="font-size:14px;color:#666">Qlyk</p>
          <h1 style="font-size:22px;margin:8px 0 12px">${input.title}</h1>
          <p style="font-size:15px;line-height:1.5">${input.body}</p>
          <p style="margin-top:24px">
            <a href="${link}" style="display:inline-block;background:#00FF41;color:#050505;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700">
              Abrir en Qlyk
            </a>
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("notification email", error);
  }
}
