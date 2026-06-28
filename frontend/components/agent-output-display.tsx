import { formatCurrency } from "@/lib/format";
import type { AgentOutput } from "@/lib/agents";

type AgentOutputDisplayProps = {
  agentType: string;
  output: AgentOutput | null;
};

export function AgentOutputDisplay({
  agentType,
  output,
}: AgentOutputDisplayProps) {
  if (!output) return null;

  switch (agentType) {
    case "risk":
      return (
        <div className="space-y-3">
          <OutputRow label="Risk Score" value={`${output.riskScore ?? "—"}`} />
          {output.reasoning && output.reasoning.length > 0 && (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Reasoning
              </p>
              <ul className="mt-2 space-y-1.5">
                {output.reasoning.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-slate-300"
                  >
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-sky-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );

    case "revenue":
      return (
        <div className="space-y-3">
          <OutputRow
            label="Expected Revenue"
            value={formatCurrency(output.expectedRevenue ?? 0)}
            highlight
          />
          <OutputRow
            label="Priority Rank"
            value={`#${output.priorityRank ?? "—"}`}
          />
          {output.revenueSummary && (
            <p className="text-sm leading-relaxed text-slate-400">
              {output.revenueSummary}
            </p>
          )}
        </div>
      );

    case "decision_maker":
      if (output.availability === "unavailable") {
        return (
          <div className="space-y-3">
            <OutputRow label="Status" value="Visit recommended" highlight />
            {output.message && (
              <p className="text-sm leading-relaxed text-slate-400">
                {output.message}
              </p>
            )}
            {output.visitLocation && (
              <OutputRow label="Visit" value={output.visitLocation} />
            )}
            {output.bestCandidate && (
              <OutputRow label="Closest match" value={output.bestCandidate} />
            )}
          </div>
        );
      }

      return (
        <div className="space-y-3">
          <OutputRow label="Company" value={output.company ?? "—"} />
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Contact
            </p>
            <p className="mt-1 text-sm font-medium text-slate-200">
              {output.contactName ?? "—"}
            </p>
            <p className="text-sm text-slate-400">
              {output.contactTitle ?? ""}
            </p>
          </div>
        </div>
      );

    case "outreach":
      return (
        <div className="space-y-3">
          <OutputRow
            label="Status"
            value={output.emailDraftReady ? "Email Draft Ready" : "Pending"}
            highlight
          />
          {output.outreachRecommendation && (
            <p className="text-sm leading-relaxed text-slate-400">
              {output.outreachRecommendation}
            </p>
          )}
          {output.emailDraft && (
            <div className="rounded-lg border border-slate-700/80 bg-slate-950/60 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Draft Preview
              </p>
              <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-400">
                {output.emailDraft.slice(0, 280)}
                {output.emailDraft.length > 280 ? "…" : ""}
              </p>
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
}

function OutputRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 text-sm ${highlight ? "text-lg font-semibold text-white" : "font-medium text-slate-200"}`}
      >
        {value}
      </p>
    </div>
  );
}
