export type AgentOutput = {
  riskScore?: number;
  reasoning?: string[];
  expectedRevenue?: number;
  priorityRank?: number;
  revenueSummary?: string;
  company?: string;
  contactName?: string;
  contactTitle?: string;
  emailDraftReady?: boolean;
  emailDraft?: string;
  outreachRecommendation?: string;
  openAiRiskReasoning?: string;
  openAiRevenueSummary?: string;
  openAiOutreachRecommendation?: string;
};

export type AgentResultData = {
  _id: string;
  agentType: string;
  status: string;
  stepOrder: number;
  output: AgentOutput | null;
  errorMessage?: string;
};

export type AgentDefinition = {
  type: string;
  title: string;
  description: string;
  workflowStep: string;
};

export const AGENT_DEFINITIONS: AgentDefinition[] = [
  {
    type: "risk",
    title: "Risk Analyst Agent",
    description: "Evaluates structural vulnerability and storm exposure",
    workflowStep: "risk",
  },
  {
    type: "revenue",
    title: "Revenue Agent",
    description: "Calculates opportunity value and priority ranking",
    workflowStep: "revenue",
  },
  {
    type: "decision_maker",
    title: "Decision Maker Agent",
    description: "Identifies property management contacts",
    workflowStep: "decision_maker",
  },
  {
    type: "outreach",
    title: "Outreach Agent",
    description: "Generates personalized outreach communications",
    workflowStep: "outreach",
  },
];

export const WORKFLOW_STEPS = [
  { id: "storm_event", label: "Storm Event" },
  { id: "risk", label: "Risk Agent" },
  { id: "revenue", label: "Revenue Agent" },
  { id: "decision_maker", label: "Decision Maker Agent" },
  { id: "outreach", label: "Outreach Agent" },
  { id: "pipeline", label: "Pipeline" },
] as const;

export function getAgentResult(
  results: AgentResultData[],
  agentType: string,
): AgentResultData | undefined {
  return results.find((result) => result.agentType === agentType);
}

export function formatAgentStatus(status: string): string {
  switch (status) {
    case "running":
      return "Running";
    case "completed":
      return "Completed";
    case "ready":
      return "Ready";
    case "failed":
      return "Failed";
    default:
      return "Pending";
  }
}

export function statusStyles(status: string): string {
  switch (status) {
    case "running":
      return "border-sky-500/40 bg-sky-500/10 text-sky-300";
    case "completed":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
    case "ready":
      return "border-violet-500/40 bg-violet-500/10 text-violet-300";
    case "failed":
      return "border-red-500/40 bg-red-500/10 text-red-300";
    default:
      return "border-slate-600 bg-slate-800/60 text-slate-400";
  }
}
