const isProd = process.env.NODE_ENV === "production";

function required(name: string, devFallback?: string): string {
  const value = process.env[name];
  if (value) return value;
  if (!isProd && devFallback !== undefined) return devFallback;
  throw new Error(`Missing required environment variable: ${name}`);
}

export const env = {
  get databasePath() {
    return process.env.DATABASE_URL ?? "./data/portal.db";
  },
  get jwtSecret() {
    // Dev-only fallback so a fresh clone boots; production must set JWT_SECRET.
    return required("JWT_SECRET", "stag-portal-dev-secret-do-not-use-in-prod");
  },
  get clientName() {
    return process.env.CLIENT_NAME ?? "Client";
  },
  get clientDomain() {
    return process.env.CLIENT_DOMAIN ?? "";
  },
  get discordWebhookUrl() {
    return process.env.DISCORD_WEBHOOK_URL ?? "";
  },
  get googleClientId() {
    return process.env.GOOGLE_CLIENT_ID ?? "";
  },
  get googleClientSecret() {
    return process.env.GOOGLE_CLIENT_SECRET ?? "";
  },
  get appUrl() {
    // Base URL of this portal, used for OAuth redirect URIs.
    return process.env.APP_URL ?? (isProd ? "" : "http://localhost:3000");
  },
  get cronSecret() {
    return process.env.CRON_SECRET ?? "";
  },
  isProd,
};
