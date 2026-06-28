import { query } from "./_generated/server";
import {
  HURRICANE_MILTON_TRACK,
  MIAMI_BEACH_CENTER,
  MIAMI_BEACH_RISK_ZONES,
} from "./mapData";

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
        map: null,
      };
    }

    const [opportunities, pipelineRows, decisionMakers] = await Promise.all([
      ctx.db
        .query("opportunities")
        .withIndex("by_storm", (q) => q.eq("stormId", activeStorm._id))
        .collect(),
      ctx.db
        .query("pipelineMetrics")
        .withIndex("by_storm", (q) => q.eq("stormId", activeStorm._id))
        .collect(),
      ctx.db.query("decisionMakers").collect(),
    ]);

    const decisionMakerByOpportunity = new Map(
      decisionMakers.map((record) => [record.opportunityId, record]),
    );

    const pipeline = pipelineRows[0] ?? null;

    const topOpportunities = [...opportunities]
      .sort((a, b) => {
        const rankA = a.priorityRank ?? Number.MAX_SAFE_INTEGER;
        const rankB = b.priorityRank ?? Number.MAX_SAFE_INTEGER;
        if (rankA !== rankB) return rankA - rankB;
        return b.expectedRevenue - a.expectedRevenue;
      })
      .slice(0, 10);

    const mapOpportunities = opportunities
      .filter(
        (opportunity) =>
          opportunity.latitude !== undefined &&
          opportunity.longitude !== undefined,
      )
      .map((opportunity) => ({
        _id: opportunity._id,
        propertyName: opportunity.propertyName,
        riskScore: opportunity.riskScore,
        expectedRevenue: opportunity.expectedRevenue,
        status: opportunity.status,
        latitude: opportunity.latitude!,
        longitude: opportunity.longitude!,
        decisionMakerStatus: decisionMakerByOpportunity.has(opportunity._id)
          ? ("discovered" as const)
          : ("pending" as const),
      }));

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
            projectedRevenue: activeStorm.expectedRevenueImpact,
            propertiesAtRisk: pipeline.found,
          }
        : null,
      map: {
        center: {
          lat: activeStorm.mapCenterLat ?? MIAMI_BEACH_CENTER.lat,
          lng: activeStorm.mapCenterLng ?? MIAMI_BEACH_CENTER.lng,
          zoom: activeStorm.mapZoom ?? MIAMI_BEACH_CENTER.zoom,
        },
        stormTrack:
          activeStorm.stormTrack && activeStorm.stormTrack.length > 0
            ? activeStorm.stormTrack
            : [...HURRICANE_MILTON_TRACK],
        riskZones:
          activeStorm.riskZones && activeStorm.riskZones.length > 0
            ? activeStorm.riskZones
            : [...MIAMI_BEACH_RISK_ZONES],
        opportunities: mapOpportunities,
      },
    };
  },
});
