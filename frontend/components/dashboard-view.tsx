"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { PipelineSummaryCard } from "@/components/pipeline-summary-card";
import { RevenueOpportunitiesTable } from "@/components/revenue-opportunities-table";
import { StormIntelligencePanel } from "@/components/storm-intelligence-panel";
import { formatCurrency, formatNumber } from "@/lib/format";

export function DashboardView() {
  const dashboard = useQuery(api.dashboard.getDashboard);

  if (dashboard === undefined) {
    return (
      <AppShell>
        <DashboardLoading />
      </AppShell>
    );
  }

  if (!dashboard.activeStorm || !dashboard.metrics || !dashboard.pipeline) {
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

  const metrics = [
    {
      id: "properties-at-risk",
      label: "Properties At Risk",
      value: formatNumber(dashboard.metrics.propertiesAtRisk),
      description: "Properties in active storm impact zone",
    },
    {
      id: "high-priority",
      label: "High Priority Opportunities",
      value: formatNumber(dashboard.metrics.highPriorityOpportunities),
      description: "Opportunities above priority threshold",
    },
    {
      id: "projected-revenue",
      label: "Projected Revenue",
      value: formatCurrency(dashboard.metrics.projectedRevenue, true),
      description: "Total expected pipeline value",
    },
    {
      id: "meetings-booked",
      label: "Meetings Booked",
      value: formatNumber(dashboard.metrics.meetingsBooked),
      description: "Confirmed discovery calls this week",
    },
  ];

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Revenue Command Center
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Predict revenue before demand exists.
          </p>
        </div>

        <section
          aria-label="Key metrics"
          className="mb-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
        >
          {metrics.map((metric) => (
            <MetricCard
              key={metric.id}
              label={metric.label}
              value={metric.value}
              description={metric.description}
            />
          ))}
        </section>

        <section
          aria-label="Storm and opportunities"
          className="grid gap-6 lg:grid-cols-2"
        >
          <StormIntelligencePanel storm={dashboard.activeStorm} />

          <div className="flex flex-col gap-6">
            <RevenueOpportunitiesTable
              opportunities={dashboard.opportunities}
            />
            <PipelineSummaryCard pipeline={dashboard.pipeline} />
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function DashboardLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-10 h-16 animate-pulse rounded-lg bg-slate-200/70" />
      <div className="mb-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-xl bg-slate-200/70"
          />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-[520px] animate-pulse rounded-xl bg-slate-200/70" />
        <div className="space-y-6">
          <div className="h-64 animate-pulse rounded-xl bg-slate-200/70" />
          <div className="h-40 animate-pulse rounded-xl bg-slate-200/70" />
        </div>
      </div>
    </main>
  );
}
