"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { createFiberService } from "./services/fiber";
import { buildPropertyContext } from "./services/propertyContext";

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

      const propertyContext = buildPropertyContext(
        context.opportunity,
        context.storm,
      );

      runId = await ctx.runMutation(internal.opportunityDb.getOrCreateAgentRun, {
        opportunityId: args.opportunityId,
      });

      await ctx.runMutation(internal.opportunityDb.setDecisionMakerRunning, {
        opportunityId: args.opportunityId,
        runId,
      });

      const fiber = createFiberService();
      const outcome = await fiber.discoverDecisionMaker(propertyContext, {
        revealContact: false,
        onProgress: async (step, message) => {
          if (!runId) return;
          await ctx.runMutation(internal.opportunityDb.setDiscoveryProgress, {
            runId,
            step,
            message,
          });
        },
      });

      if (outcome.status === "found") {
        await ctx.runMutation(internal.opportunityDb.saveDecisionMaker, {
          opportunityId: args.opportunityId,
          runId,
          result: outcome.result,
        });
        return;
      }

      await ctx.runMutation(internal.opportunityDb.saveDiscoveryUnavailable, {
        opportunityId: args.opportunityId,
        runId,
        outcome: {
          propertyName: outcome.propertyName,
          city: outcome.city,
          address: outcome.address,
          latitude: outcome.latitude,
          longitude: outcome.longitude,
          message: outcome.message,
          visitLocation: outcome.visitLocation,
          bestCandidate: outcome.bestCandidate,
          bestConfidence: outcome.bestConfidence,
        },
      });
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
