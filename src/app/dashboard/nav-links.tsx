"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/leads", label: "Leads", exact: false },
  { href: "/dashboard/blog", label: "Blog", exact: false },
  { href: "/dashboard/analytics", label: "Analytics", exact: false },
  { href: "/dashboard/tickets", label: "Tickets", exact: false },
  { href: "/dashboard/settings", label: "Settings", exact: false },
];

function LinkList({ orientation }: { orientation: "vertical" | "horizontal" }) {
  const pathname = usePathname();
  return (
    <>
      {links.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors",
              active
                ? "bg-accent-soft text-accent font-medium"
                : "text-muted hover:text-foreground hover:bg-surface-2",
              orientation === "horizontal" && "shrink-0"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

export function NavLinks({ orientation }: { orientation: "vertical" | "horizontal" }) {
  const scrollerRef = useRef<HTMLElement>(null);
  const [moreRight, setMoreRight] = useState(false);

  // Show a fade at the right edge while nav items remain off-screen,
  // so "Settings" is discoverable on narrow viewports.
  useEffect(() => {
    if (orientation !== "horizontal") return;
    const el = scrollerRef.current;
    if (!el) return;
    const update = () =>
      setMoreRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    const observer = new ResizeObserver(update);
    observer.observe(el);
    el.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", update);
    };
  }, [orientation]);

  if (orientation === "vertical") {
    return (
      <nav className="flex flex-col gap-1">
        <LinkList orientation="vertical" />
      </nav>
    );
  }

  return (
    <div className="relative">
      <nav
        ref={scrollerRef}
        className="flex flex-row gap-1 overflow-x-auto px-4 pb-2 -mb-px"
      >
        <LinkList orientation="horizontal" />
      </nav>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 w-12 transition-opacity",
          "bg-gradient-to-r from-transparent to-background",
          moreRight ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}
