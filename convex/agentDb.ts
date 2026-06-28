import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { agentOutput, agentStepStatus, agentType, workflowStep } from "./schema";

export const getRunContext = internalQuery({
  args: { runId: v.id("agentRuns") },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) return null;

    const [storm, opportunity] = await Promise.all([
      ctx.db.get(run.stormId),
      ctx.db.get(run.opportunityId),
    ]);

    if (!storm || !opportunity) return null;

    return { run, storm, opportunity };
  },
});

export const setRunStep = internalMutation({
  args: {
    runId: v.id("agentRuns"),
    currentStep: workflowStep,
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("running"),
        v.literal("completed"),
        v.literal("failed"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const patch: {
      currentStep: typeof args.currentStep;
      status?: "pending" | "running" | "completed" | "failed";
      completedAt?: number;
    } = { currentStep: args.currentStep };

    if (args.status) {
      patch.status = args.status;
      if (args.status === "completed" || args.status === "failed") {
        patch.completedAt = Date.now();
      }
    }

    await ctx.db.patch(args.runId, patch);
  },
});

export const setAgentResultStatus = internalMutation({
  args: {
    runId: v.id("agentRuns"),
    agentType: agentType,
    status: agentStepStatus,
    output: v.optional(agentOutput),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("agentResults")
      .withIndex("by_run_and_type", (q) =>
        q.eq("runId", args.runId).eq("agentType", args.agentType),
      )
      .unique();

    if (!result) {
      throw new Error(`Agent result not found for ${args.agentType}`);
    }

    const now = Date.now();
    const patch: {
      status: typeof args.status;
      output?: typeof args.output;
      errorMessage?: string;
      startedAt?: number;
      completedAt?: number;
    } = { status: args.status };

    if (args.status === "running") {
      patch.startedAt = now;
    }

    if (
      args.status === "completed" ||
      args.status === "ready" ||
      args.status === "failed"
    ) {
      patch.completedAt = now;
    }

    if (args.output) {
      patch.output = args.output;
    }

    if (args.errorMessage) {
      patch.errorMessage = args.errorMessage;
    }

    await ctx.db.patch(result._id, patch);
  },
});

export const completeAnalysis = internalMutation({
  args: {
    runId: v.id("agentRuns"),
    stormId: v.id("storms"),
    opportunityId: v.id("opportunities"),
    propertyName: v.string(),
    stormName: v.string(),
    summary: v.string(),
    snapshot: agentOutput,
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.runId, {
      status: "completed",
      currentStep: "completed",
      completedAt: now,
    });

    await ctx.db.insert("analysisHistory", {
      runId: args.runId,
      stormId: args.stormId,
      opportunityId: args.opportunityId,
      propertyName: args.propertyName,
      stormName: args.stormName,
      summary: args.summary,
      completedAt: now,
      snapshot: args.snapshot,
    });
  },
});

export const failRun = internalMutation({
  args: {
    runId: v.id("agentRuns"),
    errorMessage: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.runId, {
      status: "failed",
      errorMessage: args.errorMessage,
      completedAt: Date.now(),
    });
  },
});
