import { selectSiteAction } from "@/app/actions/gsc";
import { verifySession } from "@/lib/dal";
import { getConnection, listSites } from "@/lib/data/gsc";
import { env } from "@/lib/env";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label, Select } from "@/components/ui/input";
import { formatDateTime } from "@/lib/utils";
import { PasswordForm } from "./password-form";
import { DisconnectButton } from "./disconnect-button";

export const metadata = { title: "Settings" };

function Banner({ kind }: { kind: string }) {
  if (kind === "connected") {
    return (
      <div className="mb-4 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
        Search Console connected. Pick the property to track below.
      </div>
    );
  }
  if (kind === "error") {
    return (
      <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
        Search Console connection failed. Please try again.
      </div>
    );
  }
  if (kind === "missing_config") {
    return (
      <div className="mb-4 rounded-lg border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent">
        GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET aren&apos;t configured for this
        portal yet — contact Stag Marketing.
      </div>
    );
  }
  return null;
}

async function SearchConsoleCard() {
  const connection = getConnection();
  const connected = Boolean(connection?.refresh_token);
  const googleConfigured = Boolean(env.googleClientId && env.googleClientSecret);

  let sites: string[] = [];
  let sitesError: string | null = null;
  if (connected) {
    try {
      sites = await listSites();
    } catch {
      sitesError =
        "Couldn't load your Search Console properties. The connection may have been revoked — try disconnecting and connecting again.";
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Google Search Console</CardTitle>
        {connected ? (
          <Badge className="bg-success/15 text-success">Connected</Badge>
        ) : (
          <Badge className="bg-surface-2 text-muted border border-border">
            Not connected
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!connected ? (
          <>
            <p className="text-sm text-muted">
              Connect your Google account so the portal can show search
              clicks, impressions and top queries. Read-only access — we can
              never change anything.
            </p>
            {googleConfigured ? (
              <a
                href="/api/auth/google/start"
                className="inline-flex h-10 w-fit items-center rounded-lg bg-accent px-4 text-sm font-medium text-black transition-colors hover:bg-accent-strong"
              >
                Connect Search Console
              </a>
            ) : (
              <p className="text-xs text-muted">
                Google OAuth isn&apos;t configured for this portal instance
                yet (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).
              </p>
            )}
          </>
        ) : (
          <>
            {sitesError ? (
              <p className="text-sm text-danger">{sitesError}</p>
            ) : (
              <form action={selectSiteAction} className="flex items-end gap-3">
                <div className="flex-1">
                  <Label htmlFor="site_url">Tracked property</Label>
                  <Select
                    id="site_url"
                    name="site_url"
                    defaultValue={connection?.site_url ?? ""}
                  >
                    <option value="" disabled>
                      Choose a property…
                    </option>
                    {sites.map((site) => (
                      <option key={site} value={site}>
                        {site}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button type="submit" variant="secondary">
                  Save
                </Button>
              </form>
            )}
            <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted">
              <div>
                {connection?.connected_at && (
                  <p>Connected {formatDateTime(connection.connected_at)}</p>
                )}
                <p>
                  {connection?.last_sync
                    ? `Last sync ${formatDateTime(connection.last_sync)}`
                    : "Never synced"}
                </p>
              </div>
              <DisconnectButton />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default async function SettingsPage(
  props: PageProps<"/dashboard/settings">
) {
  const session = await verifySession();
  const searchParams = await props.searchParams;
  const banner = Array.isArray(searchParams.gsc)
    ? searchParams.gsc[0]
    : searchParams.gsc;

  const captureUrl = `${env.appUrl || "https://<portal-domain>"}/api/leads/capture`;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="mb-2 text-sm text-muted">
          Account and integrations for this portal.
        </p>
        {banner && <Banner kind={banner} />}
      </div>

      <SearchConsoleCard />

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            Signed in as{" "}
            <span className="font-medium text-foreground">{session.email}</span>
          </p>
          <PasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Portal info</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted">Client</span>
            <span>{env.clientName}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted">Website domain</span>
            <span>{env.clientDomain || "Not set"}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted">Discord notifications</span>
            <span>
              {env.discordWebhookUrl ? (
                <Badge className="bg-success/15 text-success">Enabled</Badge>
              ) : (
                <Badge className="bg-surface-2 text-muted border border-border">
                  Not configured
                </Badge>
              )}
            </span>
          </div>
          <div className="border-t border-border pt-3">
            <p className="mb-1 text-xs text-muted">
              Website form capture endpoint
            </p>
            <code className="block overflow-x-auto rounded-lg bg-surface-2 px-3 py-2 font-mono text-xs text-foreground/90">
              POST {captureUrl}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
