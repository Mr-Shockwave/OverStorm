import type { Doc } from "../_generated/dataModel";

/** Canonical property identity shared by map, Fiber, and enrichment. */
export type PropertyContext = {
  propertyName: string;
  assetType?: string;
  city: string;
  address?: string;
  propertyPhone?: string;
  searchAliases?: string[];
  excludedEmployerPatterns?: string[];
  requiredEmployerTokens?: string[];
  latitude?: number;
  longitude?: number;
  stormName: string;
  historicalLandfall?: string;
};

export function buildPropertyContext(
  opportunity: Doc<"opportunities">,
  storm: Doc<"storms">,
): PropertyContext {
  return {
    propertyName: opportunity.propertyName,
    assetType: opportunity.assetType,
    city: opportunity.city ?? "Miami Beach",
    address: opportunity.address,
    propertyPhone: opportunity.propertyPhone,
    searchAliases: opportunity.searchAliases,
    excludedEmployerPatterns: opportunity.excludedEmployerPatterns,
    requiredEmployerTokens: opportunity.requiredEmployerTokens,
    latitude: opportunity.latitude,
    longitude: opportunity.longitude,
    stormName: storm.name,
    historicalLandfall: storm.historicalLandfall,
  };
}

export function hasMapCoordinates(
  context: PropertyContext,
): context is PropertyContext & { latitude: number; longitude: number } {
  return context.latitude !== undefined && context.longitude !== undefined;
}

export function formatVisitLocation(context: PropertyContext): string {
  if (context.address) {
    return context.address;
  }
  if (hasMapCoordinates(context)) {
    return `${context.propertyName}, ${context.city} (${context.latitude.toFixed(4)}, ${context.longitude.toFixed(4)})`;
  }
  return `${context.propertyName}, ${context.city}`;
}
