import { Resend } from "resend";

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function emailFrom() {
  return process.env.EMAIL_FROM?.trim() || "Qlyk <onboarding@resend.dev>";
}

export function getResend() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}
