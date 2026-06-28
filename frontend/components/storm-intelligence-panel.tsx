import { formatCurrency } from "@/lib/format";

type StormData = {
  name: string;
  location: string;
  riskScore: number;
  hoursUntilLandfall: number;
  expectedRevenueImpact: number;
};

type StormIntelligencePanelProps = {
  storm: StormData;
};

export function StormIntelligencePanel({ storm }: StormIntelligencePanelProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-base font-semibold text-slate-900">
          Storm Intelligence
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Active weather event monitoring
        </p>
      </div>

      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-sky-600">
              Active Storm
            </p>
            <h3 className="mt-1.5 text-xl font-semibold text-slate-900">
              {storm.name}
            </h3>
            <p className="mt-1 text-sm text-slate-500">{storm.location}</p>
          </div>

          <div className="rounded-lg bg-red-50 px-4 py-2.5 text-right">
            <p className="text-xs font-medium text-red-600">Risk Level</p>
            <p className="text-2xl font-bold text-red-700">{storm.riskScore}%</p>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-emerald-700">
            Expected Revenue Impact
          </p>
          <p className="mt-1.5 text-3xl font-bold tracking-tight text-emerald-900">
            {formatCurrency(storm.expectedRevenueImpact, true)}
          </p>
        </div>

        <div className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3.5">
          <svg
            className="h-5 w-5 shrink-0 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">
              {storm.hoursUntilLandfall} hours
            </span>{" "}
            until landfall
          </p>
        </div>

        <div
          className="flex min-h-[220px] items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-sky-50/40"
          role="img"
          aria-label="Storm map placeholder"
        >
          <div className="text-center">
            <svg
              className="mx-auto h-10 w-10 text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
              />
            </svg>
            <p className="mt-3 text-sm font-medium text-slate-500">
              Storm Map (Coming Soon)
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
