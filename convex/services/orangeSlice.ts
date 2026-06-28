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
 * Orange Slice property enrichment — replace stub with real API calls.
 */
export async function enrichProperty(
  input: PropertyEnrichmentInput,
): Promise<PropertyEnrichmentResult> {
  // TODO: Integrate Orange Slice API
  return {
    buildingYear: 1974,
    propertyType: "Commercial Multi-Family",
    floodZone: "AE",
    notes: ["Near coastline", "High wind exposure"],
    source: "orange_slice_stub",
  };
}

export type OutreachInput = {
  propertyName: string;
  contactName: string;
  contactTitle: string;
  company: string;
  stormName: string;
  riskScore: number;
  expectedRevenue: number;
};

export type OutreachResult = {
  status: "waiting" | "generating" | "ready";
  emailDraft?: string;
  recommendation?: string;
  source: "orange_slice_stub" | "orange_slice";
};

/**
 * Orange Slice outreach interface — connect when implementing Generate Outreach.
 */
export async function prepareOutreach(
  _input: OutreachInput,
): Promise<OutreachResult> {
  // TODO: Integrate Orange Slice API for outreach generation
  return {
    status: "waiting",
    source: "orange_slice_stub",
  };
}
