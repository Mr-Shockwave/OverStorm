/**
 * Miami coastal hospitality assets — coordinates aligned to Google Maps place pins.
 * Addresses sourced from public listing / Maps data (Collins Ave, Lincoln Rd).
 */

import type { RiskBreakdownInput } from "./services/riskIntelligence";
import { buildRiskIntelligence } from "./services/riskIntelligence";

export const MIAMI_BEACH_CENTER = {
  lat: 25.807,
  lng: -80.128,
  zoom: 13,
};

export const HURRICANE_MILTON_HISTORICAL = {
  name: "Hurricane Milton",
  location: "South Florida / Gulf Coast",
  category: "Category 3",
  historicalLandfall: "Siesta Key, Florida — October 9, 2024",
  landfallWindSpeedMph: 120,
  isHistoricalReplay: true,
  riskScore: 89,
  expectedRevenueImpact: 1_200_000,
  hoursUntilLandfall: 0,
  timeline: [
    {
      label: "Oct 5",
      description:
        "Tropical depression forms in the southwestern Gulf of Mexico.",
    },
    {
      label: "Oct 7",
      description:
        "Rapid intensification to major hurricane status over the eastern Gulf.",
    },
    {
      label: "Oct 8",
      description:
        "Peak intensity reaches Category 5 in the eastern Gulf of Mexico.",
    },
    {
      label: "Landfall",
      description:
        "Category 3 landfall near Siesta Key, Florida with 120 mph sustained winds.",
    },
  ],
  stormTrack: [
    { lat: 24.8, lng: -90.2, label: "Oct 5", hoursOffset: 0 },
    { lat: 25.6, lng: -88.4, label: "Oct 7", hoursOffset: 48 },
    { lat: 26.5, lng: -86.2, label: "Oct 8", hoursOffset: 72 },
    { lat: 27.33, lng: -82.55, label: "Landfall", hoursOffset: 96 },
  ],
};

export const MIAMI_BEACH_RISK_ZONES = [
  {
    level: "low" as const,
    centerLat: 25.807,
    centerLng: -80.128,
    radiusMeters: 4500,
  },
  {
    level: "medium" as const,
    centerLat: 25.807,
    centerLng: -80.128,
    radiusMeters: 2800,
  },
  {
    level: "high" as const,
    centerLat: 25.807,
    centerLng: -80.128,
    radiusMeters: 1200,
  },
];

export type CoastalAssetSeed = {
  propertyName: string;
  latitude: number;
  longitude: number;
  address: string;
  propertyPhone?: string;
  searchAliases?: string[];
  excludedEmployerPatterns?: string[];
  requiredEmployerTokens?: string[];
  assetType: string;
  city: string;
  riskBreakdown: RiskBreakdownInput;
  assetValueFactor: number;
  repairComplexityFactor: number;
  riskScore: number;
  restorationDemandScore: number;
  expectedRevenue: number;
  status: "identified";
  priorityRank: number;
  buildingYear?: number;
  propertyNotes?: string;
  riskExplanation: string;
  revenueExplanation: string;
  whyAtRisk: string;
};

export const MIAMI_COASTAL_ASSETS: CoastalAssetSeed[] = [
  buildAsset({
    propertyName: "Fontainebleau Miami Beach",
    address: "4441 Collins Ave, Miami Beach, FL 33140",
    propertyPhone: "(305) 538-2000",
    searchAliases: ["Fontainebleau Miami", "Fontainebleau Resort Miami Beach"],
    latitude: 25.81762,
    longitude: -80.12234,
    assetType: "Resort Hotel",
    city: "Miami Beach",
    priorityRank: 1,
    buildingYear: 1954,
    propertyNotes: "Oceanfront Collins Avenue, large hospitality footprint",
    riskBreakdown: {
      coastalExposure: 98,
      floodZoneSeverity: 95,
      elevationRisk: 88,
      stormPathProximity: 92,
      assetVulnerability: 90,
    },
    assetValueFactor: 2.2,
    repairComplexityFactor: 1.02,
  }),
  buildAsset({
    propertyName: "Faena Hotel Miami Beach",
    address: "3201 Collins Ave, Miami Beach, FL 33140",
    propertyPhone: "(305) 534-8800",
    searchAliases: ["Faena Hotel", "Faena Miami Beach", "Faena Miami"],
    latitude: 25.80735,
    longitude: -80.12215,
    assetType: "Luxury Hotel",
    city: "Miami Beach",
    priorityRank: 2,
    buildingYear: 2015,
    propertyNotes: "Mid-Beach waterfront, luxury hospitality",
    riskBreakdown: {
      coastalExposure: 96,
      floodZoneSeverity: 92,
      elevationRisk: 86,
      stormPathProximity: 88,
      assetVulnerability: 88,
    },
    assetValueFactor: 2.0,
    repairComplexityFactor: 1.0,
  }),
  buildAsset({
    propertyName: "Loews Miami Beach Hotel",
    address: "1601 Collins Ave, Miami Beach, FL 33139",
    propertyPhone: "(305) 604-1601",
    latitude: 25.78865,
    longitude: -80.12935,
    assetType: "Hotel",
    city: "Miami Beach",
    priorityRank: 3,
    buildingYear: 1998,
    propertyNotes: "Direct beachfront, South Beach",
    riskBreakdown: {
      coastalExposure: 94,
      floodZoneSeverity: 90,
      elevationRisk: 86,
      stormPathProximity: 86,
      assetVulnerability: 76,
    },
    assetValueFactor: 1.85,
    repairComplexityFactor: 1.0,
  }),
  buildAsset({
    propertyName: "Eden Roc Miami Beach",
    address: "4525 Collins Ave, Miami Beach, FL 33140",
    propertyPhone: "(305) 531-0000",
    searchAliases: [
      "Nobu Hotel Miami Beach",
      "Nobu Eden Beach",
      "Faena District Miami Beach",
    ],
    latitude: 25.81945,
    longitude: -80.1214,
    assetType: "Hotel",
    city: "Miami Beach",
    priorityRank: 4,
    buildingYear: 1955,
    propertyNotes: "Historic oceanfront tower, Collins Avenue",
    riskBreakdown: {
      coastalExposure: 97,
      floodZoneSeverity: 88,
      elevationRisk: 87,
      stormPathProximity: 86,
      assetVulnerability: 84,
    },
    assetValueFactor: 1.8,
    repairComplexityFactor: 1.04,
  }),
  buildAsset({
    propertyName: "The Ritz-Carlton South Beach",
    address: "1 Lincoln Rd, Miami Beach, FL 33139",
    propertyPhone: "(786) 276-4000",
    searchAliases: [
      "Ritz-Carlton Miami Beach South Beach",
      "Ritz Carlton South Beach",
    ],
    excludedEmployerPatterns: ["bal harbour", "bal harbor"],
    requiredEmployerTokens: ["south"],
    latitude: 25.79068,
    longitude: -80.12925,
    assetType: "Luxury Hotel",
    city: "Miami Beach",
    priorityRank: 5,
    buildingYear: 2003,
    propertyNotes: "South Beach, Lincoln Road corridor",
    riskBreakdown: {
      coastalExposure: 88,
      floodZoneSeverity: 85,
      elevationRisk: 83,
      stormPathProximity: 80,
      assetVulnerability: 74,
    },
    assetValueFactor: 1.75,
    repairComplexityFactor: 0.98,
  }),
];

function buildAsset(
  input: Omit<
    CoastalAssetSeed,
    | "riskScore"
    | "restorationDemandScore"
    | "expectedRevenue"
    | "status"
    | "riskExplanation"
    | "revenueExplanation"
    | "whyAtRisk"
  >,
): CoastalAssetSeed {
  const intel = buildRiskIntelligence({
    propertyName: input.propertyName,
    assetType: input.assetType,
    city: input.city,
    buildingYear: input.buildingYear,
    breakdown: input.riskBreakdown,
    assetValueFactor: input.assetValueFactor,
    repairComplexityFactor: input.repairComplexityFactor,
  });

  return {
    ...input,
    status: "identified",
    riskScore: intel.riskScore,
    restorationDemandScore: Math.max(intel.riskScore - 2, 0),
    expectedRevenue: intel.expectedRevenue,
    whyAtRisk: intel.whyAtRisk,
    riskExplanation: intel.riskExplanation,
    revenueExplanation: intel.revenueExplanation,
  };
}
