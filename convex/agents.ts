import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

const AGENT_ORDER = [
  { type: "risk" as const, order: 1 },
  { type: "revenue" as const, order: 2 },
  { type: "decision_maker" as const, order: 3 },
  { type: "outreach" as const, order: 4 },
];

function isFullAnalysisRun(run: Doc<"agentRuns">): boolean {
  return run.runKind !== "discovery";
}

async function healStuckRuns(ctx: MutationCtx, runs: Doc<"agentRuns">[]) {
  const now = Date.now();

  for (const run of runs) {
    if (run.status !== "running") continue;

    const results = await ctx.db
      .query("agentResults")
      .withIndex("by_run", (q) => q.eq("runId", run._id))
      .collect();

    const anyAgentRunning = results.some((result) => result.status === "running");
    if (anyAgentRunning) continue;

    const decisionMaker = results.find(
      (result) => result.agentType === "decision_maker",
    );

    const discoveryFinished =
      run.runKind === "discovery" && decisionMaker?.status === "completed";

    const legacyDiscoveryFinished =
      run.runKind === undefined &&
      run.currentStep === "decision_maker" &&
      decisionMaker?.status === "completed";

    if (discoveryFinished || legacyDiscoveryFinished) {
      await ctx.db.patch(run._id, {
        status: "completed",
        currentStep: "completed",
        completedAt: now,
        errorMessage: undefined,
      });
    }
  }
}

export const getAgentControlCenter = query({
  args: {},
  handler: async (ctx) => {
    const activeStorms = await ctx.db
      .query("storms")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const activeStorm = activeStorms[0] ?? null;

    if (!activeStorm) {
      return {
        activeStorm: null,
        targetOpportunity: null,
        currentRun: null,
        agentResults: [],
        recentHistory: [],
      };
    }

    const opportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_storm", (q) => q.eq("stormId", activeStorm._id))
      .collect();

    const targetOpportunity =
      [...opportunities].sort((a, b) => {
        const rankA = a.priorityRank ?? Number.MAX_SAFE_INTEGER;
        const rankB = b.priorityRank ?? Number.MAX_SAFE_INTEGER;
        return rankA - rankB;
      })[0] ?? null;

    const runs = await ctx.db
      .query("agentRuns")
      .withIndex("by_storm", (q) => q.eq("stormId", activeStorm._id))
      .collect();

    const fullAnalysisRuns = runs.filter(isFullAnalysisRun);

    const currentRun =
      [...fullAnalysisRuns].sort((a, b) => b.startedAt - a.startedAt)[0] ?? null;

    let agentResults: Array<{
      _id: string;
      agentType: string;
      status: string;
      stepOrder: number;
      output: {
        riskScore?: number;
        reasoning?: string[];
        expectedRevenue?: number;
        priorityRank?: number;
        revenueSummary?: string;
        company?: string;
        contactName?: string;
        contactTitle?: string;
        emailDraftReady?: boolean;
        emailDraft?: string;
        outreachRecommendation?: string;
        openAiRiskReasoning?: string;
        openAiRevenueSummary?: string;
        openAiOutreachRecommendation?: string;
      } | null;
      errorMessage?: string;
    }> = [];

    if (currentRun) {
      const results = await ctx.db
        .query("agentResults")
        .withIndex("by_run", (q) => q.eq("runId", currentRun._id))
        .collect();

      agentResults = results
        .sort((a, b) => a.stepOrder - b.stepOrder)
        .map((result) => ({
          _id: result._id,
          agentType: result.agentType,
          status: result.status,
          stepOrder: result.stepOrder,
          output: result.output ?? null,
          errorMessage: result.errorMessage,
        }));
    }

    const history = await ctx.db
      .query("analysisHistory")
      .withIndex("by_storm", (q) => q.eq("stormId", activeStorm._id))
      .collect();

    const recentHistory = [...history]
      .sort((a, b) => b.completedAt - a.completedAt)
      .slice(0, 5)
      .map((entry) => ({
        _id: entry._id,
        propertyName: entry.propertyName,
        stormName: entry.stormName,
        summary: entry.summary,
        completedAt: entry.completedAt,
      }));

    return {
      activeStorm: {
        _id: activeStorm._id,
        name: activeStorm.name,
        location: activeStorm.location,
        riskScore: activeStorm.riskScore,
        hoursUntilLandfall: activeStorm.hoursUntilLandfall,
      },
      targetOpportunity: targetOpportunity
        ? {
            _id: targetOpportunity._id,
            propertyName: targetOpportunity.propertyName,
            riskScore: targetOpportunity.riskScore,
            expectedRevenue: targetOpportunity.expectedRevenue,
            priorityRank: targetOpportunity.priorityRank,
          }
        : null,
      currentRun: currentRun
        ? {
            _id: currentRun._id,
            status: currentRun.status,
            currentStep: currentRun.currentStep,
            startedAt: currentRun.startedAt,
            completedAt: currentRun.completedAt,
            errorMessage: currentRun.errorMessage,
          }
        : null,
      agentResults,
      recentHistory,
    };
  },
});

export const repairStuckRuns = mutation({
  args: {},
  handler: async (ctx) => {
    const runs = await ctx.db.query("agentRuns").collect();
    await healStuckRuns(ctx, runs);
    return { repaired: true };
  },
});

export const startFullAnalysis = mutation({
  args: {
    opportunityId: v.optional(v.id("opportunities")),
  },
  handler: async (ctx, args) => {
    const activeStorms = await ctx.db
      .query("storms")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const activeStorm = activeStorms[0];
    if (!activeStorm) {
      throw new Error("No active storm found");
    }

    let opportunityId = args.opportunityId;

    if (!opportunityId) {
      const opportunities = await ctx.db
        .query("opportunities")
        .withIndex("by_storm", (q) => q.eq("stormId", activeStorm._id))
        .collect();

      const top = [...opportunities].sort((a, b) => {
        const rankA = a.priorityRank ?? Number.MAX_SAFE_INTEGER;
        const rankB = b.priorityRank ?? Number.MAX_SAFE_INTEGER;
        return rankA - rankB;
      })[0];

      if (!top) {
        throw new Error("No opportunities found for active storm");
      }

      opportunityId = top._id;
    }

    const stormRuns = await ctx.db
      .query("agentRuns")
      .withIndex("by_storm", (q) => q.eq("stormId", activeStorm._id))
      .collect();

    await healStuckRuns(ctx, stormRuns);

    const refreshedRuns = await ctx.db
      .query("agentRuns")
      .withIndex("by_storm", (q) => q.eq("stormId", activeStorm._id))
      .collect();

    const activeFullRun = refreshedRuns.find(
      (run) => run.status === "running" && isFullAnalysisRun(run),
    );
    if (activeFullRun) {
      throw new Error("An analysis is already in progress");
    }

    const now = Date.now();

    const runId = await ctx.db.insert("agentRuns", {
      stormId: activeStorm._id,
      opportunityId,
      runKind: "full",
      status: "running",
      currentStep: "storm_event",
      startedAt: now,
    });

    for (const agent of AGENT_ORDER) {
      await ctx.db.insert("agentResults", {
        runId,
        agentType: agent.type,
        status: "pending",
        stepOrder: agent.order,
      });
    }

    await ctx.scheduler.runAfter(0, internal.agentWorkflow.runFullAnalysisWorkflow, {
      runId,
    });

    return { runId };
  },
});
