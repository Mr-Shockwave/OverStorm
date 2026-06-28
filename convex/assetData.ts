/**
 * Miami coastal hospitality assets — coordinates aligned to Google Maps place pins.
 * Addresses sourced from public listing / Maps data (Collins Ave, Lincoln Rd).
 */

import type { RiskBreakdownInput } from "./services/riskIntelligence";
import { buildRiskIntelligence } from "./services/riskIntelligence";

export const MIAMI_BEACH_CENTER = {
  lat: 24.8,
  lng: -82.0,
  zoom: 7,
};

/** Hurricane Wilma (2005) — static historical replay. Caribbean → Yucatán → Gulf → South Florida transect. */
export const HURRICANE_WILMA_HISTORICAL = {
  name: "Hurricane Wilma",
  location: "Caribbean → Yucatán → Gulf → South Florida",
  category: "Category 3 at Landfall",
  peakCategory: "Category 5",
  historicalLandfall: "Cape Romano, Florida — October 24, 2005",
  landfallWindSpeedMph: 120,
  peakWindSpeedMph: 185,
  isHistoricalReplay: true,
  riskScore: 91,
  expectedRevenueImpact: 1_200_000,
  hoursUntilLandfall: 0,
  timeline: [
    {
      label: "Oct 18",
      description:
        "Tropical depression forms in the northwestern Caribbean Sea.",
    },
    {
      label: "Oct 19",
      description:
        "Explosive intensification — Category 5 with 185 mph winds in the Caribbean.",
    },
    {
      label: "Oct 21",
      description:
        "Major hurricane landfall on Cozumel and the Yucatán Peninsula.",
    },
    {
      label: "Oct 22",
      description:
        "Weakens over Yucatán, then re-emerges into the Gulf of Mexico.",
    },
    {
      label: "Oct 23",
      description:
        "Re-intensifies in the Gulf and accelerates toward southwest Florida.",
    },
    {
      label: "Oct 24 AM",
      description:
        "Category 3 landfall near Cape Romano with 120 mph sustained winds.",
    },
    {
      label: "Oct 24 PM",
      description:
        "Eye crosses Miami-Dade at ~25 mph — Collins Ave corridor in the core wind field.",
    },
  ],
  stormTrack: [
    { lat: 17.8, lng: -78.5, label: "Oct 18", hoursOffset: 0 },
    { lat: 19.2, lng: -82.0, hoursOffset: 18 },
    { lat: 19.8, lng: -84.5, label: "Oct 19", hoursOffset: 36 },
    { lat: 20.5, lng: -87.0, label: "Oct 21", hoursOffset: 72 },
    { lat: 21.8, lng: -88.5, hoursOffset: 84 },
    { lat: 23.5, lng: -86.0, label: "Oct 23", hoursOffset: 108 },
    { lat: 25.0, lng: -83.5, hoursOffset: 120 },
    { lat: 25.92, lng: -81.75, label: "Landfall", hoursOffset: 132 },
    { lat: 25.78, lng: -80.35, label: "Miami", hoursOffset: 138 },
    { lat: 26.93, lng: -80.08, label: "Exit", hoursOffset: 144 },
  ],
};

type RiskZoneLevel = "high" | "medium" | "low";

function wilmaIntensityEnvelope(
  centerLat: number,
  centerLng: number,
  radii: { low: number; medium: number; high: number },
): Array<{
  level: RiskZoneLevel;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
}> {
  return [
    { level: "low", centerLat, centerLng, radiusMeters: radii.low },
    { level: "medium", centerLat, centerLng, radiusMeters: radii.medium },
    { level: "high", centerLat, centerLng, radiusMeters: radii.high },
  ];
}

/** Wind-field risk bands centered on Wilma's position at key track points. */
export const WILMA_RISK_ZONES = [
  ...wilmaIntensityEnvelope(19.8, -84.5, {
    low: 180_000,
    medium: 110_000,
    high: 55_000,
  }),
  ...wilmaIntensityEnvelope(20.5, -87.0, {
    low: 140_000,
    medium: 85_000,
    high: 40_000,
  }),
  ...wilmaIntensityEnvelope(23.5, -86.0, {
    low: 110_000,
    medium: 65_000,
    high: 32_000,
  }),
  ...wilmaIntensityEnvelope(25.92, -81.75, {
    low: 95_000,
    medium: 55_000,
    high: 28_000,
  }),
  ...wilmaIntensityEnvelope(25.78, -80.35, {
    low: 75_000,
    medium: 42_000,
    high: 20_000,
  }),
  ...wilmaIntensityEnvelope(26.93, -80.08, {
    low: 60_000,
    medium: 35_000,
    high: 15_000,
  }),
];

/** @deprecated Use WILMA_RISK_ZONES */
export const MIAMI_BEACH_RISK_ZONES = WILMA_RISK_ZONES;

/** @deprecated Use HURRICANE_WILMA_HISTORICAL */
export const HURRICANE_MILTON_HISTORICAL = HURRICANE_WILMA_HISTORICAL;

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
  buildAsset({
    propertyName: "W South Beach",
    address: "2201 Collins Ave, Miami Beach, FL 33139",
    propertyPhone: "(305) 531-2222",
    searchAliases: ["W Hotel South Beach", "W Miami Beach"],
    latitude: 25.7955,
    longitude: -80.129,
    assetType: "Luxury Hotel",
    city: "Miami Beach",
    priorityRank: 6,
    buildingYear: 2008,
    propertyNotes: "South Beach oceanfront, boutique luxury tower",
    riskBreakdown: {
      coastalExposure: 93,
      floodZoneSeverity: 89,
      elevationRisk: 85,
      stormPathProximity: 84,
      assetVulnerability: 78,
    },
    assetValueFactor: 1.9,
    repairComplexityFactor: 1.0,
  }),
  buildAsset({
    propertyName: "Carillon Miami Wellness Resort",
    address: "6801 Collins Ave, Miami Beach, FL 33141",
    propertyPhone: "(305) 514-7000",
    searchAliases: ["Carillon Hotel Miami", "Carillon Wellness Resort"],
    latitude: 25.858,
    longitude: -80.1202,
    assetType: "Wellness Resort",
    city: "Miami Beach",
    priorityRank: 7,
    buildingYear: 2008,
    propertyNotes: "North Beach oceanfront wellness resort complex",
    riskBreakdown: {
      coastalExposure: 95,
      floodZoneSeverity: 91,
      elevationRisk: 87,
      stormPathProximity: 85,
      assetVulnerability: 82,
    },
    assetValueFactor: 2.0,
    repairComplexityFactor: 1.02,
  }),
  buildAsset({
    propertyName: "St. Regis Bal Harbour",
    address: "9703 Collins Ave, Bal Harbour, FL 33154",
    propertyPhone: "(305) 993-3300",
    searchAliases: ["St Regis Bal Harbour", "St. Regis Miami"],
    latitude: 25.8892,
    longitude: -80.1255,
    assetType: "Luxury Hotel",
    city: "Bal Harbour",
    priorityRank: 8,
    buildingYear: 2011,
    propertyNotes: "Bal Harbour oceanfront luxury resort",
    riskBreakdown: {
      coastalExposure: 94,
      floodZoneSeverity: 90,
      elevationRisk: 86,
      stormPathProximity: 83,
      assetVulnerability: 80,
    },
    assetValueFactor: 2.1,
    repairComplexityFactor: 1.0,
  }),
  buildAsset({
    propertyName: "Four Seasons Hotel at The Surf Club",
    address: "9001 Collins Ave, Surfside, FL 33154",
    propertyPhone: "(305) 603-6900",
    searchAliases: ["Four Seasons Surfside", "Surf Club Four Seasons"],
    latitude: 25.8791,
    longitude: -80.1212,
    assetType: "Resort Hotel",
    city: "Surfside",
    priorityRank: 9,
    buildingYear: 2017,
    propertyNotes: "Surfside oceanfront historic surf club resort",
    riskBreakdown: {
      coastalExposure: 96,
      floodZoneSeverity: 92,
      elevationRisk: 88,
      stormPathProximity: 84,
      assetVulnerability: 79,
    },
    assetValueFactor: 2.15,
    repairComplexityFactor: 0.98,
  }),
  buildAsset({
    propertyName: "Acqualina Resort & Residences",
    address: "17875 Collins Ave, Sunny Isles Beach, FL 33160",
    propertyPhone: "(305) 918-8000",
    searchAliases: ["Acqualina Resort", "Acqualina Sunny Isles"],
    latitude: 25.942,
    longitude: -80.1205,
    assetType: "Resort Hotel",
    city: "Sunny Isles Beach",
    priorityRank: 10,
    buildingYear: 2006,
    propertyNotes: "Sunny Isles oceanfront luxury resort towers",
    riskBreakdown: {
      coastalExposure: 97,
      floodZoneSeverity: 93,
      elevationRisk: 89,
      stormPathProximity: 86,
      assetVulnerability: 81,
    },
    assetValueFactor: 2.05,
    repairComplexityFactor: 1.01,
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
