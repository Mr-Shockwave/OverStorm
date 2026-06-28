import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const opportunityStatus = v.union(
  v.literal("identified"),
  v.literal("contacted"),
  v.literal("responded"),
  v.literal("meeting_scheduled"),
  v.literal("closed_won"),
  v.literal("closed_lost"),
);

export const stormStatus = v.union(
  v.literal("active"),
  v.literal("monitoring"),
  v.literal("passed"),
);

export const agentType = v.union(
  v.literal("risk"),
  v.literal("revenue"),
  v.literal("decision_maker"),
  v.literal("outreach"),
);

export const agentStepStatus = v.union(
  v.literal("pending"),
  v.literal("running"),
  v.literal("completed"),
  v.literal("ready"),
  v.literal("failed"),
);

export const agentRunStatus = v.union(
  v.literal("pending"),
  v.literal("running"),
  v.literal("completed"),
  v.literal("failed"),
);

export const agentRunKind = v.union(
  v.literal("full"),
  v.literal("discovery"),
  v.literal("package"),
);

export const workflowStep = v.union(
  v.literal("storm_event"),
  v.literal("risk"),
  v.literal("revenue"),
  v.literal("decision_maker"),
  v.literal("orange_slice_enrichment"),
  v.literal("outreach"),
  v.literal("pipeline"),
  v.literal("completed"),
);

export const packageWorkflowStatus = v.union(
  v.literal("pending"),
  v.literal("analyzing_company"),
  v.literal("checking_signals"),
  v.literal("building_strategy"),
  v.literal("generating_package"),
  v.literal("completed"),
  v.literal("failed"),
);

export const enrichmentStatus = v.union(
  v.literal("full"),
  v.literal("limited"),
);

export const companyEnrichmentFields = v.object({
  companyName: v.string(),
  companyDescription: v.optional(v.string()),
  employeeCount: v.optional(v.number()),
  companySize: v.optional(v.string()),
  industry: v.optional(v.string()),
  headcountGrowth: v.optional(v.string()),
  recentEvents: v.optional(v.array(v.string())),
  locations: v.optional(v.array(v.string())),
  website: v.optional(v.string()),
  domain: v.optional(v.string()),
  linkedinCompanyUrl: v.optional(v.string()),
  enrichmentStatus: enrichmentStatus,
});

export const revenueCapturePackageContent = v.object({
  executiveSummary: v.string(),
  personalizedEmail: v.string(),
  linkedinMessage: v.string(),
  callScript: v.string(),
  aiReasoning: v.string(),
});

export const stormTrackPoint = v.object({
  lat: v.number(),
  lng: v.number(),
  label: v.optional(v.string()),
  hoursOffset: v.optional(v.number()),
});

export const riskZoneLevel = v.union(
  v.literal("high"),
  v.literal("medium"),
  v.literal("low"),
);

export const stormRiskZone = v.object({
  level: riskZoneLevel,
  centerLat: v.number(),
  centerLng: v.number(),
  radiusMeters: v.number(),
});

export const stormTimelineEntry = v.object({
  label: v.string(),
  description: v.string(),
});

export const riskBreakdownFields = v.object({
  coastalExposure: v.number(),
  floodZoneSeverity: v.number(),
  elevationRisk: v.number(),
  stormPathProximity: v.number(),
  assetVulnerability: v.number(),
});

export const revenueModelFields = v.object({
  assetValueFactor: v.number(),
  repairComplexityFactor: v.number(),
  baseScale: v.number(),
});

export const agentOutput = v.object({
  riskScore: v.optional(v.number()),
  reasoning: v.optional(v.array(v.string())),
  expectedRevenue: v.optional(v.number()),
  priorityRank: v.optional(v.number()),
  revenueSummary: v.optional(v.string()),
  company: v.optional(v.string()),
  contactName: v.optional(v.string()),
  contactTitle: v.optional(v.string()),
  phone: v.optional(v.string()),
  emailDraftReady: v.optional(v.boolean()),
  emailDraft: v.optional(v.string()),
  outreachRecommendation: v.optional(v.string()),
  openAiRiskReasoning: v.optional(v.string()),
  openAiRevenueSummary: v.optional(v.string()),
  openAiOutreachRecommendation: v.optional(v.string()),
  progressStep: v.optional(v.string()),
  progressMessage: v.optional(v.string()),
  availability: v.optional(v.string()),
  message: v.optional(v.string()),
  visitLocation: v.optional(v.string()),
  address: v.optional(v.string()),
  latitude: v.optional(v.number()),
  longitude: v.optional(v.number()),
  bestCandidate: v.optional(v.string()),
  bestConfidence: v.optional(v.number()),
  propertyName: v.optional(v.string()),
});

export default defineSchema({
  storms: defineTable({
    name: v.string(),
    location: v.string(),
    riskScore: v.number(),
    hoursUntilLandfall: v.number(),
    expectedRevenueImpact: v.number(),
    status: stormStatus,
    updatedAt: v.number(),
    mapCenterLat: v.optional(v.number()),
    mapCenterLng: v.optional(v.number()),
    mapZoom: v.optional(v.number()),
    stormTrack: v.optional(v.array(stormTrackPoint)),
    riskZones: v.optional(v.array(stormRiskZone)),
    category: v.optional(v.string()),
    historicalLandfall: v.optional(v.string()),
    landfallWindSpeedMph: v.optional(v.number()),
    isHistoricalReplay: v.optional(v.boolean()),
    stormTimeline: v.optional(v.array(stormTimelineEntry)),
  }).index("by_status", ["status"]),

  opportunities: defineTable({
    stormId: v.id("storms"),
    propertyName: v.string(),
    riskScore: v.number(),
    expectedRevenue: v.number(),
    status: opportunityStatus,
    priorityRank: v.optional(v.number()),
    buildingYear: v.optional(v.number()),
    propertyNotes: v.optional(v.string()),
    riskExplanation: v.optional(v.string()),
    revenueExplanation: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    address: v.optional(v.string()),
    propertyPhone: v.optional(v.string()),
    searchAliases: v.optional(v.array(v.string())),
    excludedEmployerPatterns: v.optional(v.array(v.string())),
    requiredEmployerTokens: v.optional(v.array(v.string())),
    assetType: v.optional(v.string()),
    city: v.optional(v.string()),
    restorationDemandScore: v.optional(v.number()),
    riskBreakdown: v.optional(riskBreakdownFields),
    whyAtRisk: v.optional(v.string()),
    revenueModel: v.optional(revenueModelFields),
  })
    .index("by_storm", ["stormId"])
    .index("by_storm_and_rank", ["stormId", "priorityRank"]),

  pipelineMetrics: defineTable({
    stormId: v.id("storms"),
    found: v.number(),
    highPriorityCount: v.number(),
    contacted: v.number(),
    responded: v.number(),
    meetings: v.number(),
    updatedAt: v.number(),
  }).index("by_storm", ["stormId"]),

  agentRuns: defineTable({
    stormId: v.id("storms"),
    opportunityId: v.id("opportunities"),
    runKind: v.optional(agentRunKind),
    status: agentRunStatus,
    currentStep: workflowStep,
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  })
    .index("by_storm", ["stormId"])
    .index("by_opportunity", ["opportunityId"]),

  agentResults: defineTable({
    runId: v.id("agentRuns"),
    agentType: agentType,
    status: agentStepStatus,
    stepOrder: v.number(),
    output: v.optional(agentOutput),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  })
    .index("by_run", ["runId"])
    .index("by_run_and_type", ["runId", "agentType"]),

  analysisHistory: defineTable({
    runId: v.id("agentRuns"),
    stormId: v.id("storms"),
    opportunityId: v.id("opportunities"),
    propertyName: v.string(),
    stormName: v.string(),
    summary: v.string(),
    completedAt: v.number(),
    snapshot: agentOutput,
  })
    .index("by_storm", ["stormId"])
    .index("by_completed_at", ["completedAt"]),

  decisionMakers: defineTable({
    opportunityId: v.id("opportunities"),
    propertyName: v.optional(v.string()),
    company: v.string(),
    matchedCompany: v.optional(v.string()),
    matchConfidence: v.optional(v.number()),
    verified: v.optional(v.boolean()),
    searchCenterLat: v.optional(v.number()),
    searchCenterLng: v.optional(v.number()),
    contactName: v.string(),
    contactTitle: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    source: v.union(v.literal("fiber"), v.literal("manual")),
    discoveredAt: v.number(),
  }).index("by_opportunity", ["opportunityId"]),

  companyEnrichments: defineTable({
    opportunityId: v.id("opportunities"),
    companyName: v.string(),
    companyDescription: v.optional(v.string()),
    employeeCount: v.optional(v.number()),
    companySize: v.optional(v.string()),
    industry: v.optional(v.string()),
    headcountGrowth: v.optional(v.string()),
    recentEvents: v.optional(v.array(v.string())),
    locations: v.optional(v.array(v.string())),
    website: v.optional(v.string()),
    domain: v.optional(v.string()),
    linkedinCompanyUrl: v.optional(v.string()),
    enrichmentStatus: enrichmentStatus,
    enrichedAt: v.number(),
  }).index("by_opportunity", ["opportunityId"]),

  revenueCapturePackages: defineTable({
    opportunityId: v.id("opportunities"),
    runId: v.id("agentRuns"),
    status: packageWorkflowStatus,
    workflowLabel: v.string(),
    limitedIntelligence: v.boolean(),
    executiveSummary: v.optional(v.string()),
    personalizedEmail: v.optional(v.string()),
    linkedinMessage: v.optional(v.string()),
    callScript: v.optional(v.string()),
    aiReasoning: v.optional(v.string()),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  })
    .index("by_opportunity", ["opportunityId"])
    .index("by_opportunity_and_started", ["opportunityId", "startedAt"]),
});
