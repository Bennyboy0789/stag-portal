export const LEAD_STAGES = ["new", "contacted", "won", "lost"] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export const LEAD_SOURCES = [
  "website_form",
  "phone_call",
  "gbp",
  "manual",
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: LeadSource;
  stage: LeadStage;
  notes: string | null;
  /** Estimated or closed deal value in dollars. Sums into "revenue won" while stage is 'won'. */
  value: number | null;
  created_at: string;
  updated_at: string;
}

export const POST_STATUSES = ["draft", "published"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: PostStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export const TICKET_PRIORITIES = ["low", "medium", "high"] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const TICKET_STATUSES = ["open", "in_progress", "resolved"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export interface Ticket {
  id: string;
  subject: string;
  description: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
}

export interface SearchConsoleRow {
  id: number;
  refresh_token: string | null;
  site_url: string | null;
  connected_at: string | null;
  last_sync: string | null;
}

export interface User {
  id: string;
  email: string;
  password_hash: string | null;
  created_at: string;
}

/** Aggregated Search Console data cached per time range. */
export interface GscSnapshot {
  totals: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
  byDate: Array<{
    date: string;
    clicks: number;
    impressions: number;
  }>;
  topQueries: Array<{
    query: string;
    clicks: number;
    impressions: number;
  }>;
  topPages: Array<{
    page: string;
    clicks: number;
    impressions: number;
  }>;
}
