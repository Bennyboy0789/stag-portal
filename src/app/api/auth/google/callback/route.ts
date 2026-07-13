import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/dal";
import { exchangeCodeForTokens, saveRefreshToken } from "@/lib/data/gsc";

export async function GET(request: NextRequest) {
  const settingsUrl = (result: string) =>
    NextResponse.redirect(
      new URL(`/dashboard/settings?gsc=${result}`, request.url)
    );

  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("gsc_oauth_state")?.value;
  cookieStore.delete("gsc_oauth_state");

  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");

  if (!code || !state || !expectedState || state !== expectedState) {
    return settingsUrl("error");
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      // prompt=consent should always return one; treat absence as failure.
      return settingsUrl("error");
    }
    saveRefreshToken(tokens.refresh_token);
    return settingsUrl("connected");
  } catch (error) {
    console.error("Google OAuth callback failed:", error);
    return settingsUrl("error");
  }
}
