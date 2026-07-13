import { cn } from "@/lib/utils";

// text-base on small screens prevents iOS Safari's auto-zoom on focus;
// h-11 keeps touch targets ≥44px where fingers do the tapping.
const fieldClasses =
  "w-full rounded-lg border border-border-strong bg-surface-2 px-3 text-base md:text-sm text-foreground " +
  "placeholder:text-muted/80 transition-colors " +
  "focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/20";

export function Input({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(fieldClasses, "h-11 md:h-10", className)}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea className={cn(fieldClasses, "py-2.5", className)} {...props} />
  );
}

function ChevronDown() {
  return (
    <svg
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

export function Select({
  className,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          fieldClasses,
          "h-11 md:h-10 appearance-none pr-9 cursor-pointer",
          className
        )}
        {...props}
      />
      <ChevronDown />
    </div>
  );
}

export function Label({
  className,
  ...props
}: React.ComponentProps<"label">) {
  return (
    <label
      className={cn("block text-xs font-medium text-muted mb-1.5", className)}
      {...props}
    />
  );
}

export function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1.5 text-xs text-danger">{errors[0]}</p>;
}
