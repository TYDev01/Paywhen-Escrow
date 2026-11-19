import type { ReactNode } from "react";
import { Brand } from "@/components/ui/brand";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main id="main" className="auth-shell">
      <div className="auth-content">
        <div><Brand /></div>
        <div className="auth-form">
          <h1 className="editorial-title">{title}</h1>
          <p className="mt-4 text-fg-muted">{description}</p>
          {children}
        </div>
      </div>
      <div className="auth-art" aria-hidden="true" />
    </main>
  );
}
