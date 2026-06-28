"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { AgentCard } from "@/components/agent-card";
import { AgentWorkflowDiagram } from "@/components/agent-workflow-diagram";
import {
  AGENT_DEFINITIONS,
  getAgentResult,
} from "@/lib/agents";

export function AgentsControlCenter() {
  const controlCenter = useQuery(api.agents.getAgentControlCenter);
  const startAnalysis = useMutation(api.agents.startFullAnalysis);
  const repairStuckRuns = useMutation(api.agents.repairStuckRuns);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void repairStuckRuns({});
  }, [repairStuckRuns]);

  const isLoading = controlCenter === undefined;
  const isRunning =
    controlCenter?.currentRun?.status === "running" || isStarting;

  async function handleRunAnalysis() {
    setError(null);
    setIsStarting(true);
    try {
      await startAnalysis({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start analysis");
    } finally {
      setIsStarting(false);
    }
  }

  if (isLoading) {
    return (
      <AppShell>
        <AgentsLoading />
      </AppShell>
    );
  }

  if (!controlCenter?.activeStorm || !controlCenter.targetOpportunity) {
    return (
      <AppShell>
        <main className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-slate-500">
            No active storm data. Run the Convex seed to populate the database.
          </p>
        </main>
      </AppShell>
    );
  }

  const { activeStorm, targetOpportunity, currentRun, agentResults, recentHistory } =
    controlCenter;

  return (
    <AppShell>
      <div className="bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-400">
                AI Operations Center
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Agent Control Center
              </h1>
              <p className="mt-2 max-w-xl text-sm text-slate-400">
                Orchestrate multi-agent analysis for{" "}
                <span className="text-slate-200">
                  {targetOpportunity.propertyName}
                </span>{" "}
                under {activeStorm.name}.
              </p>
            </div>

            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              <button
                type="button"
                onClick={handleRunAnalysis}
                disabled={isRunning}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Running Analysis…
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                      />
                    </svg>
                    Run Full Analysis
                  </>
                )}
              </button>
              {error && (
                <p className="text-xs text-red-400 sm:text-right">{error}</p>
              )}
              {currentRun?.errorMessage && (
                <p className="text-xs text-red-400 sm:text-right">
                  {currentRun.errorMessage}
                </p>
              )}
            </div>
          </div>

          <div className="mt-8">
            <AgentWorkflowDiagram
              currentStep={currentRun?.currentStep ?? null}
              isRunning={isRunning}
            />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Active Agents
          </h2>
          <p className="text-xs text-slate-400">
            Target: {targetOpportunity.propertyName} · Risk{" "}
            {targetOpportunity.riskScore}
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {AGENT_DEFINITIONS.map((agent) => (
            <AgentCard
              key={agent.type}
              title={agent.title}
              description={agent.description}
              result={getAgentResult(agentResults, agent.type)}
            />
          ))}
        </div>

        {recentHistory.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Analysis History
            </h2>
            <div className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
              {recentHistory.map((entry) => (
                <div
                  key={entry._id}
                  className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {entry.propertyName}
                    </p>
                    <p className="text-xs text-slate-500">{entry.stormName}</p>
                  </div>
                  <p className="max-w-md text-sm text-slate-500">
                    {entry.summary}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </AppShell>
  );
}

function AgentsLoading() {
  return (
    <div className="bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-24 animate-pulse rounded-lg bg-slate-800/50" />
        <div className="mt-8 h-40 animate-pulse rounded-xl bg-slate-800/50" />
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-xl bg-slate-200/70"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
