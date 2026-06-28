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
  availability?: string;
  message?: string;
  visitLocation?: string;
  bestCandidate?: string;
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
  { id: "storm_event", label: "Storm Replay" },
  { id: "risk", label: "Risk Model" },
  { id: "decision_maker", label: "Discovery" },
  { id: "orange_slice_enrichment", label: "Orange Slice" },
  { id: "outreach", label: "Revenue Package" },
  { id: "pipeline", label: "Pipeline" },
] as const;

export type WorkflowStepId = (typeof WORKFLOW_STEPS)[number]["id"];

export type DiscoveryStatus =
  | "pending"
  | "running"
  | "found"
  | "unavailable"
  | "failed";

export type PackageStatus = "pending" | "running" | "completed" | "failed";

export function discoveryStatusStyles(status: DiscoveryStatus): string {
  switch (status) {
    case "running":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "found":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "unavailable":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "failed":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

export function packageStatusStyles(status: PackageStatus): string {
  switch (status) {
    case "running":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "failed":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

export function formatDiscoveryStatus(status: DiscoveryStatus): string {
  switch (status) {
    case "running":
      return "Running";
    case "found":
      return "Contact Found";
    case "unavailable":
      return "Visit Needed";
    case "failed":
      return "Failed";
    default:
      return "Pending";
  }
}

export function formatPackageStatus(status: PackageStatus): string {
  switch (status) {
    case "running":
      return "Generating";
    case "completed":
      return "Ready";
    case "failed":
      return "Failed";
    default:
      return "Pending";
  }
}

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

export function statusStylesLight(status: string): string {
  switch (status) {
    case "running":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "ready":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "failed":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}
