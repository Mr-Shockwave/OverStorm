export const RISK_MODEL_NAME = "OverStorm Proprietary Risk Model";

export const RISK_FORMULA_COMPONENTS = [
  { label: "Coastal Exposure", weightPercent: 30 },
  { label: "Flood Zone Severity", weightPercent: 25 },
  { label: "Elevation Risk", weightPercent: 20 },
  { label: "Storm Path Proximity", weightPercent: 15 },
  { label: "Asset Vulnerability", weightPercent: 10 },
] as const;

export const REVENUE_FORMULA =
  "Predicted Revenue = (Risk Score ÷ 100) × Asset Value Factor × Repair Complexity Factor × Base Scale";

export const REVENUE_DISCLAIMER =
  "OverStorm prediction only — not a real-world damage estimate or government forecast.";

export type RiskBreakdownItem = {
  key: string;
  label: string;
  score: number;
  weight: number;
  weightPercent: number;
  contribution: number;
};

export type RiskIntelligenceData = {
  modelName: string;
  riskScore: number;
  formula: Array<{ label: string; weightPercent: number }>;
  breakdown: RiskBreakdownItem[];
  whyAtRisk: string;
  revenueModel: {
    assetValueFactor: number;
    repairComplexityFactor: number;
    baseScale: number;
    formula: string;
    disclaimer: string;
  } | null;
};

export function breakdownBarColor(score: number): string {
  if (score >= 90) return "bg-red-500";
  if (score >= 80) return "bg-orange-500";
  if (score >= 70) return "bg-amber-500";
  return "bg-slate-400";
}
