"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatNumber } from "@/lib/format";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/agents", label: "Agents" },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const dashboard = useQuery(api.dashboard.getDashboard);

  const activeStormCount = dashboard?.activeStormCount ?? 0;
  const opportunityCount = dashboard?.opportunityCount ?? 0;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[4.25rem] items-center justify-between gap-6">
          <div className="flex min-w-0 items-center gap-6">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <div
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-700 shadow-sm"
              >
                <svg
                  className="h-4.5 w-4.5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-base font-semibold tracking-tight text-slate-900">
                  OverStorm
                </p>
                <p className="hidden text-[11px] leading-tight text-slate-500 sm:block">
                  Predictive Revenue Intelligence
                  <br />
                  for Disaster Recovery
                </p>
              </div>
            </Link>

            <nav
              aria-label="Main navigation"
              className="hidden items-center gap-1 md:flex"
            >
              {navLinks.map((link) => {
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden items-center gap-2 sm:flex">
              <StatusBadge
                label={`${activeStormCount} Active Storm${activeStormCount === 1 ? "" : "s"}`}
                variant="storm"
              />
              <StatusBadge
                label={`${formatNumber(opportunityCount)} Opportunities`}
                variant="neutral"
              />
            </div>
          </div>
        </div>

        <nav
          aria-label="Mobile navigation"
          className="flex gap-1 overflow-x-auto border-t border-slate-100 py-2 md:hidden"
        >
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

function StatusBadge({
  label,
  variant,
}: {
  label: string;
  variant: "storm" | "neutral";
}) {
  if (variant === "storm") {
    return (
      <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
        </span>
        <span className="whitespace-nowrap text-sm font-medium text-amber-800">
          {label}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
      <span className="whitespace-nowrap text-sm font-medium text-slate-700">
        {label}
      </span>
    </div>
  );
}
