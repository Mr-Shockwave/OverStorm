import { formatCurrency } from "@/lib/format";

type Opportunity = {
  _id: string;
  propertyName: string;
  riskScore: number;
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
          Ranked by expected revenue potential
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[400px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="px-6 py-3.5 font-medium text-slate-500">
                Property Name
              </th>
              <th className="px-6 py-3.5 font-medium text-slate-500">
                Risk Score
              </th>
              <th className="px-6 py-3.5 font-medium text-slate-500">
                Expected Revenue
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {opportunities.map((opportunity) => (
              <tr
                key={opportunity._id}
                className="transition-colors hover:bg-slate-50/60"
              >
                <td className="px-6 py-4 font-medium text-slate-900">
                  {opportunity.propertyName}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${riskScoreColor(opportunity.riskScore)}`}
                  >
                    {opportunity.riskScore}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-slate-900">
                  {formatCurrency(opportunity.expectedRevenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
