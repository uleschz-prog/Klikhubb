import { brand, site, siteUrl } from "@/config/site";
import { emailFrom, getResend, isEmailConfigured, waitlistNotifyTo } from "@/lib/email/resend";

const intentLabel: Record<string, string> = {
  CREATOR: "Creador",
  ENTREPRENEUR: "Miembro",
  BOTH: "Los dos",
};

export type WaitlistMailInput = {
  email: string;
  intent: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function welcomeHtml(email: string, intent: string) {
  const url = siteUrl();
  const role = intentLabel[intent] ?? "Miembro";
  return `<!doctype html>
<html lang="es">
  <body style="margin:0;background:#050505;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0a0a0a;border:1px solid #1f1f1f;border-radius:20px;padding:36px 28px;">
            <tr>
              <td>
                <p style="margin:0;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#00F0FF;">${escapeHtml(brand.name)}</p>
                <h1 style="margin:16px 0 0;font-size:28px;line-height:1.15;color:#ffffff;">Ya tienes tu lugar.</h1>
                <p style="margin:16px 0 0;font-size:16px;line-height:1.6;color:#c8c8c8;">
                  Guardamos <strong style="color:#ffffff;">${escapeHtml(email)}</strong> en las primeras cuentas.
                  Entraste como <strong style="color:#00F0FF;">${escapeHtml(role)}</strong>.
                </p>
                <p style="margin:16px 0 0;font-size:16px;line-height:1.6;color:#c8c8c8;">
                  Te escribimos cuando abran el feed. Mientras tanto, tu espacio ya está reservado.
                </p>
                <p style="margin:28px 0 0;">
                  <a href="${escapeHtml(url)}" style="display:inline-block;background:#00FF41;color:#050505;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px;">
                    Volver a ${escapeHtml(site.name)}
                  </a>
                </p>
                <p style="margin:28px 0 0;font-size:13px;line-height:1.5;color:#7a7a7a;">
                  ${escapeHtml(brand.slogan)}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function notifyHtml(input: WaitlistMailInput) {
  const role = intentLabel[input.intent] ?? input.intent;
  return `<!doctype html>
<html lang="es">
  <body style="margin:0;background:#050505;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px;">
      <tr>
        <td>
          <p style="margin:0;color:#00F0FF;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;">Nueva plaza</p>
          <p style="margin:12px 0 0;font-size:18px;color:#ffffff;">${escapeHtml(input.email)}</p>
          <p style="margin:8px 0 0;font-size:14px;color:#c8c8c8;">Quiere entrar como ${escapeHtml(role)}.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendWaitlistWelcome(input: WaitlistMailInput): Promise<boolean> {
  const resend = getResend();
  if (!resend || !isEmailConfigured()) return false;

  const { error } = await resend.emails.send({
    from: emailFrom(),
    to: input.email,
    replyTo: waitlistNotifyTo() || undefined,
    subject: "Ya tienes tu lugar en KlikHubb",
    html: welcomeHtml(input.email, input.intent),
  });

  if (error) {
    console.error("waitlist welcome email", error);
    return false;
  }
  return true;
}

export async function sendWaitlistNotify(input: WaitlistMailInput): Promise<boolean> {
  const resend = getResend();
  const notify = waitlistNotifyTo();
  if (!resend || !notify) return false;

  const { error } = await resend.emails.send({
    from: emailFrom(),
    to: notify,
    replyTo: input.email,
    subject: `Nueva plaza: ${input.email}`,
    html: notifyHtml(input),
  });

  if (error) {
    console.error("waitlist notify email", error);
    return false;
  }
  return true;
}
