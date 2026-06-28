import { ReactNode } from "react";
import { Navbar } from "@/components/navbar";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-full bg-slate-50">
      <Navbar />
      {children}
    </div>
  );
}
