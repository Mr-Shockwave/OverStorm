"use client";

import { useQuery } from "convex/react";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { PropertyDetailDrawer } from "@/components/property-detail-drawer";
import {
  discoveryStatusStyles,
  formatDiscoveryStatus,
  formatPackageStatus,
  packageStatusStyles,
  type DiscoveryStatus,
  type PackageStatus,
} from "@/lib/agents";
import { formatCurrency } from "@/lib/format";
import { useOpportunityDrawer } from "@/lib/use-opportunity-drawer";

export function OpportunitiesWorkspace() {
  const controlCenter = useQuery(api.agents.getAgentControlCenter);
  const { selectedId, openOpportunity } = useOpportunityDrawer();

  const isLoading = controlCenter === undefined;

  useEffect(() => {
    if (!controlCenter?.opportunities.length || selectedId) return;
    openOpportunity(controlCenter.opportunities[0]._id);
  }, [controlCenter, openOpportunity, selectedId]);

  if (isLoading) {
    return (
      <AppShell>
        <WorkspaceLoading />
      </AppShell>
    );
  }

  if (!controlCenter?.storm || controlCenter.opportunities.length === 0) {
    return (
      <AppShell>
        <main className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-slate-500">
            No active storm data. Run the Convex seed to populate the database.
          </p>
        </main>
      </AppShell>
    );
  }

  const { storm, opportunities } = controlCenter;

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-4.25rem)] flex-col">
        <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start gap-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-600">
                  Operating Workspace
                </p>
                {storm.isHistoricalReplay && (
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-800">
                    Historical Replay
                  </span>
                )}
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                Opportunities
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {storm.name}
                {storm.location ? ` · ${storm.location}` : ""} ·{" "}
                {opportunities.length} properties
              </p>
              {storm.historicalLandfall && (
                <p className="mt-0.5 text-xs text-slate-400">
                  {storm.historicalLandfall}
                  {storm.category ? ` · ${storm.category}` : ""}
                </p>
              )}
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm">
                  <tr className="border-b border-slate-200">
                    <th className="px-5 py-3 font-medium text-slate-500">
                      Property
                    </th>
                    <th className="px-5 py-3 font-medium text-slate-500">
                      Risk
                    </th>
                    <th className="px-5 py-3 font-medium text-slate-500">
                      Discovery
                    </th>
                    <th className="px-5 py-3 font-medium text-slate-500">
                      Package
                    </th>
                    <th className="px-5 py-3 font-medium text-slate-500">
                      Revenue
                    </th>
                    <th className="px-5 py-3 text-right font-medium text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {opportunities.map((opportunity) => {
                    const discoveryRunning =
                      opportunity.discoveryStatus === "running";
                    const packageRunning =
                      opportunity.packageStatus === "running";
                    const isSelected = selectedId === opportunity._id;

                    return (
                      <tr
                        key={opportunity._id}
                        className={`cursor-pointer transition-colors hover:bg-sky-50/50 ${
                          isSelected ? "bg-sky-50" : ""
                        }`}
                        onClick={() => openOpportunity(opportunity._id)}
                      >
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-slate-900">
                            {opportunity.propertyName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {[opportunity.assetType, opportunity.city]
                              .filter(Boolean)
                              .join(" · ")}
                            {opportunity.priorityRank
                              ? ` · #${opportunity.priorityRank}`
                              : ""}
                          </p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-slate-900">
                            {opportunity.riskScore}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge
                            label={formatDiscoveryStatus(
                              opportunity.discoveryStatus as DiscoveryStatus,
                            )}
                            className={discoveryStatusStyles(
                              opportunity.discoveryStatus as DiscoveryStatus,
                            )}
                            spinning={discoveryRunning}
                          />
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge
                            label={formatPackageStatus(
                              opportunity.packageStatus as PackageStatus,
                            )}
                            className={packageStatusStyles(
                              opportunity.packageStatus as PackageStatus,
                            )}
                            spinning={packageRunning}
                          />
                        </td>
                        <td className="px-5 py-3.5 font-medium text-slate-900">
                          {formatCurrency(opportunity.expectedRevenue, true)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openOpportunity(opportunity._id);
                            }}
                            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-white"
                          >
                            Open
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="h-[45vh] w-full shrink-0 lg:h-auto lg:w-[420px]">
            <PropertyDetailDrawer
              variant="inline"
              opportunityId={selectedId}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function StatusBadge({
  label,
  className,
  spinning = false,
}: {
  label: string;
  className: string;
  spinning?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${className}`}
    >
      {spinning && (
        <span className="h-2.5 w-2.5 animate-spin rounded-full border border-current border-t-transparent" />
      )}
      {label}
    </span>
  );
}

function WorkspaceLoading() {
  return (
    <div className="flex h-[calc(100vh-4.25rem)] flex-col">
      <div className="h-24 animate-pulse border-b border-slate-200 bg-slate-100" />
      <div className="flex flex-1">
        <div className="flex-1 animate-pulse bg-slate-50" />
        <div className="hidden w-[420px] animate-pulse bg-slate-100 lg:block" />
      </div>
    </div>
  );
}
