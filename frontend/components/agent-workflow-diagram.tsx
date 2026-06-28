import { WORKFLOW_STEPS } from "@/lib/agents";

type AgentWorkflowDiagramProps = {
  currentStep: string | null;
  isRunning: boolean;
};

export function AgentWorkflowDiagram({
  currentStep,
  isRunning,
}: AgentWorkflowDiagramProps) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl shadow-black/20">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-400">
            Agent Pipeline
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">
            Workflow Orchestration
          </h2>
        </div>
        {isRunning && (
          <div className="flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-400" />
            </span>
            <span className="text-xs font-medium text-sky-300">Executing</span>
          </div>
        )}
      </div>

      <div className="flex flex-col items-stretch gap-0 md:flex-row md:items-center md:justify-between">
        {WORKFLOW_STEPS.map((step, index) => {
          const stepIndex = currentStep
            ? WORKFLOW_STEPS.findIndex((s) => s.id === currentStep)
            : -1;
          const isActive = currentStep === step.id;
          const isComplete =
            currentStep === "completed" ||
            (stepIndex !== -1 && index < stepIndex) ||
            (currentStep === "pipeline" &&
              index < WORKFLOW_STEPS.length - 1);

          return (
            <div key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center py-2 md:py-0">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border text-xs font-semibold transition-all ${
                    isActive
                      ? "border-sky-400 bg-sky-500/20 text-sky-200 shadow-lg shadow-sky-500/20"
                      : isComplete
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        : "border-slate-700 bg-slate-900 text-slate-500"
                  }`}
                >
                  {isActive && isRunning ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-300 border-t-transparent" />
                  ) : (
                    index + 1
                  )}
                </div>
                <p
                  className={`mt-2 max-w-[88px] text-center text-[11px] font-medium leading-tight ${
                    isActive ? "text-sky-200" : isComplete ? "text-emerald-400" : "text-slate-500"
                  }`}
                >
                  {step.label}
                </p>
              </div>

              {index < WORKFLOW_STEPS.length - 1 && (
                <>
                  <div
                    className={`mx-2 hidden h-px flex-1 md:block ${
                      isComplete ? "bg-emerald-500/40" : "bg-slate-700"
                    }`}
                  />
                  <div
                    className={`my-1 h-6 w-px md:hidden ${
                      isComplete ? "bg-emerald-500/40" : "bg-slate-700"
                    }`}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
