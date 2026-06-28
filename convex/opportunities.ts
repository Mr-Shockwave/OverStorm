import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { MIAMI_COASTAL_ASSETS } from "./assetData";
import {
  buildRiskBreakdown,
  RISK_MODEL_NAME,
  RISK_WEIGHTS,
} from "./services/riskIntelligence";
import type { Doc } from "./_generated/dataModel";

export const listOpportunities = query({
  args: {},
  handler: async (ctx) => {
    const activeStorms = await ctx.db
      .query("storms")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const activeStorm = activeStorms[0];
    if (!activeStorm) {
      return { storm: null, opportunities: [] };
    }

    const opportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_storm", (q) => q.eq("stormId", activeStorm._id))
      .collect();

    const sorted = [...opportunities].sort((a, b) => {
      const rankA = a.priorityRank ?? Number.MAX_SAFE_INTEGER;
      const rankB = b.priorityRank ?? Number.MAX_SAFE_INTEGER;
      return rankA - rankB;
    });

    return {
      storm: {
        _id: activeStorm._id,
        name: activeStorm.name,
        location: activeStorm.location,
      },
      opportunities: sorted.map((opportunity) => ({
        _id: opportunity._id,
        propertyName: opportunity.propertyName,
        assetType: opportunity.assetType,
        city: opportunity.city,
        riskScore: opportunity.riskScore,
        restorationDemandScore:
          opportunity.restorationDemandScore ?? opportunity.riskScore,
        expectedRevenue: opportunity.expectedRevenue,
        status: opportunity.status,
        priorityRank: opportunity.priorityRank,
      })),
    };
  },
});

export const getOpportunityDetail = query({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, args) => {
    const opportunity = await ctx.db.get(args.opportunityId);
    if (!opportunity) return null;

    const storm = await ctx.db.get(opportunity.stormId);
    if (!storm) return null;

    const [decisionMakerRows, runs, enrichmentRows, packageRows] =
      await Promise.all([
      ctx.db
        .query("decisionMakers")
        .withIndex("by_opportunity", (q) =>
          q.eq("opportunityId", args.opportunityId),
        )
        .collect(),
      ctx.db
        .query("agentRuns")
        .withIndex("by_opportunity", (q) =>
          q.eq("opportunityId", args.opportunityId),
        )
        .collect(),
      ctx.db
        .query("companyEnrichments")
        .withIndex("by_opportunity", (q) =>
          q.eq("opportunityId", args.opportunityId),
        )
        .collect(),
      ctx.db
        .query("revenueCapturePackages")
        .withIndex("by_opportunity", (q) =>
          q.eq("opportunityId", args.opportunityId),
        )
        .collect(),
    ]);

    const sortedRuns = [...runs].sort((a, b) => b.startedAt - a.startedAt);
    const latestDiscoveryRun =
      sortedRuns.find((run) => run.runKind === "discovery") ?? null;
    const latestPackageRun =
      sortedRuns.find((run) => run.runKind === "package") ?? null;

    let decisionMakerAgent: {
      status: string;
      errorMessage?: string;
      output?: {
        company?: string;
        contactName?: string;
        contactTitle?: string;
        phone?: string;
        progressStep?: string;
        progressMessage?: string;
        availability?: string;
        message?: string;
        visitLocation?: string;
        address?: string;
        latitude?: number;
        longitude?: number;
        bestCandidate?: string;
        bestConfidence?: number;
      } | null;
    } | null = null;

    if (latestDiscoveryRun) {
      const agentResult = await ctx.db
        .query("agentResults")
        .withIndex("by_run_and_type", (q) =>
          q.eq("runId", latestDiscoveryRun._id).eq("agentType", "decision_maker"),
        )
        .unique();

      if (agentResult) {
        decisionMakerAgent = {
          status: agentResult.status,
          errorMessage: agentResult.errorMessage,
          output: agentResult.output ?? null,
        };
      }
    }

    const decisionMakerRecord =
      [...decisionMakerRows].sort((a, b) => b.discoveredAt - a.discoveredAt)[0] ??
      null;

    const decisionMaker = decisionMakerRecord
      ? {
          propertyName:
            decisionMakerRecord.propertyName ?? opportunity.propertyName,
          company: decisionMakerRecord.company,
          matchedCompany:
            decisionMakerRecord.matchedCompany ?? decisionMakerRecord.company,
          matchConfidence: decisionMakerRecord.matchConfidence,
          verified: decisionMakerRecord.verified ?? false,
          contactName: decisionMakerRecord.contactName,
          contactTitle: decisionMakerRecord.contactTitle,
          email: decisionMakerRecord.email,
          phone: decisionMakerRecord.phone,
          linkedinUrl: decisionMakerRecord.linkedinUrl,
          source: decisionMakerRecord.source,
          discoveredAt: decisionMakerRecord.discoveredAt,
        }
      : decisionMakerAgent?.output?.contactName
        ? {
            propertyName: opportunity.propertyName,
            company: decisionMakerAgent.output.company ?? "—",
            matchedCompany: decisionMakerAgent.output.company ?? "—",
            matchConfidence: undefined,
            verified: false,
            contactName: decisionMakerAgent.output.contactName,
            contactTitle: decisionMakerAgent.output.contactTitle ?? "—",
            email: undefined,
            phone: decisionMakerAgent.output.phone,
            linkedinUrl: undefined,
            source: "manual" as const,
            discoveredAt: latestDiscoveryRun?.completedAt ?? latestDiscoveryRun?.startedAt ?? Date.now(),
          }
        : null;

    let outreachAgent: {
      status: string;
      startedAt?: number;
      completedAt?: number;
      errorMessage?: string;
    } | null = null;

    if (latestPackageRun) {
      const agentResult = await ctx.db
        .query("agentResults")
        .withIndex("by_run_and_type", (q) =>
          q.eq("runId", latestPackageRun._id).eq("agentType", "outreach"),
        )
        .unique();

      if (agentResult) {
        outreachAgent = {
          status: agentResult.status,
          startedAt: agentResult.startedAt,
          completedAt: agentResult.completedAt,
          errorMessage: agentResult.errorMessage,
        };
      }
    }

    const companyEnrichment =
      [...enrichmentRows].sort((a, b) => b.enrichedAt - a.enrichedAt)[0] ?? null;

    const sortedPackages = [...packageRows].sort(
      (a, b) => b.startedAt - a.startedAt,
    );
    const activePackage = sortedPackages[0] ?? null;
    const packageHistory = sortedPackages.slice(0, 5).map((pkg) => ({
      _id: pkg._id,
      status: pkg.status,
      workflowLabel: pkg.workflowLabel,
      startedAt: pkg.startedAt,
      completedAt: pkg.completedAt,
      limitedIntelligence: pkg.limitedIntelligence,
    }));

    const riskExplanation =
      opportunity.riskExplanation ??
      buildRiskExplanation(opportunity);
    const revenueExplanation =
      opportunity.revenueExplanation ??
      buildRevenueExplanation(opportunity);

    return {
      opportunity: {
        _id: opportunity._id,
        propertyName: opportunity.propertyName,
        assetType: opportunity.assetType,
        city: opportunity.city,
        address: opportunity.address,
        propertyPhone: opportunity.propertyPhone,
        latitude: opportunity.latitude,
        longitude: opportunity.longitude,
        riskScore: opportunity.riskScore,
        restorationDemandScore:
          opportunity.restorationDemandScore ?? opportunity.riskScore,
        expectedRevenue: opportunity.expectedRevenue,
        status: opportunity.status,
        priorityRank: opportunity.priorityRank,
        buildingYear: opportunity.buildingYear,
        propertyNotes: opportunity.propertyNotes,
      },
      storm: {
        name: storm.name,
        location: storm.location,
        historicalLandfall: storm.historicalLandfall,
      },
      riskExplanation,
      revenueExplanation,
      riskIntelligence: buildRiskIntelligencePayload(opportunity),
      decisionMaker: decisionMaker
        ? {
            propertyName: decisionMaker.propertyName,
            company: decisionMaker.company,
            matchedCompany: decisionMaker.matchedCompany,
            matchConfidence: decisionMaker.matchConfidence,
            verified: decisionMaker.verified,
            contactName: decisionMaker.contactName,
            contactTitle: decisionMaker.contactTitle,
            email: decisionMaker.email,
            phone: decisionMaker.phone,
            linkedinUrl: decisionMaker.linkedinUrl,
            source: decisionMaker.source,
            discoveredAt: decisionMaker.discoveredAt,
          }
        : null,
      decisionMakerAgent: decisionMakerAgent
        ? {
            status: decisionMakerAgent.status,
            errorMessage: decisionMakerAgent.errorMessage,
            progressStep: decisionMakerAgent.output?.progressStep,
            progressMessage: decisionMakerAgent.output?.progressMessage,
            availability: decisionMakerAgent.output?.availability,
            unavailableMessage: decisionMakerAgent.output?.message,
            visitLocation: decisionMakerAgent.output?.visitLocation,
          }
        : null,
      discoveryUnavailable:
        decisionMakerAgent?.output?.availability === "unavailable"
          ? {
              message:
                decisionMakerAgent.output.message ??
                "No verified contact available for this property.",
              visitLocation:
                decisionMakerAgent.output.visitLocation ??
                opportunity.address ??
                `${opportunity.propertyName}, ${opportunity.city ?? "Miami Beach"}`,
              address: decisionMakerAgent.output.address ?? opportunity.address,
              propertyPhone: opportunity.propertyPhone,
              latitude:
                decisionMakerAgent.output.latitude ?? opportunity.latitude,
              longitude:
                decisionMakerAgent.output.longitude ?? opportunity.longitude,
              bestCandidate: decisionMakerAgent.output.bestCandidate,
              bestConfidence: decisionMakerAgent.output.bestConfidence,
            }
          : null,
      outreachAgent,
      companyEnrichment: companyEnrichment
        ? {
            companyName: companyEnrichment.companyName,
            companyDescription: companyEnrichment.companyDescription,
            employeeCount: companyEnrichment.employeeCount,
            companySize: companyEnrichment.companySize,
            industry: companyEnrichment.industry,
            headcountGrowth: companyEnrichment.headcountGrowth,
            recentEvents: companyEnrichment.recentEvents,
            locations: companyEnrichment.locations,
            website: companyEnrichment.website,
            domain: companyEnrichment.domain,
            linkedinCompanyUrl: companyEnrichment.linkedinCompanyUrl,
            enrichmentStatus: companyEnrichment.enrichmentStatus,
            enrichedAt: companyEnrichment.enrichedAt,
          }
        : null,
      revenueCapturePackage: activePackage
        ? {
            _id: activePackage._id,
            status: activePackage.status,
            workflowLabel: activePackage.workflowLabel,
            limitedIntelligence: activePackage.limitedIntelligence,
            executiveSummary: activePackage.executiveSummary,
            personalizedEmail: activePackage.personalizedEmail,
            linkedinMessage: activePackage.linkedinMessage,
            callScript: activePackage.callScript,
            aiReasoning: activePackage.aiReasoning,
            startedAt: activePackage.startedAt,
            completedAt: activePackage.completedAt,
            errorMessage: activePackage.errorMessage,
          }
        : null,
      packageHistory,
      isDiscoveryRunning: decisionMakerAgent?.status === "running",
      isPackageRunning:
        outreachAgent?.status === "running" ||
        (activePackage?.status !== "completed" &&
          activePackage?.status !== "failed" &&
          activePackage?.status !== undefined &&
          activePackage?.status !== "pending"),
    };
  },
});

export const startDiscovery = mutation({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, args) => {
    const opportunity = await ctx.db.get(args.opportunityId);
    if (!opportunity) {
      throw new Error("Opportunity not found");
    }

    const runs = await ctx.db
      .query("agentRuns")
      .withIndex("by_opportunity", (q) =>
        q.eq("opportunityId", args.opportunityId),
      )
      .collect();

    const running = runs.find(
      (run) =>
        run.status === "running" &&
        (run.runKind === "discovery" || run.runKind === undefined),
    );
    if (running) {
      const agentResult = await ctx.db
        .query("agentResults")
        .withIndex("by_run_and_type", (q) =>
          q.eq("runId", running._id).eq("agentType", "decision_maker"),
        )
        .unique();

      if (agentResult?.status === "running") {
        throw new Error("Discovery is already in progress");
      }
    }

    await ctx.scheduler.runAfter(0, internal.discoveryWorkflow.runDiscoveryWorkflow, {
      opportunityId: args.opportunityId,
    });

    return { started: true };
  },
});

export const startPackageGeneration = mutation({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, args) => {
    const opportunity = await ctx.db.get(args.opportunityId);
    if (!opportunity) {
      throw new Error("Opportunity not found");
    }

    const decisionMaker = await ctx.db
      .query("decisionMakers")
      .withIndex("by_opportunity", (q) =>
        q.eq("opportunityId", args.opportunityId),
      )
      .first();

    if (!decisionMaker) {
      throw new Error("Run Fiber discovery first to identify a decision maker");
    }

    const packages = await ctx.db
      .query("revenueCapturePackages")
      .withIndex("by_opportunity", (q) =>
        q.eq("opportunityId", args.opportunityId),
      )
      .collect();

    const running = packages.find(
      (pkg) =>
        pkg.status !== "completed" &&
        pkg.status !== "failed" &&
        pkg.status !== "pending",
    );

    if (running) {
      throw new Error("Package generation is already in progress");
    }

    await ctx.scheduler.runAfter(0, internal.packageWorkflow.runPackageWorkflow, {
      opportunityId: args.opportunityId,
    });

    return { started: true };
  },
});

function buildRiskIntelligencePayload(opportunity: Doc<"opportunities">) {
  const assetSeed =
    MIAMI_COASTAL_ASSETS.find(
      (asset) => asset.propertyName === opportunity.propertyName,
    ) ?? null;

  const breakdownInput =
    opportunity.riskBreakdown ?? assetSeed?.riskBreakdown ?? null;

  const breakdown = breakdownInput
    ? buildRiskBreakdown(breakdownInput)
    : [];

  const revenueModel = opportunity.revenueModel ??
    (assetSeed
      ? {
          assetValueFactor: assetSeed.assetValueFactor,
          repairComplexityFactor: assetSeed.repairComplexityFactor,
          baseScale: 100_000,
        }
      : null);

  return {
    modelName: RISK_MODEL_NAME,
    riskScore: opportunity.riskScore,
    formula: Object.values(RISK_WEIGHTS).map((component) => ({
      label: component.label,
      weightPercent: Math.round(component.weight * 100),
    })),
    breakdown,
    whyAtRisk:
      opportunity.whyAtRisk ??
      assetSeed?.whyAtRisk ??
      opportunity.riskExplanation ??
      "",
    revenueModel: revenueModel
      ? {
          ...revenueModel,
          formula:
            "Predicted Revenue = (Risk Score ÷ 100) × Asset Value Factor × Repair Complexity Factor × Base Scale",
          disclaimer:
            "OverStorm prediction only — not a real-world damage estimate or government forecast.",
        }
      : null,
  };
}

function buildRiskExplanation(opportunity: {
  riskScore: number;
  buildingYear?: number;
  propertyNotes?: string;
}): string {
  const parts = [
    `Risk score ${opportunity.riskScore}/100 based on structural vulnerability analysis.`,
  ];

  if (opportunity.buildingYear) {
    parts.push(`Building constructed in ${opportunity.buildingYear}.`);
  }

  if (opportunity.propertyNotes) {
    parts.push(opportunity.propertyNotes + ".");
  }

  return parts.join(" ");
}

function buildRevenueExplanation(opportunity: {
  expectedRevenue: number;
  riskScore: number;
  priorityRank?: number;
}): string {
  return `OverStorm predicts a $${opportunity.expectedRevenue.toLocaleString()} revenue opportunity driven by risk score ${opportunity.riskScore} and property scale. Priority rank #${opportunity.priorityRank ?? "—"} in current storm pipeline.`;
}
