"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { RevenueCapturePackageSection } from "@/components/revenue-capture-package";
import { RiskIntelligencePanel } from "@/components/risk-intelligence-panel";
import { formatCurrency } from "@/lib/format";
import { formatAgentStatus, statusStylesLight } from "@/lib/agents";

type PropertyDetailDrawerProps = {
  opportunityId: Id<"opportunities"> | null;
  onClose?: () => void;
  variant?: "overlay" | "inline";
};

export function PropertyDetailDrawer({
  opportunityId,
  onClose,
  variant = "overlay",
}: PropertyDetailDrawerProps) {
  const detail = useQuery(
    api.opportunities.getOpportunityDetail,
    opportunityId ? { opportunityId } : "skip",
  );
  const startDiscovery = useMutation(api.opportunities.startDiscovery);
  const [error, setError] = useState<string | null>(null);

  const isInline = variant === "inline";
  const isOpen = opportunityId !== null;
  const isDiscoveryRunning = detail?.isDiscoveryRunning ?? false;

  useEffect(() => {
    if (!isOpen || isInline || !onClose) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose?.();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, isInline, onClose]);

  async function handleRunDiscovery() {
    if (!opportunityId) return;
    setError(null);
    try {
      await startDiscovery({ opportunityId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Discovery failed");
    }
  }

  if (!isInline && !isOpen) return null;

  const content =
    !isOpen ? (
      <InlineEmptyState />
    ) : detail === undefined ? (
      <DrawerLoading />
    ) : detail === null ? (
      <p className="text-sm text-slate-500">Property not found.</p>
    ) : (
      <div className="space-y-6">
        <MetricsGrid
          riskScore={detail.opportunity.riskScore}
          restorationDemandScore={
            detail.opportunity.restorationDemandScore ??
            detail.opportunity.riskScore
          }
          expectedRevenue={detail.opportunity.expectedRevenue}
          status={detail.opportunity.status}
          storm={detail.storm.name}
          assetLocation={detail.opportunity.city ?? "—"}
          address={detail.opportunity.address}
          historicalLandfall={detail.storm.historicalLandfall}
          latitude={detail.opportunity.latitude}
          longitude={detail.opportunity.longitude}
        />

        {detail.riskIntelligence && (
          <RiskIntelligencePanel
            intelligence={detail.riskIntelligence}
            expectedRevenue={detail.opportunity.expectedRevenue}
          />
        )}

        <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Decision Maker Agent
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Fiber search anchored to map pin coordinates
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

          {isDiscoveryRunning && detail.decisionMakerAgent?.progressMessage && (
            <div className="mt-3 rounded-lg border border-sky-100 bg-sky-50/60 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" />
                <p className="text-xs font-medium text-sky-800">
                  {detail.decisionMakerAgent.progressMessage}
                </p>
              </div>
            </div>
          )}

          {detail.discoveryUnavailable && !isDiscoveryRunning && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-medium text-amber-900">
                No contact available
              </p>
              <p className="mt-1 text-xs text-amber-800">
                {detail.discoveryUnavailable.message}
              </p>
              <p className="mt-2 text-xs text-amber-700">
                Visit property:{" "}
                <span className="font-medium">
                  {detail.discoveryUnavailable.visitLocation}
                </span>
              </p>
              {detail.discoveryUnavailable.propertyPhone && (
                <p className="mt-2 text-xs text-amber-700">
                  Property line:{" "}
                  <span className="font-medium">
                    {detail.discoveryUnavailable.propertyPhone}
                  </span>
                </p>
              )}
              {detail.opportunity.propertyPhone &&
                !detail.discoveryUnavailable.propertyPhone && (
                  <p className="mt-2 text-xs text-amber-700">
                    Property line:{" "}
                    <span className="font-medium">
                      {detail.opportunity.propertyPhone}
                    </span>
                  </p>
                )}
              {detail.discoveryUnavailable.bestCandidate && (
                <p className="mt-1 text-[11px] text-amber-600">
                  Closest match: {detail.discoveryUnavailable.bestCandidate}
                  {detail.discoveryUnavailable.bestConfidence !== undefined &&
                    ` (${Math.round(detail.discoveryUnavailable.bestConfidence * 100)}%)`}
                </p>
              )}
            </div>
          )}

          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          {detail.decisionMakerAgent?.errorMessage && (
            <p className="mt-2 text-xs text-red-600">
              {detail.decisionMakerAgent.errorMessage}
            </p>
          )}
        </section>

        {opportunityId && (
          <RevenueCapturePackageSection
            opportunityId={opportunityId}
            decisionMaker={detail.decisionMaker}
            discoveryUnavailable={detail.discoveryUnavailable}
            companyEnrichment={detail.companyEnrichment}
            revenueCapturePackage={detail.revenueCapturePackage}
            outreachAgent={detail.outreachAgent}
            packageHistory={detail.packageHistory}
            isPackageRunning={detail.isPackageRunning}
          />
        )}
      </div>
    );

  const header = (
    <header className="flex shrink-0 items-start justify-between border-b border-slate-100 px-6 py-5">
      <div className="min-w-0 pr-4">
        {!isOpen ? (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-sky-600">
              Property Detail
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              Select a property
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Choose a row or click Open to view discovery and outreach workflows.
            </p>
          </>
        ) : detail === undefined ? (
          <div className="h-8 w-48 animate-pulse rounded bg-slate-100" />
        ) : (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-sky-600">
              Coastal Asset
            </p>
            <h2 className="mt-1 truncate text-xl font-semibold text-slate-900">
              {detail?.opportunity.propertyName ?? "—"}
            </h2>
            {(detail?.opportunity.assetType || detail?.opportunity.city) && (
              <p className="mt-0.5 text-xs text-slate-500">
                {[detail.opportunity.assetType, detail.opportunity.city]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </>
        )}
      </div>
      {!isInline && onClose && (
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
      )}
    </header>
  );

  if (isInline) {
    return (
      <aside
        aria-label="Property details"
        className="flex h-full flex-col border-l border-slate-200 bg-white"
      >
        {header}
        <div className="flex-1 overflow-y-auto px-6 py-6">{content}</div>
      </aside>
    );
  }

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
        {header}
        <div className="flex-1 overflow-y-auto px-6 py-6">{content}</div>
      </aside>
    </>
  );
}

function InlineEmptyState() {
  return (
    <div className="flex h-full min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 text-center">
      <p className="text-sm font-medium text-slate-700">No property selected</p>
      <p className="mt-1 max-w-xs text-xs text-slate-500">
        Pick a coastal asset from the list to run discovery and generate a revenue
        capture package.
      </p>
    </div>
  );
}

function MetricsGrid({
  riskScore,
  restorationDemandScore,
  expectedRevenue,
  status,
  storm,
  assetLocation,
  address,
  historicalLandfall,
  latitude,
  longitude,
}: {
  riskScore: number;
  restorationDemandScore: number;
  expectedRevenue: number;
  status: string;
  storm: string;
  assetLocation: string;
  address?: string;
  historicalLandfall?: string;
  latitude?: number;
  longitude?: number;
}) {
  const coordinateLabel =
    latitude !== undefined && longitude !== undefined
      ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
      : "Not geocoded";

  const items = [
    {
      label: "Risk Score",
      value: `${riskScore}`,
      hint: "OverStorm model",
    },
    {
      label: "Restoration Demand",
      value: `${restorationDemandScore}`,
      hint: "OverStorm model",
    },
    {
      label: "Predicted Revenue",
      value: formatCurrency(expectedRevenue),
      hint: "Opportunity",
    },
    { label: "Status", value: formatStatus(status) },
    { label: "Storm Replay", value: storm },
    {
      label: "Asset Location",
      value: address ?? assetLocation,
      hint: address ? "Street address" : undefined,
    },
    { label: "Map Coordinates", value: coordinateLabel, hint: "Map pin" },
    ...(historicalLandfall
      ? [{ label: "Historical Landfall", value: historicalLandfall }]
      : []),
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
          {item.hint && (
            <p className="mt-0.5 text-[10px] text-slate-400">{item.hint}</p>
          )}
        </div>
      ))}
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
