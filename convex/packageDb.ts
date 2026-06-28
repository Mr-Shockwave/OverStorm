import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import {
  companyEnrichmentFields,
  packageWorkflowStatus,
  revenueCapturePackageContent,
} from "./schema";

const AGENT_ORDER = [
  { type: "risk" as const, order: 1 },
  { type: "revenue" as const, order: 2 },
  { type: "decision_maker" as const, order: 3 },
  { type: "outreach" as const, order: 4 },
];

export const getPackageContext = internalQuery({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, args) => {
    const opportunity = await ctx.db.get(args.opportunityId);
    if (!opportunity) return null;

    const storm = await ctx.db.get(opportunity.stormId);
    if (!storm) return null;

    const decisionMaker = await ctx.db
      .query("decisionMakers")
      .withIndex("by_opportunity", (q) =>
        q.eq("opportunityId", args.opportunityId),
      )
      .collect()
      .then(
        (rows) =>
          [...rows].sort((a, b) => b.discoveredAt - a.discoveredAt)[0] ?? null,
      );

    const enrichment = await ctx.db
      .query("companyEnrichments")
      .withIndex("by_opportunity", (q) =>
        q.eq("opportunityId", args.opportunityId),
      )
      .collect()
      .then(
        (rows) =>
          [...rows].sort((a, b) => b.enrichedAt - a.enrichedAt)[0] ?? null,
      );

    return { opportunity, storm, decisionMaker, enrichment };
  },
});

export const createPackageRun = internalMutation({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, args) => {
    const opportunity = await ctx.db.get(args.opportunityId);
    if (!opportunity) throw new Error("Opportunity not found");

    const now = Date.now();

    const runId = await ctx.db.insert("agentRuns", {
      stormId: opportunity.stormId,
      opportunityId: args.opportunityId,
      runKind: "package",
      status: "running",
      currentStep: "orange_slice_enrichment",
      startedAt: now,
    });

    for (const agent of AGENT_ORDER) {
      let status: "completed" | "ready" | "pending" = "pending";
      if (agent.type === "risk" || agent.type === "revenue") {
        status = "completed";
      } else if (agent.type === "decision_maker") {
        status = "completed";
      } else if (agent.type === "outreach") {
        status = "ready";
      }

      await ctx.db.insert("agentResults", {
        runId,
        agentType: agent.type,
        status,
        stepOrder: agent.order,
        completedAt: status === "completed" ? now : undefined,
      });
    }

    const packageId = await ctx.db.insert("revenueCapturePackages", {
      opportunityId: args.opportunityId,
      runId,
      status: "pending",
      workflowLabel: "Starting package generation…",
      limitedIntelligence: false,
      startedAt: now,
    });

    return { runId, packageId };
  },
});

export const updatePackageStatus = internalMutation({
  args: {
    packageId: v.id("revenueCapturePackages"),
    runId: v.id("agentRuns"),
    status: packageWorkflowStatus,
    workflowLabel: v.string(),
    currentStep: v.optional(
      v.union(
        v.literal("orange_slice_enrichment"),
        v.literal("outreach"),
        v.literal("pipeline"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.packageId, {
      status: args.status,
      workflowLabel: args.workflowLabel,
    });

    if (args.currentStep) {
      await ctx.db.patch(args.runId, { currentStep: args.currentStep });
    }
  },
});

export const setOutreachRunning = internalMutation({
  args: { runId: v.id("agentRuns") },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("agentResults")
      .withIndex("by_run_and_type", (q) =>
        q.eq("runId", args.runId).eq("agentType", "outreach"),
      )
      .unique();

    if (result) {
      await ctx.db.patch(result._id, {
        status: "running",
        startedAt: Date.now(),
        errorMessage: undefined,
      });
    }

    await ctx.db.patch(args.runId, {
      status: "running",
      currentStep: "outreach",
    });
  },
});

export const saveCompanyEnrichment = internalMutation({
  args: {
    opportunityId: v.id("opportunities"),
    enrichment: companyEnrichmentFields,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("companyEnrichments")
      .withIndex("by_opportunity", (q) =>
        q.eq("opportunityId", args.opportunityId),
      )
      .collect();

    for (const row of existing) {
      await ctx.db.delete(row._id);
    }

    await ctx.db.insert("companyEnrichments", {
      opportunityId: args.opportunityId,
      ...args.enrichment,
      enrichedAt: Date.now(),
    });
  },
});

export const completePackage = internalMutation({
  args: {
    packageId: v.id("revenueCapturePackages"),
    runId: v.id("agentRuns"),
    limitedIntelligence: v.boolean(),
    content: revenueCapturePackageContent,
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.packageId, {
      status: "completed",
      workflowLabel: "Package ready",
      limitedIntelligence: args.limitedIntelligence,
      executiveSummary: args.content.executiveSummary,
      personalizedEmail: args.content.personalizedEmail,
      linkedinMessage: args.content.linkedinMessage,
      callScript: args.content.callScript,
      aiReasoning: args.content.aiReasoning,
      completedAt: now,
    });

    const outreachResult = await ctx.db
      .query("agentResults")
      .withIndex("by_run_and_type", (q) =>
        q.eq("runId", args.runId).eq("agentType", "outreach"),
      )
      .unique();

    if (outreachResult) {
      await ctx.db.patch(outreachResult._id, {
        status: "completed",
        completedAt: now,
        output: {
          emailDraftReady: true,
          emailDraft: args.content.personalizedEmail,
          outreachRecommendation: args.content.executiveSummary,
          openAiOutreachRecommendation: args.content.aiReasoning,
        },
      });
    }

    await ctx.db.patch(args.runId, {
      status: "completed",
      currentStep: "completed",
      completedAt: now,
    });
  },
});

export const failPackage = internalMutation({
  args: {
    packageId: v.id("revenueCapturePackages"),
    runId: v.id("agentRuns"),
    errorMessage: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.packageId, {
      status: "failed",
      workflowLabel: "Package generation failed",
      errorMessage: args.errorMessage,
      completedAt: now,
    });

    const outreachResult = await ctx.db
      .query("agentResults")
      .withIndex("by_run_and_type", (q) =>
        q.eq("runId", args.runId).eq("agentType", "outreach"),
      )
      .unique();

    if (outreachResult) {
      await ctx.db.patch(outreachResult._id, {
        status: "failed",
        errorMessage: args.errorMessage,
        completedAt: now,
      });
    }

    await ctx.db.patch(args.runId, {
      status: "failed",
      errorMessage: args.errorMessage,
      completedAt: now,
    });
  },
});
