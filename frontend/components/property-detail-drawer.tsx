"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { RevenueCapturePackageSection } from "@/components/revenue-capture-package";
import { formatCurrency } from "@/lib/format";
import { formatAgentStatus, statusStylesLight } from "@/lib/agents";

type PropertyDetailDrawerProps = {
  opportunityId: Id<"opportunities"> | null;
  onClose: () => void;
};

export function PropertyDetailDrawer({
  opportunityId,
  onClose,
}: PropertyDetailDrawerProps) {
  const detail = useQuery(
    api.opportunities.getOpportunityDetail,
    opportunityId ? { opportunityId } : "skip",
  );
  const startDiscovery = useMutation(api.opportunities.startDiscovery);
  const [error, setError] = useState<string | null>(null);

  const isOpen = opportunityId !== null;
  const isDiscoveryRunning = detail?.isDiscoveryRunning ?? false;

  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  async function handleRunDiscovery() {
    if (!opportunityId) return;
    setError(null);
    try {
      await startDiscovery({ opportunityId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Discovery failed");
    }
  }

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Property details"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div className="min-w-0 pr-4">
            {detail === undefined ? (
              <div className="h-8 w-48 animate-pulse rounded bg-slate-100" />
            ) : (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-sky-600">
                  Property Detail
                </p>
                <h2 className="mt-1 truncate text-xl font-semibold text-slate-900">
                  {detail?.opportunity.propertyName ?? "—"}
                </h2>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close drawer"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {detail === undefined ? (
            <DrawerLoading />
          ) : detail === null ? (
            <p className="text-sm text-slate-500">Property not found.</p>
          ) : (
            <div className="space-y-6">
              <MetricsGrid
                riskScore={detail.opportunity.riskScore}
                expectedRevenue={detail.opportunity.expectedRevenue}
                status={detail.opportunity.status}
                storm={detail.storm.name}
                location={detail.storm.location}
              />

              <ExplanationBlock
                title="Risk Explanation"
                content={detail.riskExplanation}
              />
              <ExplanationBlock
                title="Revenue Explanation"
                content={detail.revenueExplanation}
              />

              <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Decision Maker Agent
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Discover property contacts via Fiber
                    </p>
                  </div>
                  {detail.decisionMakerAgent && (
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${statusStylesLight(detail.decisionMakerAgent.status)}`}
                    >
                      {formatAgentStatus(detail.decisionMakerAgent.status)}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleRunDiscovery}
                  disabled={isDiscoveryRunning}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDiscoveryRunning ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Running Discovery…
                    </>
                  ) : (
                    "Run Discovery"
                  )}
                </button>

                {error && (
                  <p className="mt-2 text-xs text-red-600">{error}</p>
                )}
                {detail.decisionMakerAgent?.errorMessage && (
                  <p className="mt-2 text-xs text-red-600">
                    {detail.decisionMakerAgent.errorMessage}
                  </p>
                )}
              </section>

              <RevenueCapturePackageSection
                opportunityId={opportunityId}
                decisionMaker={detail.decisionMaker}
                companyEnrichment={detail.companyEnrichment}
                revenueCapturePackage={detail.revenueCapturePackage}
                outreachAgent={detail.outreachAgent}
                packageHistory={detail.packageHistory}
                isPackageRunning={detail.isPackageRunning}
              />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function MetricsGrid({
  riskScore,
  expectedRevenue,
  status,
  storm,
  location,
}: {
  riskScore: number;
  expectedRevenue: number;
  status: string;
  storm: string;
  location: string;
}) {
  const items = [
    { label: "Risk Score", value: `${riskScore}` },
    { label: "Expected Revenue", value: formatCurrency(expectedRevenue) },
    { label: "Status", value: formatStatus(status) },
    { label: "Storm", value: storm },
    { label: "Location", value: location },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-slate-200 bg-white px-4 py-3"
        >
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            {item.label}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function ExplanationBlock({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{content}</p>
    </div>
  );
}

function formatStatus(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function DrawerLoading() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
      <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
      <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
    </div>
  );
}
