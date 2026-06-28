import { WORKFLOW_STEPS } from "@/lib/agents";

export function AgentWorkflowDiagram() {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl shadow-black/20">
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-400">
          Canonical Pipeline
        </p>
        <h2 className="mt-1 text-lg font-semibold text-white">
          Per-Property Agent Workflow
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Risk scores are pre-computed · Discovery and packages run from
          Opportunities or this fleet view
        </p>
      </div>

      <div className="flex flex-col items-stretch gap-0 md:flex-row md:items-center md:justify-between">
        {WORKFLOW_STEPS.map((step, index) => (
          <div key={step.id} className="flex flex-1 items-center">
            <div className="flex flex-col items-center py-2 md:py-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-400">
                {index + 1}
              </div>
              <p className="mt-2 max-w-[88px] text-center text-[11px] font-medium leading-tight text-slate-400">
                {step.label}
              </p>
            </div>

            {index < WORKFLOW_STEPS.length - 1 && (
              <>
                <div className="mx-2 hidden h-px flex-1 bg-slate-700 md:block" />
                <div className="my-1 h-6 w-px bg-slate-700 md:hidden" />
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
