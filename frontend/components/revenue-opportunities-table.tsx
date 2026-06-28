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
};

function riskScoreColor(score: number): string {
  if (score >= 85) return "text-red-700 bg-red-50";
  if (score >= 70) return "text-amber-700 bg-amber-50";
  return "text-slate-700 bg-slate-100";
}

export function RevenueOpportunitiesTable({
  opportunities,
}: RevenueOpportunitiesTableProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-base font-semibold text-slate-900">
          Top Revenue Opportunities
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Real Miami coastal assets · OverStorm model predictions
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="px-6 py-3.5 font-medium text-slate-500">
                Asset
              </th>
              <th className="px-6 py-3.5 font-medium text-slate-500">
                <span title="OverStorm Proprietary Risk Model">Risk Score</span>
              </th>
              <th className="px-6 py-3.5 font-medium text-slate-500">
                Restoration Demand
              </th>
              <th className="px-6 py-3.5 font-medium text-slate-500">
                Predicted Revenue
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {opportunities.map((opportunity) => (
              <tr
                key={opportunity._id}
                className="transition-colors hover:bg-slate-50/60"
              >
                <td className="px-6 py-4">
                  <Link
                    href={`/agents?id=${opportunity._id}`}
                    className="group block"
                  >
                    <p className="font-medium text-slate-900 group-hover:text-sky-700">
                      {opportunity.propertyName}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {[opportunity.assetType, opportunity.city]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${riskScoreColor(opportunity.riskScore)}`}
                  >
                    {opportunity.riskScore}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium text-amber-800">
                    {opportunity.restorationDemandScore ?? opportunity.riskScore}
                  </span>
                  <p className="text-[10px] text-slate-400">OverStorm model</p>
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-900">
                    {formatCurrency(opportunity.expectedRevenue)}
                  </p>
                  <p className="text-[10px] text-slate-400">Predicted opportunity</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
