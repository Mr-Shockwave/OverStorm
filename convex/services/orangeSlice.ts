export type PropertyEnrichmentInput = {
  propertyName: string;
  location: string;
};

export type PropertyEnrichmentResult = {
  buildingYear?: number;
  squareFootage?: number;
  propertyType?: string;
  floodZone?: string;
  notes: string[];
  source: "orange_slice_stub" | "orange_slice";
};

/**
 * Orange Slice integration point — replace stub with real property enrichment.
 */
export async function enrichProperty(
  input: PropertyEnrichmentInput,
): Promise<PropertyEnrichmentResult> {
  // TODO: Integrate Orange Slice API
  // const response = await fetch("https://api.orangeslice.ai/v1/properties/enrich", { ... });

  return {
    buildingYear: 1974,
    propertyType: "Commercial Multi-Family",
    floodZone: "AE",
    notes: ["Near coastline", "High wind exposure"],
    source: "orange_slice_stub",
  };
}
