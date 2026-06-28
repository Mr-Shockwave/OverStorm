"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";
import {
  breakdownBarColor,
  type RiskIntelligenceData,
} from "@/lib/risk-model";

type RiskIntelligencePanelProps = {
  intelligence: RiskIntelligenceData;
  expectedRevenue: number;
};

export function RiskIntelligencePanel({
  intelligence,
  expectedRevenue,
}: RiskIntelligencePanelProps) {
  const [showBreakdown, setShowBreakdown] = useState(true);
  const [showMethodology, setShowMethodology] = useState(false);

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-sky-600">
              Risk Intelligence
            </p>
            <h3 className="mt-1 text-sm font-semibold text-slate-900">
              {intelligence.modelName}
            </h3>
            <p className="mt-0.5 text-[10px] text-slate-400">
              Not a FEMA formula · proprietary OverStorm scoring
            </p>
          </div>
          <div className="rounded-lg bg-red-50 px-3 py-2 text-right">
            <p className="text-[10px] font-medium uppercase tracking-wider text-red-600">
              Risk Score
            </p>
            <p className="text-2xl font-bold text-red-700">
              {intelligence.riskScore}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Why This Property Is At Risk
          </h4>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            {intelligence.whyAtRisk}
          </p>
        </div>

        <ExpandableToggle
          label="View Risk Breakdown"
          expanded={showBreakdown}
          onToggle={() => setShowBreakdown((value) => !value)}
        />

        {showBreakdown && intelligence.breakdown.length > 0 && (
          <div className="space-y-3 rounded-lg border border-slate-200 px-4 py-4">
            {intelligence.breakdown.map((item) => (
              <div key={item.key}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{item.label}</span>
                  <span className="text-slate-500">
                    {item.score}{" "}
                    <span className="text-slate-400">
                      · {item.weightPercent}% weight · +{item.contribution}
                    </span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${breakdownBarColor(item.score)}`}
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
            <p className="border-t border-slate-100 pt-3 text-[11px] text-slate-500">
              Composite Risk Score ={" "}
              {intelligence.formula
                .map((f) => `${f.label} (${f.weightPercent}%)`)
                .join(" + ")}
            </p>
          </div>
        )}

        <ExpandableToggle
          label="View Methodology"
          expanded={showMethodology}
          onToggle={() => setShowMethodology((value) => !value)}
        />

        {showMethodology && (
          <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-4 text-sm">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Risk Model
              </h4>
              <p className="mt-2 text-slate-700">
                The {intelligence.modelName} combines five weighted factors
                (0–100 each) into a composite score:
              </p>
              <ul className="mt-2 space-y-1 text-xs text-slate-600">
                {intelligence.formula.map((factor) => (
                  <li key={factor.label}>
                    <span className="font-medium text-slate-800">
                      {factor.weightPercent}%
                    </span>{" "}
                    {factor.label}
                  </li>
                ))}
              </ul>
            </div>

            {intelligence.revenueModel && (
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Revenue Opportunity Model
                </h4>
                <p className="mt-2 font-mono text-xs text-slate-700">
                  {intelligence.revenueModel.formula}
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-slate-400">Risk Score</dt>
                    <dd className="font-semibold text-slate-900">
                      {intelligence.riskScore}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Asset Value Factor</dt>
                    <dd className="font-semibold text-slate-900">
                      {intelligence.revenueModel.assetValueFactor.toFixed(2)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Repair Complexity</dt>
                    <dd className="font-semibold text-slate-900">
                      {intelligence.revenueModel.repairComplexityFactor.toFixed(2)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Base Scale</dt>
                    <dd className="font-semibold text-slate-900">
                      {formatCurrency(intelligence.revenueModel.baseScale)}
                    </dd>
                  </div>
                </dl>
                <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-700">
                    Predicted Revenue Opportunity
                  </p>
                  <p className="mt-1 text-lg font-bold text-emerald-900">
                    {formatCurrency(expectedRevenue)}
                  </p>
                  <p className="mt-1 text-[10px] text-emerald-700">
                    {intelligence.revenueModel.disclaimer}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function ExpandableToggle({
  label,
  expanded,
  onToggle,
}: {
  label: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-left text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50"
    >
      {label}
      <svg
        className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}
