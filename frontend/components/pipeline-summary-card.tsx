import { formatNumber } from "@/lib/format";

type PipelineData = {
  found: number;
  contacted: number;
  responded: number;
  meetings: number;
};

type PipelineSummaryCardProps = {
  pipeline: PipelineData;
};

const stages = [
  { key: "found" as const, label: "Found" },
  { key: "contacted" as const, label: "Contacted" },
  { key: "responded" as const, label: "Responded" },
  { key: "meetings" as const, label: "Meetings" },
];

export function PipelineSummaryCard({ pipeline }: PipelineSummaryCardProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-base font-semibold text-slate-900">
          Pipeline Summary
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Outreach funnel for current storm event
        </p>
      </div>

      <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-4">
        {stages.map((stage) => (
          <div
            key={stage.key}
            className="bg-white px-6 py-5 text-center sm:py-6"
          >
            <p className="text-2xl font-semibold text-slate-900">
              {formatNumber(pipeline[stage.key])}
            </p>
            <p className="mt-1.5 text-sm text-slate-500">{stage.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
