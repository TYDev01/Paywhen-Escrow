import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import "./workspace.css";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
