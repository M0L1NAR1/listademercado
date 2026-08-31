import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, className, ...props }, ref) {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-text-muted">{label}</label>
        )}
        <input
          ref={ref}
          className={cn(
            "h-12 w-full rounded-[var(--radius-btn)] border border-border bg-surface px-4 text-base text-text placeholder:text-text-muted/60 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
            error && "border-danger focus:border-danger focus:ring-danger/20",
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    );
  }
);
