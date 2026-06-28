"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { createOrangeSliceService } from "./services/orangeSlice";
import { generateRevenueCapturePackage } from "./services/revenuePackage";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const runPackageWorkflow = internalAction({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, args) => {
    let packageId: Id<"revenueCapturePackages"> | null = null;
    let runId: Id<"agentRuns"> | null = null;

    try {
      const context = await ctx.runQuery(internal.packageDb.getPackageContext, {
        opportunityId: args.opportunityId,
      });

      if (!context) {
        throw new Error("Package context not found");
      }

      if (!context.decisionMaker) {
        throw new Error(
          "Run Fiber discovery first to identify a decision maker",
        );
      }

      const created = await ctx.runMutation(internal.packageDb.createPackageRun, {
        opportunityId: args.opportunityId,
      });
      packageId = created.packageId;
      runId = created.runId;

      await ctx.runMutation(internal.packageDb.setOutreachRunning, { runId });

      await ctx.runMutation(internal.packageDb.updatePackageStatus, {
        packageId,
        runId,
        status: "analyzing_company",
        workflowLabel: "Analyzing company…",
        currentStep: "orange_slice_enrichment",
      });

      await sleep(500);

      let enrichmentData: {
        companyDescription?: string;
        employeeCount?: number;
        companySize?: string;
        industry?: string;
        headcountGrowth?: string;
        recentEvents?: string[];
        locations?: string[];
      } | null = context.enrichment
        ? {
            companyDescription: context.enrichment.companyDescription,
            employeeCount: context.enrichment.employeeCount,
            companySize: context.enrichment.companySize,
            industry: context.enrichment.industry,
            headcountGrowth: context.enrichment.headcountGrowth,
            recentEvents: context.enrichment.recentEvents,
            locations: context.enrichment.locations,
          }
        : null;
      let limitedIntelligence = context.enrichment?.enrichmentStatus === "limited";

      try {
        const orangeSlice = createOrangeSliceService();
        const result = await orangeSlice.enrichCompany({
          companyName: context.decisionMaker.company,
          location: context.storm.location,
          domain: context.enrichment?.domain,
        });

        await ctx.runMutation(internal.packageDb.saveCompanyEnrichment, {
          opportunityId: args.opportunityId,
          enrichment: {
            companyName: result.companyName,
            companyDescription: result.companyDescription,
            employeeCount: result.employeeCount,
            companySize: result.companySize,
            industry: result.industry,
            headcountGrowth: result.headcountGrowth,
            recentEvents: result.recentEvents,
            locations: result.locations,
            website: result.website,
            domain: result.domain,
            linkedinCompanyUrl: result.linkedinCompanyUrl,
            enrichmentStatus: result.enrichmentStatus,
          },
        });

        enrichmentData = result;
        limitedIntelligence = result.enrichmentStatus === "limited";
      } catch (error) {
        console.warn(
          "[packageWorkflow] Orange Slice enrichment failed:",
          error instanceof Error ? error.message : error,
        );
        limitedIntelligence = true;
      }

      await ctx.runMutation(internal.packageDb.updatePackageStatus, {
        packageId,
        runId,
        status: "checking_signals",
        workflowLabel: "Checking growth signals…",
        currentStep: "orange_slice_enrichment",
      });

      await sleep(500);

      await ctx.runMutation(internal.packageDb.updatePackageStatus, {
        packageId,
        runId,
        status: "building_strategy",
        workflowLabel: "Building outreach strategy…",
        currentStep: "outreach",
      });

      await sleep(500);

      await ctx.runMutation(internal.packageDb.updatePackageStatus, {
        packageId,
        runId,
        status: "generating_package",
        workflowLabel: "Generating package…",
        currentStep: "outreach",
      });

      const riskExplanation =
        context.opportunity.riskExplanation ??
        `Risk score ${context.opportunity.riskScore}/100`;
      const revenueExplanation =
        context.opportunity.revenueExplanation ??
        `Expected revenue $${context.opportunity.expectedRevenue.toLocaleString()}`;

      const packageContent = await generateRevenueCapturePackage({
        stormName: context.storm.name,
        stormLocation: context.storm.location,
        propertyName: context.opportunity.propertyName,
        riskScore: context.opportunity.riskScore,
        riskExplanation,
        expectedRevenue: context.opportunity.expectedRevenue,
        revenueExplanation,
        contactName: context.decisionMaker.contactName,
        contactTitle: context.decisionMaker.contactTitle,
        company: context.decisionMaker.company,
        email: context.decisionMaker.email,
        phone: context.decisionMaker.phone,
        companyDescription: enrichmentData?.companyDescription,
        employeeCount: enrichmentData?.employeeCount,
        companySize: enrichmentData?.companySize,
        industry: enrichmentData?.industry,
        headcountGrowth: enrichmentData?.headcountGrowth,
        recentEvents: enrichmentData?.recentEvents,
        locations: enrichmentData?.locations,
        limitedIntelligence,
      });

      await ctx.runMutation(internal.packageDb.completePackage, {
        packageId,
        runId,
        limitedIntelligence,
        content: packageContent,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Package workflow failed";

      if (packageId && runId) {
        await ctx.runMutation(internal.packageDb.failPackage, {
          packageId,
          runId,
          errorMessage: message,
        });
      }

      throw error;
    }
  },
});
