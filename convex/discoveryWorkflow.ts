"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { createFiberService } from "./services/fiber";

export const runDiscoveryWorkflow = internalAction({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, args) => {
    let runId: Id<"agentRuns"> | null = null;

    try {
      const context = await ctx.runQuery(internal.opportunityDb.getDiscoveryContext, {
        opportunityId: args.opportunityId,
      });

      if (!context) {
        throw new Error("Opportunity context not found");
      }

      runId = await ctx.runMutation(internal.opportunityDb.getOrCreateAgentRun, {
        opportunityId: args.opportunityId,
      });

      await ctx.runMutation(internal.opportunityDb.setDecisionMakerRunning, {
        opportunityId: args.opportunityId,
        runId,
      });

      const fiber = createFiberService();
      const result = await fiber.discoverDecisionMaker({
        propertyName: context.opportunity.propertyName,
        location: context.storm.location,
      });

      await ctx.runMutation(internal.opportunityDb.saveDecisionMaker, {
        opportunityId: args.opportunityId,
        runId,
        result,
      });

      try {
        const { createOrangeSliceService } = await import("./services/orangeSlice");
        const orangeSlice = createOrangeSliceService();
        const enrichment = await orangeSlice.enrichCompany({
          companyName: result.company,
          location: context.storm.location,
        });

        await ctx.runMutation(internal.packageDb.saveCompanyEnrichment, {
          opportunityId: args.opportunityId,
          enrichment: {
            companyName: enrichment.companyName,
            companyDescription: enrichment.companyDescription,
            employeeCount: enrichment.employeeCount,
            companySize: enrichment.companySize,
            industry: enrichment.industry,
            headcountGrowth: enrichment.headcountGrowth,
            recentEvents: enrichment.recentEvents,
            locations: enrichment.locations,
            website: enrichment.website,
            domain: enrichment.domain,
            linkedinCompanyUrl: enrichment.linkedinCompanyUrl,
            enrichmentStatus: enrichment.enrichmentStatus,
          },
        });
      } catch (error) {
        console.warn(
          "[discoveryWorkflow] Orange Slice enrichment failed:",
          error instanceof Error ? error.message : error,
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Discovery workflow failed";

      if (runId) {
        await ctx.runMutation(internal.opportunityDb.failDiscovery, {
          runId,
          errorMessage: message,
        });
      }

      throw error;
    }
  },
});
