import { query } from "./_generated/server";
import {
  HURRICANE_WILMA_HISTORICAL,
  MIAMI_BEACH_CENTER,
  WILMA_RISK_ZONES,
} from "./assetData";

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
        assetType: opportunity.assetType,
        city: opportunity.city,
        riskScore: opportunity.riskScore,
        restorationDemandScore:
          opportunity.restorationDemandScore ?? opportunity.riskScore,
        expectedRevenue: opportunity.expectedRevenue,
        status: opportunity.status,
        latitude: opportunity.latitude!,
        longitude: opportunity.longitude!,
        decisionMakerStatus: decisionMakerByOpportunity.has(opportunity._id)
          ? ("discovered" as const)
          : ("pending" as const),
      }));

    const stormTimeline =
      activeStorm.stormTimeline && activeStorm.stormTimeline.length > 0
        ? activeStorm.stormTimeline
        : [...HURRICANE_WILMA_HISTORICAL.timeline];

    const trackedPredictedRevenue = mapOpportunities.reduce(
      (sum, opportunity) => sum + opportunity.expectedRevenue,
      0,
    );
    const highRiskAssetCount = mapOpportunities.filter(
      (opportunity) => opportunity.riskScore >= 85,
    ).length;
    const avgRestorationDemand =
      mapOpportunities.length > 0
        ? Math.round(
            mapOpportunities.reduce(
              (sum, opportunity) => sum + opportunity.restorationDemandScore,
              0,
            ) / mapOpportunities.length,
          )
        : 0;

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
        category:
          activeStorm.category ?? HURRICANE_WILMA_HISTORICAL.category,
        historicalLandfall:
          activeStorm.historicalLandfall ??
          HURRICANE_WILMA_HISTORICAL.historicalLandfall,
        landfallWindSpeedMph:
          activeStorm.landfallWindSpeedMph ??
          HURRICANE_WILMA_HISTORICAL.landfallWindSpeedMph,
        isHistoricalReplay:
          activeStorm.isHistoricalReplay ??
          HURRICANE_WILMA_HISTORICAL.isHistoricalReplay,
        stormTimeline,
      },
      opportunities: topOpportunities.map((opportunity) => ({
        _id: opportunity._id,
        propertyName: opportunity.propertyName,
        assetType: opportunity.assetType,
        city: opportunity.city,
        riskScore: opportunity.riskScore,
        restorationDemandScore:
          opportunity.restorationDemandScore ?? opportunity.riskScore,
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
            predictedRevenueOpportunity: activeStorm.expectedRevenueImpact,
            trackedPredictedRevenue,
            propertiesAtRisk: pipeline.found,
            highRiskAssetCount,
            avgRestorationDemand,
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
            : [...HURRICANE_WILMA_HISTORICAL.stormTrack],
        riskZones:
          activeStorm.riskZones && activeStorm.riskZones.length > 0
            ? activeStorm.riskZones
            : [...WILMA_RISK_ZONES],
        opportunities: mapOpportunities,
        storm: {
          category:
            activeStorm.category ?? HURRICANE_WILMA_HISTORICAL.category,
          peakCategory: HURRICANE_WILMA_HISTORICAL.peakCategory,
          historicalLandfall:
            activeStorm.historicalLandfall ??
            HURRICANE_WILMA_HISTORICAL.historicalLandfall,
          landfallWindSpeedMph:
            activeStorm.landfallWindSpeedMph ??
            HURRICANE_WILMA_HISTORICAL.landfallWindSpeedMph,
          peakWindSpeedMph: HURRICANE_WILMA_HISTORICAL.peakWindSpeedMph,
          isHistoricalReplay:
            activeStorm.isHistoricalReplay ??
            HURRICANE_WILMA_HISTORICAL.isHistoricalReplay,
          timeline: stormTimeline,
        },
        narrative: {
          highRiskAssetCount,
          avgRestorationDemand,
          trackedPredictedRevenue,
        },
      },
    };
  },
});
