import { query } from "./_generated/server";

export const getDashboard = query({
  args: {},
  handler: async (ctx) => {
    const activeStorms = await ctx.db
      .query("storms")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const activeStorm = activeStorms[0] ?? null;

    if (!activeStorm) {
      return {
        activeStormCount: 0,
        opportunityCount: 0,
        activeStorm: null,
        opportunities: [],
        pipeline: null,
        metrics: null,
      };
    }

    const [opportunities, pipelineRows] = await Promise.all([
      ctx.db
        .query("opportunities")
        .withIndex("by_storm", (q) => q.eq("stormId", activeStorm._id))
        .collect(),
      ctx.db
        .query("pipelineMetrics")
        .withIndex("by_storm", (q) => q.eq("stormId", activeStorm._id))
        .collect(),
    ]);

    const pipeline = pipelineRows[0] ?? null;

    const topOpportunities = [...opportunities]
      .sort((a, b) => {
        const rankA = a.priorityRank ?? Number.MAX_SAFE_INTEGER;
        const rankB = b.priorityRank ?? Number.MAX_SAFE_INTEGER;
        if (rankA !== rankB) return rankA - rankB;
        return b.expectedRevenue - a.expectedRevenue;
      })
      .slice(0, 10);

    return {
      activeStormCount: activeStorms.length,
      opportunityCount: pipeline?.found ?? opportunities.length,
      activeStorm: {
        _id: activeStorm._id,
        name: activeStorm.name,
        location: activeStorm.location,
        riskScore: activeStorm.riskScore,
        hoursUntilLandfall: activeStorm.hoursUntilLandfall,
        expectedRevenueImpact: activeStorm.expectedRevenueImpact,
      },
      opportunities: topOpportunities.map((opportunity) => ({
        _id: opportunity._id,
        propertyName: opportunity.propertyName,
        riskScore: opportunity.riskScore,
        expectedRevenue: opportunity.expectedRevenue,
        status: opportunity.status,
      })),
      pipeline: pipeline
        ? {
            found: pipeline.found,
            highPriorityCount: pipeline.highPriorityCount,
            contacted: pipeline.contacted,
            responded: pipeline.responded,
            meetings: pipeline.meetings,
          }
        : null,
      metrics: pipeline
        ? {
            propertiesAtRisk: pipeline.found,
            highPriorityOpportunities: pipeline.highPriorityCount,
            projectedRevenue: activeStorm.expectedRevenueImpact,
            meetingsBooked: pipeline.meetings,
          }
        : null,
    };
  },
});
