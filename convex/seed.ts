import { mutation } from "./_generated/server";
import {
  HURRICANE_MILTON_TRACK,
  MIAMI_BEACH_CENTER,
  MIAMI_BEACH_RISK_ZONES,
  OPPORTUNITY_MAP_COORDS,
} from "./mapData";

export const seedDashboard = mutation({
  args: {},
  handler: async (ctx) => {
    const existingStorms = await ctx.db.query("storms").collect();
    if (existingStorms.length > 0) {
      return { seeded: false, message: "Database already contains storm data." };
    }

    const now = Date.now();

    const stormId = await ctx.db.insert("storms", {
      name: "Hurricane Milton",
      location: "Miami Beach",
      riskScore: 89,
      hoursUntilLandfall: 36,
      expectedRevenueImpact: 1_200_000,
      status: "active",
      updatedAt: now,
      mapCenterLat: MIAMI_BEACH_CENTER.lat,
      mapCenterLng: MIAMI_BEACH_CENTER.lng,
      mapZoom: MIAMI_BEACH_CENTER.zoom,
      stormTrack: [...HURRICANE_MILTON_TRACK],
      riskZones: [...MIAMI_BEACH_RISK_ZONES],
    });

    const opportunities = [
      {
        propertyName: "Ocean View Plaza",
        riskScore: 91,
        expectedRevenue: 180_000,
        status: "identified" as const,
        priorityRank: 1,
        buildingYear: 1974,
        propertyNotes: "Near coastline, High wind exposure",
        riskExplanation:
          "Elevated risk due to 1974 construction, coastal proximity, and high wind exposure profile.",
        revenueExplanation:
          "Premium restoration opportunity at $180,000 driven by 91 risk score and large commercial footprint.",
      },
      {
        propertyName: "Bayfront Towers",
        riskScore: 82,
        expectedRevenue: 95_000,
        status: "identified" as const,
        priorityRank: 2,
        buildingYear: 1988,
        propertyNotes: "Coastal commercial tower",
        riskExplanation:
          "Moderate-high risk from coastal exposure and aging building systems built in 1988.",
        revenueExplanation:
          "Strong $95,000 opportunity with priority rank #2 in the Miami Beach pipeline.",
      },
      {
        propertyName: "Sunset Residences",
        riskScore: 74,
        expectedRevenue: 58_000,
        status: "identified" as const,
        priorityRank: 3,
        buildingYear: 2001,
        propertyNotes: "Residential complex, moderate exposure",
        riskExplanation:
          "Moderate risk score reflecting newer construction with residual storm surge exposure.",
        revenueExplanation:
          "$58,000 expected value based on risk-adjusted property size and market rates.",
      },
      {
        propertyName: "Palm Grove Center",
        riskScore: 62,
        expectedRevenue: 22_000,
        status: "identified" as const,
        priorityRank: 4,
        buildingYear: 1995,
        propertyNotes: "Retail strip, inland exposure",
        riskExplanation:
          "Lower risk inland position with moderate wind exposure on aging retail structure.",
        revenueExplanation:
          "$22,000 opportunity from smaller footprint with residual storm damage potential.",
      },
    ];

    let topOpportunityId: import("./_generated/dataModel").Id<"opportunities"> | null =
      null;

    for (const opportunity of opportunities) {
      const coords = OPPORTUNITY_MAP_COORDS[opportunity.propertyName];
      const id = await ctx.db.insert("opportunities", {
        stormId,
        ...opportunity,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });
      if (opportunity.priorityRank === 1) {
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
          riskScore: 91,
          reasoning: ["Built 1974", "Near coastline", "High wind exposure"],
          openAiRiskReasoning:
            "Elevated structural vulnerability due to age and coastal proximity.",
        },
        revenue: {
          expectedRevenue: 180_000,
          priorityRank: 1,
          revenueSummary:
            "High-value restoration opportunity with urgent timeline before landfall.",
          openAiRevenueSummary:
            "High-value restoration opportunity with urgent timeline before landfall.",
        },
        decisionMaker: {
          company: "ABC Property Management",
          contactName: "John Smith",
          contactTitle: "Director of Operations",
        },
        outreach: {
          emailDraftReady: true,
          emailDraft:
            "Subject: Proactive Storm Preparedness — Ocean View Plaza\n\nDear John,\n\nWith Hurricane Milton approaching Miami Beach, we wanted to reach out proactively regarding storm preparedness and rapid response capabilities for Ocean View Plaza.\n\nOur team specializes in pre-positioned disaster recovery for commercial properties. We would welcome a brief call to discuss your contingency plans.\n\nBest regards,\nOverStorm Recovery Team",
          outreachRecommendation:
            "Send personalized email emphasizing proactive positioning before landfall.",
          openAiOutreachRecommendation:
            "Send personalized email emphasizing proactive positioning before landfall.",
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
        propertyName: "Ocean View Plaza",
        stormName: "Hurricane Milton",
        summary: seedOutput.revenue.revenueSummary,
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
        reasoning: ["Built 1974", "Near coastline", "High wind exposure"],
        openAiRiskReasoning:
          "Elevated structural vulnerability due to age and coastal proximity.",
      },
      revenue: {
        expectedRevenue: topOpportunity.expectedRevenue,
        priorityRank: topOpportunity.priorityRank ?? 1,
        revenueSummary:
          "High-value restoration opportunity with urgent timeline before landfall.",
        openAiRevenueSummary:
          "High-value restoration opportunity with urgent timeline before landfall.",
      },
      decisionMaker: {
        company: "ABC Property Management",
        contactName: "John Smith",
        contactTitle: "Director of Operations",
      },
      outreach: {
        emailDraftReady: true,
        emailDraft:
          "Subject: Proactive Storm Preparedness\n\nDear John,\n\nWith the approaching storm, we wanted to reach out proactively regarding disaster recovery capabilities for your property.\n\nBest regards,\nOverStorm Recovery Team",
        outreachRecommendation:
          "Send personalized email emphasizing proactive positioning before landfall.",
        openAiOutreachRecommendation:
          "Send personalized email emphasizing proactive positioning before landfall.",
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
      summary: seedOutput.revenue.revenueSummary,
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

export const patchMapData = mutation({
  args: {},
  handler: async (ctx) => {
    const storms = await ctx.db.query("storms").collect();
    let stormsPatched = 0;

    for (const storm of storms) {
      const needsPatch =
        !storm.mapCenterLat ||
        !storm.stormTrack?.length ||
        !storm.riskZones?.length;

      if (needsPatch) {
        await ctx.db.patch(storm._id, {
          mapCenterLat: MIAMI_BEACH_CENTER.lat,
          mapCenterLng: MIAMI_BEACH_CENTER.lng,
          mapZoom: MIAMI_BEACH_CENTER.zoom,
          stormTrack: [...HURRICANE_MILTON_TRACK],
          riskZones: [...MIAMI_BEACH_RISK_ZONES],
        });
        stormsPatched += 1;
      }
    }

    const opportunities = await ctx.db.query("opportunities").collect();
    let opportunitiesPatched = 0;

    for (const opportunity of opportunities) {
      const coords = OPPORTUNITY_MAP_COORDS[opportunity.propertyName];
      if (!coords) continue;

      if (
        opportunity.latitude === undefined ||
        opportunity.longitude === undefined
      ) {
        await ctx.db.patch(opportunity._id, {
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        opportunitiesPatched += 1;
      }
    }

    const palmGrove = opportunities.find(
      (opportunity) => opportunity.propertyName === "Palm Grove Center",
    );
    if (!palmGrove && storms[0]) {
      const coords = OPPORTUNITY_MAP_COORDS["Palm Grove Center"];
      await ctx.db.insert("opportunities", {
        stormId: storms[0]._id,
        propertyName: "Palm Grove Center",
        riskScore: 62,
        expectedRevenue: 22_000,
        status: "identified",
        priorityRank: 4,
        buildingYear: 1995,
        propertyNotes: "Retail strip, inland exposure",
        riskExplanation:
          "Lower risk inland position with moderate wind exposure on aging retail structure.",
        revenueExplanation:
          "$22,000 opportunity from smaller footprint with residual storm damage potential.",
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      opportunitiesPatched += 1;
    }

    return {
      patched: stormsPatched > 0 || opportunitiesPatched > 0,
      stormsPatched,
      opportunitiesPatched,
    };
  },
});
