"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { analyzePropertyWithOpenAI } from "./services/openai";
import { findDecisionMaker } from "./services/fiber";
import { enrichProperty } from "./services/orangeSlice";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const runFullAnalysisWorkflow = internalAction({
  args: { runId: v.id("agentRuns") },
  handler: async (ctx, args) => {
    let currentAgent: "risk" | "revenue" | "decision_maker" | "outreach" = "risk";

    try {
      const context = await ctx.runQuery(internal.agentDb.getRunContext, {
        runId: args.runId,
      });

      if (!context) {
        throw new Error("Analysis run context not found");
      }

      const { run, storm, opportunity } = context;

      await ctx.runMutation(internal.agentDb.setRunStep, {
        runId: args.runId,
        currentStep: "risk",
        status: "running",
      });

      currentAgent = "risk";

      const enrichment = await enrichProperty({
        propertyName: opportunity.propertyName,
        location: storm.location,
      });

      await ctx.runMutation(internal.agentDb.setAgentResultStatus, {
        runId: args.runId,
        agentType: "risk",
        status: "running",
      });

      await sleep(600);

      const openAiAnalysis = await analyzePropertyWithOpenAI({
        stormName: storm.name,
        stormLocation: storm.location,
        propertyName: opportunity.propertyName,
        riskScore: opportunity.riskScore,
        expectedRevenue: opportunity.expectedRevenue,
        buildingYear: opportunity.buildingYear ?? enrichment.buildingYear,
        propertyNotes:
          opportunity.propertyNotes ?? enrichment.notes.join(", "),
      });

      const riskReasoning = [
        ...openAiAnalysis.riskReasoning.slice(0, 2),
        ...(enrichment.buildingYear
          ? [`Built ${enrichment.buildingYear}`]
          : []),
        ...enrichment.notes.slice(0, 2),
      ].slice(0, 4);

      await ctx.runMutation(internal.agentDb.setAgentResultStatus, {
        runId: args.runId,
        agentType: "risk",
        status: "completed",
        output: {
          riskScore: opportunity.riskScore,
          reasoning: riskReasoning,
          openAiRiskReasoning: openAiAnalysis.riskReasoning.join(" "),
        },
      });

      await ctx.runMutation(internal.agentDb.setRunStep, {
        runId: args.runId,
        currentStep: "revenue",
      });

      currentAgent = "revenue";

      await ctx.runMutation(internal.agentDb.setAgentResultStatus, {
        runId: args.runId,
        agentType: "revenue",
        status: "running",
      });

      await sleep(500);

      await ctx.runMutation(internal.agentDb.setAgentResultStatus, {
        runId: args.runId,
        agentType: "revenue",
        status: "completed",
        output: {
          expectedRevenue: opportunity.expectedRevenue,
          priorityRank: opportunity.priorityRank ?? 1,
          revenueSummary: openAiAnalysis.revenueSummary,
          openAiRevenueSummary: openAiAnalysis.revenueSummary,
        },
      });

      await ctx.runMutation(internal.agentDb.setRunStep, {
        runId: args.runId,
        currentStep: "decision_maker",
      });

      currentAgent = "decision_maker";

      await ctx.runMutation(internal.agentDb.setAgentResultStatus, {
        runId: args.runId,
        agentType: "decision_maker",
        status: "running",
      });

      await sleep(500);

      const decisionMaker = await findDecisionMaker({
        propertyName: opportunity.propertyName,
        location: storm.location,
      });

      await ctx.runMutation(internal.agentDb.setAgentResultStatus, {
        runId: args.runId,
        agentType: "decision_maker",
        status: "ready",
        output: {
          company: decisionMaker.company,
          contactName: decisionMaker.contactName,
          contactTitle: decisionMaker.contactTitle,
        },
      });

      await ctx.runMutation(internal.agentDb.setRunStep, {
        runId: args.runId,
        currentStep: "outreach",
      });

      currentAgent = "outreach";

      await ctx.runMutation(internal.agentDb.setAgentResultStatus, {
        runId: args.runId,
        agentType: "outreach",
        status: "running",
      });

      await sleep(500);

      await ctx.runMutation(internal.agentDb.setAgentResultStatus, {
        runId: args.runId,
        agentType: "outreach",
        status: "ready",
        output: {
          emailDraftReady: true,
          emailDraft: openAiAnalysis.emailDraft,
          outreachRecommendation: openAiAnalysis.outreachRecommendation,
          openAiOutreachRecommendation: openAiAnalysis.outreachRecommendation,
        },
      });

      await ctx.runMutation(internal.agentDb.setRunStep, {
        runId: args.runId,
        currentStep: "pipeline",
      });

      await sleep(400);

      const snapshot = {
        riskScore: opportunity.riskScore,
        reasoning: riskReasoning,
        expectedRevenue: opportunity.expectedRevenue,
        priorityRank: opportunity.priorityRank ?? 1,
        revenueSummary: openAiAnalysis.revenueSummary,
        company: decisionMaker.company,
        contactName: decisionMaker.contactName,
        contactTitle: decisionMaker.contactTitle,
        emailDraftReady: true,
        emailDraft: openAiAnalysis.emailDraft,
        outreachRecommendation: openAiAnalysis.outreachRecommendation,
        openAiRiskReasoning: openAiAnalysis.riskReasoning.join(" "),
        openAiRevenueSummary: openAiAnalysis.revenueSummary,
        openAiOutreachRecommendation: openAiAnalysis.outreachRecommendation,
      };

      await ctx.runMutation(internal.agentDb.completeAnalysis, {
        runId: args.runId,
        stormId: storm._id,
        opportunityId: opportunity._id,
        propertyName: opportunity.propertyName,
        stormName: storm.name,
        summary: openAiAnalysis.revenueSummary,
        snapshot,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown workflow error";

      await ctx.runMutation(internal.agentDb.failRun, {
        runId: args.runId,
        errorMessage: message,
        agentType: currentAgent,
      });
    }
  },
});
