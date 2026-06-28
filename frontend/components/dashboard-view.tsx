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
      <main className="flex min-h-[calc(100vh-4.25rem)] flex-col">
        <div className="h-[min(58vh,calc(100vh-4.25rem-12rem))] min-h-[380px] shrink-0">
          <StormIntelligenceMap
            stormName={dashboard.activeStorm.name}
            stormLocation={dashboard.activeStorm.location}
            hoursUntilLandfall={dashboard.activeStorm.hoursUntilLandfall}
            projectedRevenue={dashboard.metrics.projectedRevenue}
            propertiesAtRisk={dashboard.metrics.propertiesAtRisk}
            map={dashboard.map}
          />
        </div>

        <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <RevenueOpportunitiesTable
              opportunities={dashboard.opportunities}
            />
            <PipelineSummaryCard pipeline={dashboard.pipeline} />
          </div>
        </div>
      </main>
    </AppShell>
  );
}

function DashboardLoading() {
  return (
    <main className="flex min-h-[calc(100vh-4.25rem)] flex-col">
      <div className="h-[min(58vh,calc(100vh-4.25rem-12rem))] min-h-[380px] animate-pulse bg-slate-900" />
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-xl bg-slate-200/70" />
          <div className="h-40 animate-pulse rounded-xl bg-slate-200/70" />
        </div>
      </div>
    </main>
  );
}
