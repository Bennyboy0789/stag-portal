import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-black font-medium hover:bg-accent-strong active:bg-accent-strong",
  secondary:
    "bg-surface-2 text-foreground border border-border hover:border-border-strong",
  ghost: "text-muted hover:text-foreground hover:bg-surface-2",
  danger:
    "bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-11 md:h-10 px-4 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg transition-colors cursor-pointer",
        "disabled:opacity-50 disabled:pointer-events-none",
        "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
