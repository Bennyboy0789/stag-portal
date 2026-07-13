import "server-only";
import { env } from "./env";

/**
 * Build the set of origins allowed to call the public endpoints.
 * CLIENT_DOMAIN accepts a comma-separated list of bare domains
 * ("example.com") or full origins ("https://example.com").
 */
function allowedOrigins(): Set<string> {
  const origins = new Set<string>();
  for (const raw of env.clientDomain.split(",")) {
    const entry = raw.trim().toLowerCase();
    if (!entry) continue;
    if (entry.startsWith("http://") || entry.startsWith("https://")) {
      origins.add(entry.replace(/\/$/, ""));
    } else {
      origins.add(`https://${entry}`);
      origins.add(`https://www.${entry}`);
    }
  }
  if (!env.isProd) {
    origins.add("http://localhost:3000");
    origins.add("http://localhost:3001");
    origins.add("http://127.0.0.1:3000");
  }
  return origins;
}

/**
 * CORS headers for a request against the public endpoints. Returns headers
 * echoing the origin when allowed; otherwise no CORS headers (browsers will
 * block the cross-origin read, while server-to-server calls are unaffected).
 */
export function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("origin");
  if (!origin) return {};
  if (!allowedOrigins().has(origin.toLowerCase())) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}
