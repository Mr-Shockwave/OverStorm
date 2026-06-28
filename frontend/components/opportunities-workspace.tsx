"use client";

import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AppShell } from "@/components/app-shell";
import { PropertyDetailDrawer } from "@/components/property-detail-drawer";
import { formatCurrency } from "@/lib/format";

function riskScoreColor(score: number): string {
  if (score >= 85) return "text-red-700 bg-red-50";
  if (score >= 70) return "text-amber-700 bg-amber-50";
  return "text-slate-700 bg-slate-100";
}

function formatStatus(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function OpportunitiesWorkspace() {
  const data = useQuery(api.opportunities.listOpportunities);
  const [selectedId, setSelectedId] = useState<Id<"opportunities"> | null>(
    null,
  );

  if (data === undefined) {
    return (
      <AppShell>
        <WorkspaceLoading />
      </AppShell>
    );
  }

  if (!data.storm) {
    return (
      <AppShell>
        <main className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-slate-500">
            No active storm data. Run the Convex seed to populate opportunities.
          </p>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-600">
              Operating Workspace
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Opportunities
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {data.storm.name} · {data.storm.location} ·{" "}
              {data.opportunities.length} properties
            </p>
          </div>
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Revenue Pipeline
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Select a property to open discovery workflow
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-6 py-3.5 font-medium text-slate-500">
                    Property
                  </th>
                  <th className="px-6 py-3.5 font-medium text-slate-500">
                    Risk
                  </th>
                  <th className="px-6 py-3.5 font-medium text-slate-500">
                    Revenue
                  </th>
                  <th className="px-6 py-3.5 font-medium text-slate-500">
                    Status
                  </th>
                  <th className="px-6 py-3.5 font-medium text-slate-500">
                    Rank
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.opportunities.map((opportunity) => (
                  <tr
                    key={opportunity._id}
                    onClick={() => setSelectedId(opportunity._id)}
                    className={`cursor-pointer transition-colors hover:bg-sky-50/50 ${
                      selectedId === opportunity._id ? "bg-sky-50/80" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">
                        {opportunity.propertyName}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${riskScoreColor(opportunity.riskScore)}`}
                      >
                        {opportunity.riskScore}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {formatCurrency(opportunity.expectedRevenue)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatStatus(opportunity.status)}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      #{opportunity.priorityRank ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <PropertyDetailDrawer
        opportunityId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </AppShell>
  );
}

function WorkspaceLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 h-20 animate-pulse rounded-lg bg-slate-200/70" />
      <div className="h-64 animate-pulse rounded-xl bg-slate-200/70" />
    </main>
  );
}
