"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { PipelineSummaryCard } from "@/components/pipeline-summary-card";
import { RevenueOpportunitiesTable } from "@/components/revenue-opportunities-table";
import { StormIntelligenceMap } from "@/components/storm-intelligence-map";

export function DashboardView() {
  const dashboard = useQuery(api.dashboard.getDashboard);

  if (dashboard === undefined) {
    return (
      <AppShell>
        <DashboardLoading />
      </AppShell>
    );
  }

  if (
    !dashboard.activeStorm ||
    !dashboard.metrics ||
    !dashboard.pipeline ||
    !dashboard.map
  ) {
    return (
      <AppShell>
        <main className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-slate-500">
            No dashboard data available. Run the Convex seed to populate the
            database.
          </p>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="flex min-h-[calc(100vh-4.25rem)] flex-col lg:flex-row">
        <div className="min-h-[380px] flex-1 lg:min-h-0">
          <StormIntelligenceMap
            stormName={dashboard.activeStorm.name}
            stormLocation={dashboard.activeStorm.location}
            predictedRevenueOpportunity={
              dashboard.metrics.predictedRevenueOpportunity
            }
            propertiesAtRisk={dashboard.metrics.propertiesAtRisk}
            map={dashboard.map}
          />
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-4 border-t border-slate-200 bg-slate-50/50 p-4 lg:w-[380px] lg:border-t-0 lg:border-l">
          <PipelineSummaryCard pipeline={dashboard.pipeline} />
          <div className="min-h-0 flex-1 overflow-hidden">
            <RevenueOpportunitiesTable
              opportunities={dashboard.opportunities}
              compact
            />
          </div>
        </aside>
      </main>
    </AppShell>
  );
}

function DashboardLoading() {
  return (
    <main className="flex min-h-[calc(100vh-4.25rem)] flex-col lg:flex-row">
      <div className="min-h-[380px] flex-1 animate-pulse bg-slate-200" />
      <aside className="w-full space-y-4 border-t border-slate-200 p-4 lg:w-[380px] lg:border-t-0 lg:border-l">
        <div className="h-36 animate-pulse rounded-xl bg-slate-200/70" />
        <div className="h-64 animate-pulse rounded-xl bg-slate-200/70" />
      </aside>
    </main>
  );
}
