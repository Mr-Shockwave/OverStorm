import Link from "next/link";
import { formatCurrency } from "@/lib/format";

type Opportunity = {
  _id: string;
  propertyName: string;
  assetType?: string;
  city?: string;
  riskScore: number;
  restorationDemandScore?: number;
  expectedRevenue: number;
  status: string;
};

type RevenueOpportunitiesTableProps = {
  opportunities: Opportunity[];
  compact?: boolean;
};

function riskScoreColor(score: number): string {
  if (score >= 85) return "text-red-700 bg-red-50";
  if (score >= 70) return "text-amber-700 bg-amber-50";
  return "text-slate-700 bg-slate-100";
}

export function RevenueOpportunitiesTable({
  opportunities,
  compact = false,
}: RevenueOpportunitiesTableProps) {
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div
        className={`shrink-0 border-b border-slate-100 ${compact ? "px-4 py-3" : "px-6 py-5"}`}
      >
        <h2
          className={`font-semibold text-slate-900 ${compact ? "text-sm" : "text-base"}`}
        >
          Top Revenue Opportunities
        </h2>
        {!compact && (
          <p className="mt-1 text-sm text-slate-500">
            Real Miami coastal assets · OverStorm model predictions
          </p>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm">
            <tr className="border-b border-slate-100">
              <th
                className={`font-medium text-slate-500 ${compact ? "px-4 py-2.5 text-xs" : "px-6 py-3.5"}`}
              >
                Asset
              </th>
              <th
                className={`font-medium text-slate-500 ${compact ? "px-3 py-2.5 text-xs" : "px-6 py-3.5"}`}
              >
                Risk
              </th>
              {!compact && (
                <th className="px-6 py-3.5 font-medium text-slate-500">
                  Restoration Demand
                </th>
              )}
              <th
                className={`font-medium text-slate-500 ${compact ? "px-3 py-2.5 text-xs" : "px-6 py-3.5"}`}
              >
                Revenue
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {opportunities.map((opportunity) => (
              <tr
                key={opportunity._id}
                className="transition-colors hover:bg-slate-50/60"
              >
                <td className={compact ? "px-4 py-3" : "px-6 py-4"}>
                  <Link
                    href={`/opportunities?id=${opportunity._id}`}
                    className="group block"
                  >
                    <p
                      className={`font-medium text-slate-900 group-hover:text-sky-700 ${compact ? "text-xs leading-snug" : ""}`}
                    >
                      {opportunity.propertyName}
                    </p>
                    {!compact && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        {[opportunity.assetType, opportunity.city]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </Link>
                </td>
                <td className={compact ? "px-3 py-3" : "px-6 py-4"}>
                  <span
                    className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${riskScoreColor(opportunity.riskScore)}`}
                  >
                    {opportunity.riskScore}
                  </span>
                </td>
                {!compact && (
                  <td className="px-6 py-4">
                    <span className="font-medium text-amber-800">
                      {opportunity.restorationDemandScore ?? opportunity.riskScore}
                    </span>
                    <p className="text-[10px] text-slate-400">OverStorm model</p>
                  </td>
                )}
                <td className={compact ? "px-3 py-3" : "px-6 py-4"}>
                  <p
                    className={`font-medium text-slate-900 ${compact ? "text-xs" : ""}`}
                  >
                    {formatCurrency(opportunity.expectedRevenue, compact)}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
