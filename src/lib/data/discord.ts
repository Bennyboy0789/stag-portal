import "server-only";
import { env } from "../env";
import type { Ticket } from "../types";

const PRIORITY_COLORS: Record<string, number> = {
  low: 0x22c55e,
  medium: 0xf59e0b,
  high: 0xef4444,
};

/**
 * Notify the Stag Discord when a client submits a maintenance ticket.
 * Failures are logged, never thrown — a webhook outage must not block
 * ticket creation.
 */
export async function notifyTicketCreated(ticket: Ticket): Promise<void> {
  const webhookUrl = env.discordWebhookUrl;
  if (!webhookUrl) return;

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: `🎫 New maintenance ticket — ${env.clientName}`,
            description: `**${ticket.subject}**\n${
              ticket.description ?? "_No description_"
            }`,
            color: PRIORITY_COLORS[ticket.priority] ?? 0xf59e0b,
            fields: [
              { name: "Priority", value: ticket.priority, inline: true },
              { name: "Status", value: ticket.status, inline: true },
              { name: "Ticket ID", value: ticket.id, inline: false },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
    if (!res.ok) {
      console.error(`Discord webhook failed: ${res.status} ${await res.text()}`);
    }
  } catch (error) {
    console.error("Discord webhook error:", error);
  }
}
