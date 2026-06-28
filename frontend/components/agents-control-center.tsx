"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AppShell } from "@/components/app-shell";
import { AgentWorkflowDiagram } from "@/components/agent-workflow-diagram";
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

export function AgentsControlCenter() {
  const controlCenter = useQuery(api.agents.getAgentControlCenter);
  const startDiscovery = useMutation(api.opportunities.startDiscovery);
  const startPackage = useMutation(api.opportunities.startPackageGeneration);
  const repairStuckRuns = useMutation(api.agents.repairStuckRuns);
  const { selectedId, openOpportunity, closeDrawer } = useOpportunityDrawer();
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyOpportunityId, setBusyOpportunityId] =
    useState<Id<"opportunities"> | null>(null);

  const isLoading = controlCenter === undefined;

  async function handleDiscovery(opportunityId: Id<"opportunities">) {
    setActionError(null);
    setBusyOpportunityId(opportunityId);
    try {
      await startDiscovery({ opportunityId });
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to start discovery",
      );
    } finally {
      setBusyOpportunityId(null);
    }
  }

  async function handlePackage(opportunityId: Id<"opportunities">) {
    setActionError(null);
    setBusyOpportunityId(opportunityId);
    try {
      await startPackage({ opportunityId });
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to start package generation",
      );
    } finally {
      setBusyOpportunityId(null);
    }
  }

  async function handleRepairStuckRuns() {
    setActionError(null);
    try {
      await repairStuckRuns({});
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to repair stuck runs",
      );
    }
  }

  if (isLoading) {
    return (
      <AppShell>
        <AgentsLoading />
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

  const { storm, opportunities, summary, recentActivity } = controlCenter;

  return (
    <AppShell>
      <div className="bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-400">
                  AI Operations Center
                </p>
                {storm.isHistoricalReplay && (
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">
                    Historical Replay
                  </span>
                )}
              </div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Agent Fleet Status
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Per-property discovery and revenue package workflows under{" "}
                <span className="text-slate-200">{storm.name}</span>
                {storm.location ? ` · ${storm.location}` : ""}.
              </p>
              {storm.historicalLandfall && (
                <p className="mt-1 text-xs text-slate-500">
                  {storm.historicalLandfall}
                  {storm.category ? ` · ${storm.category}` : ""}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleRepairStuckRuns}
              className="self-start rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-200 lg:self-end"
            >
              Repair stuck runs
            </button>
          </div>

          {summary && (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                label="Tracked Assets"
                value={String(summary.totalProperties)}
                hint="Miami coastal portfolio"
              />
              <SummaryCard
                label="Contacts Found"
                value={String(summary.discoveryFound)}
                hint={
                  summary.discoveryRunning > 0
                    ? `${summary.discoveryRunning} discovery running`
                    : "Fiber discovery"
                }
              />
              <SummaryCard
                label="Packages Ready"
                value={String(summary.packagesCompleted)}
                hint={
                  summary.packagesRunning > 0
                    ? `${summary.packagesRunning} generating`
                    : "Revenue capture"
                }
              />
              <SummaryCard
                label="Pipeline Meetings"
                value={String(summary.pipeline?.meetings ?? 0)}
                hint={`${summary.pipeline?.contacted ?? 0} contacted`}
              />
            </div>
          )}

          <div className="mt-8">
            <AgentWorkflowDiagram />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Property Agent Status
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Run discovery and packages per property, or open in Opportunities
            </p>
          </div>
        </div>

        {actionError && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </p>
        )}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-5 py-3.5 font-medium text-slate-500">
                    Property
                  </th>
                  <th className="px-5 py-3.5 font-medium text-slate-500">
                    Risk
                  </th>
                  <th className="px-5 py-3.5 font-medium text-slate-500">
                    Discovery
                  </th>
                  <th className="px-5 py-3.5 font-medium text-slate-500">
                    Package
                  </th>
                  <th className="px-5 py-3.5 font-medium text-slate-500">
                    Revenue
                  </th>
                  <th className="px-5 py-3.5 text-right font-medium text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {opportunities.map((opportunity) => {
                  const isBusy = busyOpportunityId === opportunity._id;
                  const discoveryRunning = opportunity.discoveryStatus === "running";
                  const packageRunning = opportunity.packageStatus === "running";
                  const canRunPackage =
                    opportunity.hasDecisionMaker &&
                    !packageRunning &&
                    opportunity.packageStatus !== "completed";

                  return (
                    <tr
                      key={opportunity._id}
                      className={`hover:bg-slate-50/60 ${
                        selectedId === opportunity._id ? "bg-sky-50/80" : ""
                      }`}
                    >
                      <td className="px-5 py-4">
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
                      <td className="px-5 py-4">
                        <div>
                          <span className="font-semibold text-slate-900">
                            {opportunity.riskScore}
                          </span>
                          <p className="text-[11px] text-slate-500">
                            demand {opportunity.restorationDemandScore}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge
                          label={formatDiscoveryStatus(
                            opportunity.discoveryStatus as DiscoveryStatus,
                          )}
                          detail={opportunity.discoveryLabel}
                          className={discoveryStatusStyles(
                            opportunity.discoveryStatus as DiscoveryStatus,
                          )}
                          spinning={discoveryRunning}
                        />
                        {opportunity.discoveryErrorMessage && (
                          <p className="mt-1 text-[11px] text-red-600">
                            {opportunity.discoveryErrorMessage}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge
                          label={formatPackageStatus(
                            opportunity.packageStatus as PackageStatus,
                          )}
                          detail={opportunity.packageLabel}
                          className={packageStatusStyles(
                            opportunity.packageStatus as PackageStatus,
                          )}
                          spinning={packageRunning}
                        />
                        {opportunity.packageErrorMessage && (
                          <p className="mt-1 text-[11px] text-red-600">
                            {opportunity.packageErrorMessage}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-900">
                        {formatCurrency(opportunity.expectedRevenue, true)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openOpportunity(opportunity._id)}
                            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                          >
                            Open
                          </button>
                          <button
                            type="button"
                            disabled={isBusy || discoveryRunning}
                            onClick={() => handleDiscovery(opportunity._id)}
                            className="rounded-md border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {discoveryRunning ? "Discovering…" : "Discover"}
                          </button>
                          <button
                            type="button"
                            disabled={isBusy || !canRunPackage}
                            onClick={() => handlePackage(opportunity._id)}
                            className="rounded-md border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800 transition-colors hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {packageRunning ? "Generating…" : "Package"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {recentActivity.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Recent Activity
            </h2>
            <div className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
              {recentActivity.map((entry) => (
                <div
                  key={entry._id}
                  className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {entry.propertyName}
                    </p>
                    <p className="text-xs capitalize text-slate-500">
                      {entry.type === "discovery"
                        ? "Decision maker discovery"
                        : "Revenue package"}
                    </p>
                  </div>
                  <p className="max-w-md text-sm text-slate-500">{entry.label}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <PropertyDetailDrawer
        opportunityId={selectedId}
        onClose={closeDrawer}
      />
    </AppShell>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p>
    </div>
  );
}

function StatusBadge({
  label,
  detail,
  className,
  spinning = false,
}: {
  label: string;
  detail?: string;
  className: string;
  spinning?: boolean;
}) {
  return (
    <div>
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${className}`}
      >
        {spinning && (
          <span className="h-2.5 w-2.5 animate-spin rounded-full border border-current border-t-transparent" />
        )}
        {label}
      </span>
      {detail && (
        <p className="mt-1 max-w-[180px] truncate text-xs text-slate-500">
          {detail}
        </p>
      )}
    </div>
  );
}

function AgentsLoading() {
  return (
    <div className="bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-28 animate-pulse rounded-lg bg-slate-800/50" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg bg-slate-800/40"
            />
          ))}
        </div>
        <div className="mt-8 h-32 animate-pulse rounded-xl bg-slate-800/50" />
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-96 animate-pulse rounded-xl bg-slate-200/70" />
      </div>
    </div>
  );
}
