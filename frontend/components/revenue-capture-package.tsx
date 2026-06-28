"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { CopyButton } from "@/components/copy-button";
import { formatAgentStatus, statusStylesLight } from "@/lib/agents";

type CompanyEnrichment = {
  companyName: string;
  companyDescription?: string;
  employeeCount?: number;
  companySize?: string;
  industry?: string;
  headcountGrowth?: string;
  recentEvents?: string[];
  locations?: string[];
  website?: string;
  domain?: string;
  linkedinCompanyUrl?: string;
  enrichmentStatus: "full" | "limited";
  enrichedAt: number;
};

type RevenueCapturePackage = {
  _id: string;
  status: string;
  workflowLabel: string;
  limitedIntelligence: boolean;
  executiveSummary?: string;
  personalizedEmail?: string;
  linkedinMessage?: string;
  callScript?: string;
  aiReasoning?: string;
  startedAt: number;
  completedAt?: number;
  errorMessage?: string;
};

type PackageHistoryItem = {
  _id: string;
  status: string;
  workflowLabel: string;
  startedAt: number;
  completedAt?: number;
  limitedIntelligence: boolean;
};

type DecisionMaker = {
  company: string;
  contactName: string;
  contactTitle: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
};

type OutreachAgent = {
  status: string;
  startedAt?: number;
  completedAt?: number;
  errorMessage?: string;
};

type RevenueCapturePackageSectionProps = {
  opportunityId: Id<"opportunities">;
  decisionMaker: DecisionMaker | null;
  companyEnrichment: CompanyEnrichment | null;
  revenueCapturePackage: RevenueCapturePackage | null;
  outreachAgent: OutreachAgent | null;
  packageHistory: PackageHistoryItem[];
  isPackageRunning: boolean;
};

export function RevenueCapturePackageSection({
  opportunityId,
  decisionMaker,
  companyEnrichment,
  revenueCapturePackage,
  outreachAgent,
  packageHistory,
  isPackageRunning,
}: RevenueCapturePackageSectionProps) {
  const startPackage = useMutation(api.opportunities.startPackageGeneration);
  const [error, setError] = useState<string | null>(null);

  const pkg = revenueCapturePackage;
  const isComplete = pkg?.status === "completed";
  const showWorkflow =
    isPackageRunning && pkg && !isComplete && pkg.status !== "failed";

  async function handleGenerate() {
    setError(null);
    try {
      await startPackage({ opportunityId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start package");
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Revenue Capture Package
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Orange Slice enrichment + AI outreach package
            </p>
          </div>
          {outreachAgent && (
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${statusStylesLight(outreachAgent.status)}`}
              >
                {formatAgentStatus(outreachAgent.status)}
              </span>
              {outreachAgent.startedAt && (
                <span className="text-[10px] text-slate-400">
                  {outreachAgent.status === "running"
                    ? `Started ${formatTimestamp(outreachAgent.startedAt)}`
                    : outreachAgent.completedAt
                      ? `${formatTimestamp(outreachAgent.startedAt)} → ${formatTimestamp(outreachAgent.completedAt)}`
                      : formatTimestamp(outreachAgent.startedAt)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-5 p-5">
        {showWorkflow && (
          <div className="rounded-lg border border-sky-100 bg-sky-50/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" />
              <p className="text-sm font-medium text-sky-800">
                {pkg.workflowLabel}
              </p>
            </div>
          </div>
        )}

        {!decisionMaker ? (
          <p className="text-sm text-slate-500">
            Complete Fiber discovery to unlock package generation.
          </p>
        ) : (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isPackageRunning}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPackageRunning ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Generating Package…
              </>
            ) : (
              "Generate Revenue Capture Package"
            )}
          </button>
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}
        {pkg?.errorMessage && (
          <p className="text-xs text-red-600">{pkg.errorMessage}</p>
        )}

        {pkg?.limitedIntelligence && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm text-amber-800">
              Limited company intelligence available
            </p>
          </div>
        )}

        {decisionMaker && (
          <ContactSection contact={decisionMaker} />
        )}

        {isComplete && pkg && (
          <div className="space-y-5">
            <PackageBlock title="Executive Summary" content={pkg.executiveSummary} />

            {companyEnrichment && (
              <CompanySignals enrichment={companyEnrichment} />
            )}

            <PackageBlock
              title="Email"
              content={pkg.personalizedEmail}
              copyable
            />
            <PackageBlock
              title="LinkedIn Message"
              content={pkg.linkedinMessage}
              copyable
            />
            <PackageBlock
              title="Call Script"
              content={pkg.callScript}
              copyable
            />
            <PackageBlock title="AI Reasoning" content={pkg.aiReasoning} />

            {outreachAgent?.completedAt && (
              <p className="text-xs text-slate-400">
                Generated {formatTimestamp(outreachAgent.completedAt)}
              </p>
            )}
          </div>
        )}

        {packageHistory.length > 1 && (
          <div className="border-t border-slate-100 pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Generation History
            </p>
            <ul className="mt-2 space-y-2">
              {packageHistory.map((item) => (
                <li
                  key={item._id}
                  className="flex items-center justify-between text-xs text-slate-500"
                >
                  <span>{item.workflowLabel}</span>
                  <span>{formatTimestamp(item.completedAt ?? item.startedAt)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function ContactSection({ contact }: { contact: DecisionMaker }) {
  const fields = [
    { label: "Company", value: contact.company },
    { label: "Name", value: contact.contactName },
    { label: "Title", value: contact.contactTitle },
    contact.email && { label: "Email", value: contact.email, copyable: true },
    contact.phone && { label: "Phone", value: contact.phone, copyable: true },
    contact.linkedinUrl && {
      label: "LinkedIn",
      value: contact.linkedinUrl,
      copyable: true,
    },
  ].filter(Boolean) as Array<{
    label: string;
    value: string;
    copyable?: boolean;
  }>;

  return (
    <div className="rounded-lg border border-slate-200 px-4 py-4">
      <h4 className="text-sm font-semibold text-slate-900">Contact</h4>
      <dl className="mt-3 space-y-2.5">
        {fields.map((field) => (
          <div key={field.label} className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                {field.label}
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-slate-800 break-all">
                {field.value}
              </dd>
            </div>
            {field.copyable && <CopyButton value={field.value} />}
          </div>
        ))}
      </dl>
    </div>
  );
}

function CompanySignals({ enrichment }: { enrichment: CompanyEnrichment }) {
  const signals = [
    enrichment.industry && { label: "Industry", value: enrichment.industry },
    enrichment.employeeCount && {
      label: "Employees",
      value: enrichment.employeeCount.toLocaleString(),
    },
    enrichment.companySize && {
      label: "Company Size",
      value: enrichment.companySize,
    },
    enrichment.headcountGrowth && {
      label: "Headcount Growth",
      value: enrichment.headcountGrowth,
    },
    enrichment.domain && { label: "Domain", value: enrichment.domain },
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-4">
      <h4 className="text-sm font-semibold text-slate-900">Company Signals</h4>
      {enrichment.companyDescription && (
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {enrichment.companyDescription}
        </p>
      )}
      {signals.length > 0 && (
        <dl className="mt-3 grid grid-cols-2 gap-3">
          {signals.map((signal) => (
            <div key={signal.label}>
              <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                {signal.label}
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-slate-800">
                {signal.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {enrichment.recentEvents && enrichment.recentEvents.length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Recent Events
          </p>
          <ul className="mt-1.5 space-y-1">
            {enrichment.recentEvents.map((event) => (
              <li key={event} className="text-sm text-slate-600">
                {event}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PackageBlock({
  title,
  content,
  copyable = false,
}: {
  title: string;
  content?: string;
  copyable?: boolean;
}) {
  if (!content) return null;

  return (
    <div className="rounded-lg border border-slate-200 px-4 py-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        {copyable && <CopyButton value={content} />}
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
        {content}
      </p>
    </div>
  );
}

function formatTimestamp(ms: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ms));
}
