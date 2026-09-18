import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_PREFIXES = ["/dashboard", "/contrato", "/pago"];
const AUTH_PAGES = ["/iniciar-sesion", "/registro"];

export async function middleware(request: NextRequest) {
  try {
    const { user, response } = await updateSession(request);
    const { pathname } = request.nextUrl;

    const isProtected = PROTECTED_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix)
    );
    const isAuthPage = AUTH_PAGES.some((prefix) => pathname.startsWith(prefix));

    if (isProtected && !user) {
      const url = request.nextUrl.clone();
      url.pathname = "/iniciar-sesion";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    if (isAuthPage && user) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }

    return response;
  } catch {
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
