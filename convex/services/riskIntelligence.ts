/**
 * OverStorm Proprietary Risk Model & Revenue Opportunity Model.
 * Not a FEMA formula — proprietary weighted scoring for demo transparency.
 */

export const RISK_MODEL_NAME = "OverStorm Proprietary Risk Model";

export const RISK_WEIGHTS = {
  coastalExposure: { weight: 0.3, label: "Coastal Exposure" },
  floodZoneSeverity: { weight: 0.25, label: "Flood Zone Severity" },
  elevationRisk: { weight: 0.2, label: "Elevation Risk" },
  stormPathProximity: { weight: 0.15, label: "Storm Path Proximity" },
  assetVulnerability: { weight: 0.1, label: "Asset Vulnerability" },
} as const;

export type RiskComponentKey = keyof typeof RISK_WEIGHTS;

export type RiskBreakdownInput = {
  coastalExposure: number;
  floodZoneSeverity: number;
  elevationRisk: number;
  stormPathProximity: number;
  assetVulnerability: number;
};

export type RiskBreakdownComponent = {
  key: RiskComponentKey;
  label: string;
  score: number;
  weight: number;
  weightPercent: number;
  contribution: number;
};

export type RiskIntelligenceResult = {
  riskScore: number;
  breakdown: RiskBreakdownComponent[];
  whyAtRisk: string;
  riskExplanation: string;
};

export type RevenueModelInput = {
  riskScore: number;
  assetValueFactor: number;
  repairComplexityFactor: number;
};

export type RevenueModelResult = {
  expectedRevenue: number;
  assetValueFactor: number;
  repairComplexityFactor: number;
  baseScale: number;
  revenueExplanation: string;
};

export const REVENUE_BASE_SCALE = 100_000;

export function computeRiskScore(breakdown: RiskBreakdownInput): number {
  let total = 0;
  for (const key of Object.keys(RISK_WEIGHTS) as RiskComponentKey[]) {
    total += breakdown[key] * RISK_WEIGHTS[key].weight;
  }
  return Math.round(total);
}

export function buildRiskBreakdown(
  breakdown: RiskBreakdownInput,
): RiskBreakdownComponent[] {
  return (Object.keys(RISK_WEIGHTS) as RiskComponentKey[]).map((key) => {
    const { weight, label } = RISK_WEIGHTS[key];
    const score = breakdown[key];
    return {
      key,
      label,
      score,
      weight,
      weightPercent: Math.round(weight * 100),
      contribution: Math.round(score * weight * 10) / 10,
    };
  });
}

export function buildWhyAtRisk(input: {
  propertyName: string;
  assetType: string;
  city: string;
  buildingYear?: number;
  breakdown: RiskBreakdownInput;
}): string {
  const parts: string[] = [];

  if (input.breakdown.coastalExposure >= 90) {
    parts.push(
      `${input.propertyName} sits on direct Atlantic coastline exposure in ${input.city}, placing it in the highest coastal surge and wind band for barrier-island assets.`,
    );
  } else if (input.breakdown.coastalExposure >= 80) {
    parts.push(
      `${input.propertyName} has strong coastal exposure on the Miami Beach barrier island with limited natural protection from open-water storm fetch.`,
    );
  }

  if (input.breakdown.elevationRisk >= 85) {
    parts.push(
      "Low elevation (typically under 10 ft) increases inundation risk during storm surge and king-tide events.",
    );
  }

  if (input.breakdown.floodZoneSeverity >= 88) {
    parts.push(
      "Flood zone severity is elevated — the site aligns with Miami-Dade coastal AE surge zones where FEMA-mapped flood exposure is documented.",
    );
  } else if (input.breakdown.floodZoneSeverity >= 80) {
    parts.push(
      "Proximity to documented coastal flood zones raises expected water-intrusion exposure during major hurricane events.",
    );
  }

  if (input.breakdown.stormPathProximity >= 88) {
    parts.push(
      "Storm-path proximity is high for this replay: Hurricane Wilma's eye crossed Miami-Dade — Collins Ave corridor sat inside the core wind field.",
    );
  } else if (input.breakdown.stormPathProximity >= 75) {
    parts.push(
      "Regional storm-path proximity places this asset inside Wilma's South Florida transect for wind, rain, and surge effects.",
    );
  }

  if (input.buildingYear && input.buildingYear < 1980) {
    parts.push(
      `Asset vulnerability is elevated — ${input.assetType} built in ${input.buildingYear} carries aging envelope and MEP systems more susceptible to wind-driven rain and prolonged outage recovery.`,
    );
  } else if (input.breakdown.assetVulnerability >= 85) {
    parts.push(
      `Large-format ${input.assetType} footprint increases restoration surface area and operational downtime exposure.`,
    );
  } else {
    parts.push(
      `${input.assetType} operational complexity adds moderate vulnerability during extended power and water disruption.`,
    );
  }

  return parts.join(" ");
}

export function buildRiskExplanation(whyAtRisk: string): string {
  return whyAtRisk;
}

export function computeRevenueOpportunity(
  input: RevenueModelInput,
): RevenueModelResult {
  const expectedRevenue = Math.round(
    (input.riskScore / 100) *
      input.assetValueFactor *
      input.repairComplexityFactor *
      REVENUE_BASE_SCALE,
  );

  const revenueExplanation =
    `OverStorm predicts a $${expectedRevenue.toLocaleString()} revenue opportunity using the proprietary Revenue Opportunity Model: ` +
    `(Risk Score ${input.riskScore} ÷ 100) × Asset Value Factor ${input.assetValueFactor.toFixed(2)} × ` +
    `Repair Complexity Factor ${input.repairComplexityFactor.toFixed(2)} × Base Scale $${REVENUE_BASE_SCALE.toLocaleString()}. ` +
    "This is a model output — not a real-world damage estimate or government forecast.";

  return {
    expectedRevenue,
    assetValueFactor: input.assetValueFactor,
    repairComplexityFactor: input.repairComplexityFactor,
    baseScale: REVENUE_BASE_SCALE,
    revenueExplanation,
  };
}

export function buildRiskIntelligence(input: {
  propertyName: string;
  assetType: string;
  city: string;
  buildingYear?: number;
  breakdown: RiskBreakdownInput;
  assetValueFactor: number;
  repairComplexityFactor: number;
}): RiskIntelligenceResult & RevenueModelResult {
  const riskScore = computeRiskScore(input.breakdown);
  const breakdown = buildRiskBreakdown(input.breakdown);
  const whyAtRisk = buildWhyAtRisk({
    propertyName: input.propertyName,
    assetType: input.assetType,
    city: input.city,
    buildingYear: input.buildingYear,
    breakdown: input.breakdown,
  });
  const revenue = computeRevenueOpportunity({
    riskScore,
    assetValueFactor: input.assetValueFactor,
    repairComplexityFactor: input.repairComplexityFactor,
  });

  return {
    riskScore,
    breakdown,
    whyAtRisk,
    riskExplanation: buildRiskExplanation(whyAtRisk),
    ...revenue,
  };
}
