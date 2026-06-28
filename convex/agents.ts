import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const AGENT_ORDER = [
  { type: "risk" as const, order: 1 },
  { type: "revenue" as const, order: 2 },
  { type: "decision_maker" as const, order: 3 },
  { type: "outreach" as const, order: 4 },
];

type DiscoveryStatus =
  | "pending"
  | "running"
  | "found"
  | "unavailable"
  | "failed";

type PackageStatus = "pending" | "running" | "completed" | "failed";

function isFullAnalysisRun(run: Doc<"agentRuns">): boolean {
  return run.runKind === "full" || run.runKind === undefined;
}

function isPackageRunning(
  packageStatus: Doc<"revenueCapturePackages">["status"] | undefined,
  outreachStatus: string | undefined,
): boolean {
  if (outreachStatus === "running") return true;
  if (!packageStatus) return false;
  return (
    packageStatus !== "completed" &&
    packageStatus !== "failed" &&
    packageStatus !== "pending"
  );
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
      run.runKind === "discovery" &&
      (decisionMaker?.status === "completed" ||
        decisionMaker?.status === "ready");

    const legacyDiscoveryFinished =
      run.runKind === undefined &&
      run.currentStep === "decision_maker" &&
      (decisionMaker?.status === "completed" ||
        decisionMaker?.status === "ready");

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

async function resolveOpportunityAgentStatus(
  ctx: QueryCtx,
  opportunityId: Id<"opportunities">,
) {
  const [decisionMakerRows, runs, packageRows] = await Promise.all([
    ctx.db
      .query("decisionMakers")
      .withIndex("by_opportunity", (q) => q.eq("opportunityId", opportunityId))
      .collect(),
    ctx.db
      .query("agentRuns")
      .withIndex("by_opportunity", (q) => q.eq("opportunityId", opportunityId))
      .collect(),
    ctx.db
      .query("revenueCapturePackages")
      .withIndex("by_opportunity", (q) => q.eq("opportunityId", opportunityId))
      .collect(),
  ]);

  const decisionMakerRecord =
    [...decisionMakerRows].sort((a, b) => b.discoveredAt - a.discoveredAt)[0] ??
    null;

  const sortedRuns = [...runs].sort((a, b) => b.startedAt - a.startedAt);
  const latestDiscoveryRun =
    sortedRuns.find((run) => run.runKind === "discovery") ?? null;
  const latestPackageRun =
    sortedRuns.find((run) => run.runKind === "package") ?? null;

  let discoveryAgent: Doc<"agentResults"> | null = null;
  if (latestDiscoveryRun) {
    discoveryAgent = await ctx.db
      .query("agentResults")
      .withIndex("by_run_and_type", (q) =>
        q.eq("runId", latestDiscoveryRun._id).eq("agentType", "decision_maker"),
      )
      .unique();
  }

  let outreachAgent: Doc<"agentResults"> | null = null;
  if (latestPackageRun) {
    outreachAgent = await ctx.db
      .query("agentResults")
      .withIndex("by_run_and_type", (q) =>
        q.eq("runId", latestPackageRun._id).eq("agentType", "outreach"),
      )
      .unique();
  }

  const activePackage =
    [...packageRows].sort((a, b) => b.startedAt - a.startedAt)[0] ?? null;

  let discoveryStatus: DiscoveryStatus = "pending";
  let discoveryLabel = "Not started";
  let discoveryContactName: string | undefined;
  let discoveryProgressMessage: string | undefined;
  let discoveryErrorMessage: string | undefined;

  if (decisionMakerRecord) {
    discoveryStatus = "found";
    discoveryLabel = decisionMakerRecord.contactName;
    discoveryContactName = decisionMakerRecord.contactName;
  } else if (discoveryAgent?.status === "running") {
    discoveryStatus = "running";
    discoveryLabel =
      discoveryAgent.output?.progressMessage ?? "Searching contacts…";
    discoveryProgressMessage = discoveryAgent.output?.progressMessage;
  } else if (discoveryAgent?.output?.availability === "unavailable") {
    discoveryStatus = "unavailable";
    discoveryLabel = "Visit recommended";
  } else if (discoveryAgent?.status === "failed") {
    discoveryStatus = "failed";
    discoveryLabel = "Discovery failed";
    discoveryErrorMessage = discoveryAgent.errorMessage;
  } else if (
    discoveryAgent &&
    (discoveryAgent.status === "ready" || discoveryAgent.status === "completed")
  ) {
    if (discoveryAgent.output?.contactName) {
      discoveryStatus = "found";
      discoveryLabel = discoveryAgent.output.contactName;
      discoveryContactName = discoveryAgent.output.contactName;
    } else {
      discoveryStatus = "unavailable";
      discoveryLabel = "Visit recommended";
    }
  }

  let packageStatus: PackageStatus = "pending";
  let packageLabel = "Not started";
  let packageErrorMessage: string | undefined;

  if (activePackage?.status === "completed") {
    packageStatus = "completed";
    packageLabel = "Package ready";
  } else if (activePackage?.status === "failed") {
    packageStatus = "failed";
    packageLabel = "Generation failed";
    packageErrorMessage = activePackage.errorMessage;
  } else if (
    isPackageRunning(activePackage?.status, outreachAgent?.status)
  ) {
    packageStatus = "running";
    packageLabel = activePackage?.workflowLabel ?? "Generating package…";
  } else if (activePackage?.status === "pending") {
    packageStatus = "pending";
    packageLabel = "Awaiting discovery";
  }

  return {
    discoveryStatus,
    discoveryLabel,
    discoveryContactName,
    discoveryProgressMessage,
    discoveryErrorMessage,
    packageStatus,
    packageLabel,
    packageErrorMessage,
    hasDecisionMaker: decisionMakerRecord !== null,
    discoveredAt: decisionMakerRecord?.discoveredAt,
    packageCompletedAt: activePackage?.completedAt,
  };
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
        storm: null,
        opportunities: [],
        summary: null,
        recentActivity: [],
      };
    }

    const [opportunities, pipelineRow] = await Promise.all([
      ctx.db
        .query("opportunities")
        .withIndex("by_storm", (q) => q.eq("stormId", activeStorm._id))
        .collect(),
      ctx.db
        .query("pipelineMetrics")
        .withIndex("by_storm", (q) => q.eq("stormId", activeStorm._id))
        .first(),
    ]);

    const sortedOpportunities = [...opportunities].sort((a, b) => {
      const rankA = a.priorityRank ?? Number.MAX_SAFE_INTEGER;
      const rankB = b.priorityRank ?? Number.MAX_SAFE_INTEGER;
      return rankA - rankB;
    });

    const opportunityRows = await Promise.all(
      sortedOpportunities.map(async (opportunity) => {
        const agentStatus = await resolveOpportunityAgentStatus(
          ctx,
          opportunity._id,
        );

        return {
          _id: opportunity._id,
          propertyName: opportunity.propertyName,
          assetType: opportunity.assetType,
          city: opportunity.city,
          riskScore: opportunity.riskScore,
          restorationDemandScore:
            opportunity.restorationDemandScore ?? opportunity.riskScore,
          expectedRevenue: opportunity.expectedRevenue,
          priorityRank: opportunity.priorityRank,
          status: opportunity.status,
          ...agentStatus,
        };
      }),
    );

    const summary = {
      totalProperties: opportunityRows.length,
      discoveryFound: opportunityRows.filter(
        (row) => row.discoveryStatus === "found",
      ).length,
      discoveryRunning: opportunityRows.filter(
        (row) => row.discoveryStatus === "running",
      ).length,
      packagesCompleted: opportunityRows.filter(
        (row) => row.packageStatus === "completed",
      ).length,
      packagesRunning: opportunityRows.filter(
        (row) => row.packageStatus === "running",
      ).length,
      pipeline: pipelineRow
        ? {
            found: pipelineRow.found,
            contacted: pipelineRow.contacted,
            responded: pipelineRow.responded,
            meetings: pipelineRow.meetings,
          }
        : null,
    };

    const recentActivity: Array<{
      _id: string;
      type: "discovery" | "package";
      propertyName: string;
      label: string;
      completedAt: number;
    }> = [];

    for (const row of opportunityRows) {
      if (row.discoveredAt) {
        recentActivity.push({
          _id: `${row._id}-discovery`,
          type: "discovery",
          propertyName: row.propertyName,
          label: row.discoveryContactName
            ? `Contact found: ${row.discoveryContactName}`
            : "Discovery completed",
          completedAt: row.discoveredAt,
        });
      }
      if (row.packageCompletedAt) {
        recentActivity.push({
          _id: `${row._id}-package`,
          type: "package",
          propertyName: row.propertyName,
          label: "Revenue capture package generated",
          completedAt: row.packageCompletedAt,
        });
      }
    }

    recentActivity.sort((a, b) => b.completedAt - a.completedAt);

    return {
      storm: {
        _id: activeStorm._id,
        name: activeStorm.name,
        location: activeStorm.location,
        riskScore: activeStorm.riskScore,
        category: activeStorm.category,
        historicalLandfall: activeStorm.historicalLandfall,
        isHistoricalReplay: activeStorm.isHistoricalReplay ?? false,
      },
      opportunities: opportunityRows,
      summary,
      recentActivity: recentActivity.slice(0, 8),
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

/** @deprecated Legacy batch workflow — use opportunities.startDiscovery instead. */
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
