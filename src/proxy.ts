import { NextResponse, type NextRequest } from "next/server";
import { decrypt } from "@/lib/session";

/**
 * Optimistic auth checks: redirect unauthenticated users away from the
 * dashboard and authenticated users away from the login page. Real
 * authorization happens in the data access layer (src/lib/dal.ts).
 */
export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const session = await decrypt(req.cookies.get("session")?.value);

  if (path.startsWith("/dashboard") && !session) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  if (path === "/" && session) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.(?:png|ico|svg|jpg|webp)$).*)"],
};
