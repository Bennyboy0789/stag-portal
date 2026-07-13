export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** SQLite CURRENT_TIMESTAMP ('YYYY-MM-DD HH:MM:SS', UTC) or ISO string → Date */
export function parseDbDate(value: string): Date {
  if (value.includes("T")) return new Date(value);
  return new Date(value.replace(" ", "T") + "Z");
}

export function formatDate(value: string): string {
  return parseDbDate(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(value: string): string {
  return parseDbDate(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function timeAgo(value: string): string {
  const seconds = Math.floor(
    (Date.now() - parseDbDate(value).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
