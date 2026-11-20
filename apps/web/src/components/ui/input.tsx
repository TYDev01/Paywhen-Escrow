import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-md border border-border bg-surface px-3.5 text-sm text-fg placeholder:text-fg-muted/70 focus-visible:border-primary focus-visible:outline-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export function Field({
  label,
  htmlFor,
  description,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-fg">
        {label}
      </label>
      {children}
      {description && (
        <p id={`${htmlFor}-description`} className="text-sm text-fg-muted">
          {description}
        </p>
      )}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
