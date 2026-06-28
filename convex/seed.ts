import { mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import {
  HURRICANE_WILMA_HISTORICAL,
  MIAMI_BEACH_CENTER,
  WILMA_RISK_ZONES,
  MIAMI_COASTAL_ASSETS,
} from "./assetData";
import { REVENUE_BASE_SCALE } from "./services/riskIntelligence";

function opportunityFromAsset(
  stormId: Id<"storms">,
  asset: (typeof MIAMI_COASTAL_ASSETS)[number],
) {
  return {
    stormId,
    propertyName: asset.propertyName,
    riskScore: asset.riskScore,
    restorationDemandScore: asset.restorationDemandScore,
    expectedRevenue: asset.expectedRevenue,
    status: asset.status,
    priorityRank: asset.priorityRank,
    buildingYear: asset.buildingYear,
    propertyNotes: asset.propertyNotes,
    riskExplanation: asset.riskExplanation,
    revenueExplanation: asset.revenueExplanation,
    whyAtRisk: asset.whyAtRisk,
    riskBreakdown: asset.riskBreakdown,
    revenueModel: {
      assetValueFactor: asset.assetValueFactor,
      repairComplexityFactor: asset.repairComplexityFactor,
      baseScale: REVENUE_BASE_SCALE,
    },
    latitude: asset.latitude,
    longitude: asset.longitude,
    address: asset.address,
    propertyPhone: asset.propertyPhone,
    searchAliases: asset.searchAliases,
    excludedEmployerPatterns: asset.excludedEmployerPatterns,
    requiredEmployerTokens: asset.requiredEmployerTokens,
    assetType: asset.assetType,
    city: asset.city,
  };
}

function buildStormRecord(updatedAt: number) {
  return {
    name: HURRICANE_WILMA_HISTORICAL.name,
    location: HURRICANE_WILMA_HISTORICAL.location,
    riskScore: HURRICANE_WILMA_HISTORICAL.riskScore,
    hoursUntilLandfall: HURRICANE_WILMA_HISTORICAL.hoursUntilLandfall,
    expectedRevenueImpact: HURRICANE_WILMA_HISTORICAL.expectedRevenueImpact,
    status: "active" as const,
    updatedAt,
    mapCenterLat: MIAMI_BEACH_CENTER.lat,
    mapCenterLng: MIAMI_BEACH_CENTER.lng,
    mapZoom: MIAMI_BEACH_CENTER.zoom,
    stormTrack: [...HURRICANE_WILMA_HISTORICAL.stormTrack],
    riskZones: [...WILMA_RISK_ZONES],
    category: HURRICANE_WILMA_HISTORICAL.category,
    historicalLandfall: HURRICANE_WILMA_HISTORICAL.historicalLandfall,
    landfallWindSpeedMph: HURRICANE_WILMA_HISTORICAL.landfallWindSpeedMph,
    isHistoricalReplay: HURRICANE_WILMA_HISTORICAL.isHistoricalReplay,
    stormTimeline: [...HURRICANE_WILMA_HISTORICAL.timeline],
  };
}

export const seedDashboard = mutation({
  args: {},
  handler: async (ctx) => {
    const existingStorms = await ctx.db.query("storms").collect();
    if (existingStorms.length > 0) {
      return { seeded: false, message: "Database already contains storm data." };
    }

    const now = Date.now();
    const stormId = await ctx.db.insert("storms", buildStormRecord(now));

    let topOpportunityId: Id<"opportunities"> | null = null;

    for (const asset of MIAMI_COASTAL_ASSETS) {
      const id = await ctx.db.insert("opportunities", opportunityFromAsset(stormId, asset));
      if (asset.priorityRank === 1) {
        topOpportunityId = id;
      }
    }

    await ctx.db.insert("pipelineMetrics", {
      stormId,
      found: 352,
      highPriorityCount: 128,
      contacted: 128,
      responded: 29,
      meetings: 7,
      updatedAt: now,
    });

    if (topOpportunityId) {
      const topAsset = MIAMI_COASTAL_ASSETS[0];
      const runId = await ctx.db.insert("agentRuns", {
        stormId,
        opportunityId: topOpportunityId,
        runKind: "full",
        status: "completed",
        currentStep: "completed",
        startedAt: now - 3600_000,
        completedAt: now - 3500_000,
      });

      const seedOutput = {
        risk: {
          riskScore: topAsset.riskScore,
          reasoning: [
            "Atlantic coastline",
            "Low elevation barrier island",
            "Storm surge exposure",
          ],
          openAiRiskReasoning: topAsset.riskExplanation,
        },
        revenue: {
          expectedRevenue: topAsset.expectedRevenue,
          priorityRank: topAsset.priorityRank,
          revenueSummary: topAsset.revenueExplanation,
          openAiRevenueSummary: topAsset.revenueExplanation,
        },
        decisionMaker: {
          company: "Fontainebleau Miami Beach",
          contactName: "John Smith",
          contactTitle: "Director of Operations",
        },
        outreach: {
          emailDraftReady: true,
          emailDraft:
            "Subject: Proactive Storm Preparedness — Fontainebleau Miami Beach\n\nDear John,\n\nReviewing Hurricane Wilma's historical impact on South Florida, we wanted to reach out regarding disaster recovery capabilities for Fontainebleau Miami Beach.\n\nOur team specializes in pre-positioned hospitality restoration. We would welcome a brief call to discuss contingency planning.\n\nBest regards,\nOverStorm Recovery Team",
          outreachRecommendation:
            "Send personalized email referencing Wilma historical replay and coastal exposure profile.",
          openAiOutreachRecommendation:
            "Send personalized email referencing Wilma historical replay and coastal exposure profile.",
        },
      };

      await ctx.db.insert("agentResults", {
        runId,
        agentType: "risk",
        status: "completed",
        stepOrder: 1,
        output: seedOutput.risk,
        completedAt: now - 3580_000,
      });

      await ctx.db.insert("agentResults", {
        runId,
        agentType: "revenue",
        status: "completed",
        stepOrder: 2,
        output: seedOutput.revenue,
        completedAt: now - 3560_000,
      });

      await ctx.db.insert("agentResults", {
        runId,
        agentType: "decision_maker",
        status: "ready",
        stepOrder: 3,
        output: seedOutput.decisionMaker,
        completedAt: now - 3540_000,
      });

      await ctx.db.insert("agentResults", {
        runId,
        agentType: "outreach",
        status: "ready",
        stepOrder: 4,
        output: seedOutput.outreach,
        completedAt: now - 3520_000,
      });

      await ctx.db.insert("analysisHistory", {
        runId,
        stormId,
        opportunityId: topOpportunityId,
        propertyName: topAsset.propertyName,
        stormName: HURRICANE_WILMA_HISTORICAL.name,
        summary: topAsset.revenueExplanation,
        completedAt: now - 3500_000,
        snapshot: {
          ...seedOutput.risk,
          ...seedOutput.revenue,
          ...seedOutput.decisionMaker,
          ...seedOutput.outreach,
        },
      });
    }

    return { seeded: true, stormId };
  },
});

export const seedAgentDemo = mutation({
  args: {},
  handler: async (ctx) => {
    const existingRuns = await ctx.db.query("agentRuns").collect();
    if (existingRuns.length > 0) {
      return { seeded: false, message: "Agent runs already exist." };
    }

    const activeStorms = await ctx.db
      .query("storms")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const activeStorm = activeStorms[0];
    if (!activeStorm) {
      return { seeded: false, message: "No active storm found." };
    }

    const opportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_storm", (q) => q.eq("stormId", activeStorm._id))
      .collect();

    const topOpportunity = [...opportunities].sort((a, b) => {
      const rankA = a.priorityRank ?? Number.MAX_SAFE_INTEGER;
      const rankB = b.priorityRank ?? Number.MAX_SAFE_INTEGER;
      return rankA - rankB;
    })[0];

    if (!topOpportunity) {
      return { seeded: false, message: "No opportunities found." };
    }

    const now = Date.now();

    const runId = await ctx.db.insert("agentRuns", {
      stormId: activeStorm._id,
      opportunityId: topOpportunity._id,
      runKind: "full",
      status: "completed",
      currentStep: "completed",
      startedAt: now - 3600_000,
      completedAt: now - 3500_000,
    });

    const seedOutput = {
      risk: {
        riskScore: topOpportunity.riskScore,
        reasoning: [
          "Atlantic coastline",
          "Low elevation barrier island",
          "Storm surge exposure",
        ],
        openAiRiskReasoning: topOpportunity.riskExplanation,
      },
      revenue: {
        expectedRevenue: topOpportunity.expectedRevenue,
        priorityRank: topOpportunity.priorityRank ?? 1,
        revenueSummary: topOpportunity.revenueExplanation,
        openAiRevenueSummary: topOpportunity.revenueExplanation,
      },
      decisionMaker: {
        company: topOpportunity.propertyName,
        contactName: "John Smith",
        contactTitle: "Director of Operations",
      },
      outreach: {
        emailDraftReady: true,
        emailDraft:
          "Subject: Proactive Storm Preparedness\n\nDear John,\n\nReviewing Hurricane Wilma's historical impact on South Florida, we wanted to reach out regarding disaster recovery capabilities.\n\nBest regards,\nOverStorm Recovery Team",
        outreachRecommendation:
          "Send personalized email referencing Wilma historical replay and coastal exposure.",
        openAiOutreachRecommendation:
          "Send personalized email referencing Wilma historical replay and coastal exposure.",
      },
    };

    await ctx.db.insert("agentResults", {
      runId,
      agentType: "risk",
      status: "completed",
      stepOrder: 1,
      output: seedOutput.risk,
      completedAt: now - 3580_000,
    });

    await ctx.db.insert("agentResults", {
      runId,
      agentType: "revenue",
      status: "completed",
      stepOrder: 2,
      output: seedOutput.revenue,
      completedAt: now - 3560_000,
    });

    await ctx.db.insert("agentResults", {
      runId,
      agentType: "decision_maker",
      status: "ready",
      stepOrder: 3,
      output: seedOutput.decisionMaker,
      completedAt: now - 3540_000,
    });

    await ctx.db.insert("agentResults", {
      runId,
      agentType: "outreach",
      status: "ready",
      stepOrder: 4,
      output: seedOutput.outreach,
      completedAt: now - 3520_000,
    });

    await ctx.db.insert("analysisHistory", {
      runId,
      stormId: activeStorm._id,
      opportunityId: topOpportunity._id,
      propertyName: topOpportunity.propertyName,
      stormName: activeStorm.name,
      summary: topOpportunity.revenueExplanation ?? "",
      completedAt: now - 3500_000,
      snapshot: {
        ...seedOutput.risk,
        ...seedOutput.revenue,
        ...seedOutput.decisionMaker,
        ...seedOutput.outreach,
      },
    });

    return { seeded: true, runId };
  },
});

export const patchRealAssets = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const storms = await ctx.db.query("storms").collect();

    for (const storm of storms) {
      await ctx.db.patch(storm._id, buildStormRecord(now));
    }

    const activeStorm =
      storms.find((storm) => storm.status === "active") ?? storms[0];
    if (!activeStorm) {
      return { patched: false, message: "No storms found." };
    }

    const existingOpportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_storm", (q) => q.eq("stormId", activeStorm._id))
      .collect();

    for (const opportunity of existingOpportunities) {
      const enrichments = await ctx.db
        .query("companyEnrichments")
        .withIndex("by_opportunity", (q) =>
          q.eq("opportunityId", opportunity._id),
        )
        .collect();
      for (const row of enrichments) {
        await ctx.db.delete(row._id);
      }

      const decisionMakers = await ctx.db
        .query("decisionMakers")
        .withIndex("by_opportunity", (q) =>
          q.eq("opportunityId", opportunity._id),
        )
        .collect();
      for (const row of decisionMakers) {
        await ctx.db.delete(row._id);
      }

      const packages = await ctx.db
        .query("revenueCapturePackages")
        .withIndex("by_opportunity", (q) =>
          q.eq("opportunityId", opportunity._id),
        )
        .collect();
      for (const row of packages) {
        await ctx.db.delete(row._id);
      }

      await ctx.db.delete(opportunity._id);
    }

    let inserted = 0;
    for (const asset of MIAMI_COASTAL_ASSETS) {
      await ctx.db.insert(
        "opportunities",
        opportunityFromAsset(activeStorm._id, asset),
      );
      inserted += 1;
    }

    return {
      patched: true,
      stormsPatched: storms.length,
      opportunitiesReplaced: inserted,
    };
  },
});

/** Sync assets, storm replay data, and insert any missing coastal properties. */
export const syncCoastalAssetMetadata = mutation({
  args: {},
  handler: async (ctx) => {
    const storms = await ctx.db.query("storms").collect();
    const now = Date.now();

    for (const storm of storms) {
      await ctx.db.patch(storm._id, {
        name: HURRICANE_WILMA_HISTORICAL.name,
        location: HURRICANE_WILMA_HISTORICAL.location,
        riskScore: HURRICANE_WILMA_HISTORICAL.riskScore,
        expectedRevenueImpact: HURRICANE_WILMA_HISTORICAL.expectedRevenueImpact,
        mapCenterLat: MIAMI_BEACH_CENTER.lat,
        mapCenterLng: MIAMI_BEACH_CENTER.lng,
        mapZoom: MIAMI_BEACH_CENTER.zoom,
        stormTrack: [...HURRICANE_WILMA_HISTORICAL.stormTrack],
        riskZones: [...WILMA_RISK_ZONES],
        category: HURRICANE_WILMA_HISTORICAL.category,
        historicalLandfall: HURRICANE_WILMA_HISTORICAL.historicalLandfall,
        landfallWindSpeedMph: HURRICANE_WILMA_HISTORICAL.landfallWindSpeedMph,
        isHistoricalReplay: HURRICANE_WILMA_HISTORICAL.isHistoricalReplay,
        stormTimeline: [...HURRICANE_WILMA_HISTORICAL.timeline],
        updatedAt: now,
      });
    }

    const activeStorm =
      storms.find((storm) => storm.status === "active") ?? storms[0];

    const opportunities = await ctx.db.query("opportunities").collect();
    let updated = 0;
    let inserted = 0;

    for (const asset of MIAMI_COASTAL_ASSETS) {
      const match = opportunities.find(
        (row) => row.propertyName === asset.propertyName,
      );

      const fields = {
        latitude: asset.latitude,
        longitude: asset.longitude,
        address: asset.address,
        propertyPhone: asset.propertyPhone,
        searchAliases: asset.searchAliases,
        excludedEmployerPatterns: asset.excludedEmployerPatterns,
        requiredEmployerTokens: asset.requiredEmployerTokens,
        assetType: asset.assetType,
        city: asset.city,
        priorityRank: asset.priorityRank,
        riskScore: asset.riskScore,
        restorationDemandScore: asset.restorationDemandScore,
        expectedRevenue: asset.expectedRevenue,
        riskExplanation: asset.riskExplanation,
        revenueExplanation: asset.revenueExplanation,
        whyAtRisk: asset.whyAtRisk,
        riskBreakdown: asset.riskBreakdown,
        revenueModel: {
          assetValueFactor: asset.assetValueFactor,
          repairComplexityFactor: asset.repairComplexityFactor,
          baseScale: REVENUE_BASE_SCALE,
        },
      };

      if (match) {
        await ctx.db.patch(match._id, fields);
        updated += 1;
      } else if (activeStorm) {
        await ctx.db.insert("opportunities", {
          stormId: activeStorm._id,
          propertyName: asset.propertyName,
          status: asset.status,
          buildingYear: asset.buildingYear,
          propertyNotes: asset.propertyNotes,
          ...fields,
        });
        inserted += 1;
      }
    }

    return {
      updated,
      inserted,
      stormsUpdated: storms.length,
      total: MIAMI_COASTAL_ASSETS.length,
    };
  },
});

/** @deprecated Use patchRealAssets */
export const patchMapData = patchRealAssets;
