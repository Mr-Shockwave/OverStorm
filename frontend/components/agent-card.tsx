import {
  formatAgentStatus,
  statusStyles,
} from "@/lib/agents";
import { AgentOutputDisplay } from "@/components/agent-output-display";

import type { AgentResultData } from "@/lib/agents";

type AgentCardProps = {
  title: string;
  description: string;
  result: AgentResultData | undefined;
};

export function AgentCard({ title, description, result }: AgentCardProps) {
  const status = result?.status ?? "pending";
  const isRunning = status === "running";

  return (
    <article
      className={`relative overflow-hidden rounded-xl border bg-slate-900/80 transition-all ${
        isRunning
          ? "border-sky-500/50 shadow-lg shadow-sky-500/10"
          : "border-slate-800"
      }`}
    >
      {isRunning && (
        <div className="absolute inset-x-0 top-0 h-0.5 animate-pulse bg-gradient-to-r from-transparent via-sky-400 to-transparent" />
      )}

      <div className="border-b border-slate-800 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          </div>
          <span
            className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${statusStyles(status)}`}
          >
            {formatAgentStatus(status)}
          </span>
        </div>
      </div>

      <div className="min-h-[180px] px-5 py-4">
        {isRunning ? (
          <div className="flex h-full min-h-[140px] flex-col items-center justify-center gap-3">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400" />
            <p className="text-sm text-slate-400">Processing analysis…</p>
          </div>
        ) : result?.output ? (
          <AgentOutputDisplay
            agentType={result.agentType}
            output={result.output}
          />
        ) : (
          <div className="flex h-full min-h-[140px] items-center justify-center">
            <p className="text-sm text-slate-600">Awaiting execution</p>
          </div>
        )}

        {result?.errorMessage && (
          <p className="mt-3 text-xs text-red-400">{result.errorMessage}</p>
        )}
      </div>
    </article>
  );
}
