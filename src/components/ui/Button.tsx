import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none",
        fullWidth && "w-full",
        size === "sm" && "h-9 px-3 text-sm rounded-[var(--radius-btn)]",
        size === "md" && "h-12 px-5 text-base rounded-[var(--radius-btn)]",
        size === "lg" && "h-14 px-6 text-lg rounded-[var(--radius-btn)]",
        variant === "primary" &&
          "bg-brand-600 text-white shadow-[var(--shadow-float)] hover:bg-brand-700",
        variant === "secondary" &&
          "bg-surface text-text border border-border hover:bg-surface-3",
        variant === "ghost" && "bg-transparent text-text-muted hover:bg-surface-3",
        variant === "danger" && "bg-danger/10 text-danger hover:bg-danger/20",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
