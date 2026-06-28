import { mutation } from "./_generated/server";

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
      },
      {
        propertyName: "Bayfront Towers",
        riskScore: 82,
        expectedRevenue: 95_000,
        status: "identified" as const,
        priorityRank: 2,
        buildingYear: 1988,
        propertyNotes: "Coastal commercial tower",
      },
      {
        propertyName: "Sunset Residences",
        riskScore: 74,
        expectedRevenue: 58_000,
        status: "identified" as const,
        priorityRank: 3,
        buildingYear: 2001,
        propertyNotes: "Residential complex, moderate exposure",
      },
    ];

    let topOpportunityId: import("./_generated/dataModel").Id<"opportunities"> | null =
      null;

    for (const opportunity of opportunities) {
      const id = await ctx.db.insert("opportunities", {
        stormId,
        ...opportunity,
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
