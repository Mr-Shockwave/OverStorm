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

export default defineSchema({
  storms: defineTable({
    name: v.string(),
    location: v.string(),
    riskScore: v.number(),
    hoursUntilLandfall: v.number(),
    expectedRevenueImpact: v.number(),
    status: stormStatus,
    updatedAt: v.number(),
  }).index("by_status", ["status"]),

  opportunities: defineTable({
    stormId: v.id("storms"),
    propertyName: v.string(),
    riskScore: v.number(),
    expectedRevenue: v.number(),
    status: opportunityStatus,
    priorityRank: v.optional(v.number()),
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
});
