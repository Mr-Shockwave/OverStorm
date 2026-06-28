import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

const AGENT_ORDER = [
  { type: "risk" as const, order: 1 },
  { type: "revenue" as const, order: 2 },
  { type: "decision_maker" as const, order: 3 },
  { type: "outreach" as const, order: 4 },
];

export const getDiscoveryContext = internalQuery({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, args) => {
    const opportunity = await ctx.db.get(args.opportunityId);
    if (!opportunity) return null;

    const storm = await ctx.db.get(opportunity.stormId);
    if (!storm) return null;

    const runs = await ctx.db
      .query("agentRuns")
      .withIndex("by_opportunity", (q) =>
        q.eq("opportunityId", args.opportunityId),
      )
      .collect();

    const latestDiscoveryRun =
      [...runs]
        .filter((run) => run.runKind === "discovery")
        .sort((a, b) => b.startedAt - a.startedAt)[0] ?? null;

    return { opportunity, storm, latestRun: latestDiscoveryRun };
  },
});

export const getOrCreateAgentRun = internalMutation({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, args) => {
    const opportunity = await ctx.db.get(args.opportunityId);
    if (!opportunity) {
      throw new Error("Opportunity not found");
    }

    const existingRuns = await ctx.db
      .query("agentRuns")
      .withIndex("by_opportunity", (q) =>
        q.eq("opportunityId", args.opportunityId),
      )
      .collect();

    const activeDiscovery = existingRuns.find(
      (run) => run.runKind === "discovery" && run.status === "running",
    );
    if (activeDiscovery) {
      return activeDiscovery._id;
    }

    const now = Date.now();
    const runId = await ctx.db.insert("agentRuns", {
      stormId: opportunity.stormId,
      opportunityId: args.opportunityId,
      runKind: "discovery",
      status: "running",
      currentStep: "decision_maker",
      startedAt: now,
    });

    const riskReasoning = opportunity.buildingYear
      ? [`Built ${opportunity.buildingYear}`, ...(opportunity.propertyNotes?.split(", ") ?? [])]
      : opportunity.propertyNotes?.split(", ") ?? [];

    const outputs = {
      risk: {
        riskScore: opportunity.riskScore,
        reasoning: riskReasoning,
        openAiRiskReasoning: opportunity.riskExplanation,
      },
      revenue: {
        expectedRevenue: opportunity.expectedRevenue,
        priorityRank: opportunity.priorityRank ?? 1,
        revenueSummary: opportunity.revenueExplanation,
        openAiRevenueSummary: opportunity.revenueExplanation,
      },
    };

    for (const agent of AGENT_ORDER) {
      let status: "completed" | "pending" = "pending";
      let output:
        | {
            riskScore?: number;
            reasoning?: string[];
            openAiRiskReasoning?: string;
            expectedRevenue?: number;
            priorityRank?: number;
            revenueSummary?: string;
            openAiRevenueSummary?: string;
          }
        | undefined;

      if (agent.type === "risk" || agent.type === "revenue") {
        status = "completed";
        output = agent.type === "risk" ? outputs.risk : outputs.revenue;
      }

      await ctx.db.insert("agentResults", {
        runId,
        agentType: agent.type,
        status,
        stepOrder: agent.order,
        output,
        completedAt: status === "completed" ? now : undefined,
      });
    }

    return runId;
  },
});

export const saveDecisionMaker = internalMutation({
  args: {
    opportunityId: v.id("opportunities"),
    runId: v.id("agentRuns"),
    result: v.object({
      propertyName: v.string(),
      company: v.string(),
      matchedCompany: v.string(),
      matchConfidence: v.number(),
      verified: v.boolean(),
      contactName: v.string(),
      contactTitle: v.string(),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      linkedinUrl: v.optional(v.string()),
      searchCenterLat: v.optional(v.number()),
      searchCenterLng: v.optional(v.number()),
      source: v.union(v.literal("fiber"), v.literal("manual")),
    }),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existing = await ctx.db
      .query("decisionMakers")
      .withIndex("by_opportunity", (q) =>
        q.eq("opportunityId", args.opportunityId),
      )
      .collect();

    for (const record of existing) {
      await ctx.db.delete(record._id);
    }

    await ctx.db.insert("decisionMakers", {
      opportunityId: args.opportunityId,
      propertyName: args.result.propertyName,
      company: args.result.company,
      matchedCompany: args.result.matchedCompany,
      matchConfidence: args.result.matchConfidence,
      verified: args.result.verified,
      searchCenterLat: args.result.searchCenterLat,
      searchCenterLng: args.result.searchCenterLng,
      contactName: args.result.contactName,
      contactTitle: args.result.contactTitle,
      email: args.result.email,
      phone: args.result.phone,
      linkedinUrl: args.result.linkedinUrl,
      source: args.result.source,
      discoveredAt: now,
    });

    const agentResult = await ctx.db
      .query("agentResults")
      .withIndex("by_run_and_type", (q) =>
        q.eq("runId", args.runId).eq("agentType", "decision_maker"),
      )
      .unique();

    if (agentResult) {
      await ctx.db.patch(agentResult._id, {
        status: "completed",
        completedAt: now,
        output: {
          company: args.result.company,
          contactName: args.result.contactName,
          contactTitle: args.result.contactTitle,
          phone: args.result.phone,
        },
        errorMessage: undefined,
      });
    }

    await ctx.db.patch(args.runId, {
      currentStep: "completed",
      status: "completed",
      completedAt: now,
      errorMessage: undefined,
    });
  },
});

export const setDecisionMakerRunning = internalMutation({
  args: {
    opportunityId: v.id("opportunities"),
    runId: v.id("agentRuns"),
  },
  handler: async (ctx, args) => {
    const agentResult = await ctx.db
      .query("agentResults")
      .withIndex("by_run_and_type", (q) =>
        q.eq("runId", args.runId).eq("agentType", "decision_maker"),
      )
      .unique();

    if (!agentResult) {
      throw new Error("Decision maker agent result not found");
    }

    await ctx.db.patch(agentResult._id, {
      status: "running",
      startedAt: Date.now(),
      errorMessage: undefined,
    });

    await ctx.db.patch(args.runId, {
      status: "running",
      currentStep: "decision_maker",
      errorMessage: undefined,
      completedAt: undefined,
    });
  },
});

export const failDiscovery = internalMutation({
  args: {
    runId: v.id("agentRuns"),
    errorMessage: v.string(),
  },
  handler: async (ctx, args) => {
    const agentResult = await ctx.db
      .query("agentResults")
      .withIndex("by_run_and_type", (q) =>
        q.eq("runId", args.runId).eq("agentType", "decision_maker"),
      )
      .unique();

    if (agentResult) {
      await ctx.db.patch(agentResult._id, {
        status: "failed",
        errorMessage: args.errorMessage,
        completedAt: Date.now(),
      });
    }

    await ctx.db.patch(args.runId, {
      status: "failed",
      errorMessage: args.errorMessage,
      completedAt: Date.now(),
    });
  },
});

export const setDiscoveryProgress = internalMutation({
  args: {
    runId: v.id("agentRuns"),
    step: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const agentResult = await ctx.db
      .query("agentResults")
      .withIndex("by_run_and_type", (q) =>
        q.eq("runId", args.runId).eq("agentType", "decision_maker"),
      )
      .unique();

    if (agentResult) {
      await ctx.db.patch(agentResult._id, {
        status: "running",
        output: {
          progressStep: args.step,
          progressMessage: args.message,
        },
      });
    }
  },
});

export const saveDiscoveryUnavailable = internalMutation({
  args: {
    opportunityId: v.id("opportunities"),
    runId: v.id("agentRuns"),
    outcome: v.object({
      propertyName: v.string(),
      city: v.string(),
      address: v.optional(v.string()),
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
      message: v.string(),
      visitLocation: v.string(),
      bestCandidate: v.optional(v.string()),
      bestConfidence: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existing = await ctx.db
      .query("decisionMakers")
      .withIndex("by_opportunity", (q) =>
        q.eq("opportunityId", args.opportunityId),
      )
      .collect();

    for (const record of existing) {
      await ctx.db.delete(record._id);
    }

    const agentResult = await ctx.db
      .query("agentResults")
      .withIndex("by_run_and_type", (q) =>
        q.eq("runId", args.runId).eq("agentType", "decision_maker"),
      )
      .unique();

    if (agentResult) {
      await ctx.db.patch(agentResult._id, {
        status: "completed",
        completedAt: now,
        errorMessage: undefined,
        output: {
          availability: "unavailable",
          message: args.outcome.message,
          visitLocation: args.outcome.visitLocation,
          propertyName: args.outcome.propertyName,
          address: args.outcome.address,
          latitude: args.outcome.latitude,
          longitude: args.outcome.longitude,
          bestCandidate: args.outcome.bestCandidate,
          bestConfidence: args.outcome.bestConfidence,
        },
      });
    }

    await ctx.db.patch(args.runId, {
      currentStep: "completed",
      status: "completed",
      completedAt: now,
      errorMessage: undefined,
    });
  },
});

export const patchDecisionMakerContact = internalMutation({
  args: {
    opportunityId: v.id("opportunities"),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("decisionMakers")
      .withIndex("by_opportunity", (q) =>
        q.eq("opportunityId", args.opportunityId),
      )
      .first();

    if (!record) return;

    await ctx.db.patch(record._id, {
      email: args.email ?? record.email,
      phone: args.phone ?? record.phone,
    });
  },
});
