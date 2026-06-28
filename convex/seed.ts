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
      expectedRevenueImpact: 2_200_000,
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
      },
      {
        propertyName: "Bayfront Towers",
        riskScore: 82,
        expectedRevenue: 95_000,
        status: "identified" as const,
        priorityRank: 2,
      },
      {
        propertyName: "Sunset Residences",
        riskScore: 74,
        expectedRevenue: 58_000,
        status: "identified" as const,
        priorityRank: 3,
      },
    ];

    for (const opportunity of opportunities) {
      await ctx.db.insert("opportunities", {
        stormId,
        ...opportunity,
      });
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

    return { seeded: true, stormId };
  },
});
