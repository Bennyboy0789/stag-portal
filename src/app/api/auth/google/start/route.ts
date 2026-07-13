import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/dal";
import { GSC_SCOPE, oauthRedirectUri } from "@/lib/data/gsc";
import { env } from "@/lib/env";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (!env.googleClientId || !env.googleClientSecret) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?gsc=missing_config", request.url)
    );
  }

  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("gsc_oauth_state", state, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", env.googleClientId);
  authUrl.searchParams.set("redirect_uri", oauthRedirectUri());
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", GSC_SCOPE);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl);
}
