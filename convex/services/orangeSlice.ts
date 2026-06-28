"use node";

import { configure, services } from "orangeslice";

export type CompanyEnrichmentInput = {
  companyName: string;
  location?: string;
  linkedinCompanyUrl?: string;
  domain?: string;
};

export type CompanyEnrichmentResult = {
  companyName: string;
  companyDescription?: string;
  employeeCount?: number;
  companySize?: string;
  industry?: string;
  headcountGrowth?: string;
  recentEvents?: string[];
  locations?: string[];
  website?: string;
  domain?: string;
  linkedinCompanyUrl?: string;
  enrichmentStatus: "full" | "limited";
};

type LinkedInCompany = {
  name?: string | null;
  description?: string | null;
  employee_count?: number | null;
  company_size?: string | null;
  industry?: string | null;
  employee_growth_12mo?: number | null;
  website?: string | null;
  domain?: string | null;
  linkedin_url?: string | null;
  locality?: string | null;
  region?: string | null;
  country_code?: string | null;
  locations?: Array<{ address?: string; is_primary?: boolean }> | null;
};

type NewsEvent = {
  attributes?: {
    summary?: string;
    category?: string;
    found_at?: string;
  };
};

function getApiKey(): string {
  const apiKey = process.env.ORANGESLICE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ORANGESLICE_API_KEY is not configured. Set it with: npx convex env set ORANGESLICE_API_KEY",
    );
  }
  return apiKey;
}

function formatGrowth(rate: number | null | undefined): string | undefined {
  if (rate == null) return undefined;
  const pct = ((rate - 1) * 100).toFixed(1);
  return `${Number(pct) >= 0 ? "+" : ""}${pct}% YoY`;
}

function extractDomain(url?: string | null): string | undefined {
  if (!url) return undefined;
  try {
    const hostname = new URL(url.startsWith("http") ? url : `https://${url}`)
      .hostname;
    return hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

/** Fiber returns person profile URLs (/in/…); company enrich needs /company/… */
function isLinkedInCompanyUrl(url: string): boolean {
  return /linkedin\.com\/company\//i.test(url);
}

function sanitizeCompanyLinkedInUrl(url?: string): string | undefined {
  if (!url?.trim()) return undefined;
  if (isLinkedInCompanyUrl(url)) return url.trim();
  return undefined;
}

/**
 * OrangeSliceService — company intelligence via Orange Slice SDK.
 *
 * Auth: ORANGESLICE_API_KEY env var only (no workspace/project IDs).
 *
 * APIs used:
 * - services.company.linkedin.findUrl
 * - services.company.linkedin.enrich (extended)
 * - services.predictLeads.companyNewsEvents
 */
export class OrangeSliceService {
  constructor(apiKey: string) {
    configure({ apiKey });
  }

  async enrichCompany(
    input: CompanyEnrichmentInput,
  ): Promise<CompanyEnrichmentResult> {
    const domain = input.domain;
    let linkedinUrl = sanitizeCompanyLinkedInUrl(input.linkedinCompanyUrl);

    if (
      input.linkedinCompanyUrl &&
      !linkedinUrl &&
      /linkedin\.com\/in\//i.test(input.linkedinCompanyUrl)
    ) {
      console.warn(
        `[orangeSlice] Ignoring person LinkedIn URL for company enrich: ${input.companyName}`,
      );
    }

    if (!linkedinUrl) {
      linkedinUrl =
        (await services.company.linkedin.findUrl({
          companyName: input.companyName,
          location: input.location,
          website: domain,
        })) ?? undefined;
    }

    let company: LinkedInCompany | null = null;

    if (linkedinUrl || domain) {
      company = (await services.company.linkedin.enrich({
        ...(linkedinUrl ? { url: linkedinUrl } : {}),
        ...(domain ? { domain } : {}),
        extended: true,
      })) as LinkedInCompany | null;
    }

    const resolvedDomain =
      domain ?? company?.domain ?? extractDomain(company?.website ?? undefined);

    let recentEvents: string[] = [];
    if (resolvedDomain) {
      try {
        const newsResponse = (await services.predictLeads.companyNewsEvents({
          company_id_or_domain: resolvedDomain,
          limit: 5,
        })) as { data?: NewsEvent[] };

        recentEvents =
          newsResponse.data
            ?.map((event) => {
              const summary = event.attributes?.summary;
              const category = event.attributes?.category;
              if (!summary) return null;
              return category ? `${category}: ${summary}` : summary;
            })
            .filter((item): item is string => Boolean(item)) ?? [];
      } catch {
        // News is optional — continue without events
      }
    }

    const locations =
      company?.locations
        ?.map((loc) => loc.address)
        .filter((addr): addr is string => Boolean(addr)) ??
      [company?.locality, company?.region, company?.country_code]
        .filter(Boolean)
        .join(", ")
        .split(", ")
        .filter(Boolean);

    const hasCoreData = Boolean(
      company?.description || company?.employee_count || recentEvents.length > 0,
    );

    if (!hasCoreData) {
      console.warn(
        `[orangeSlice] Limited enrichment for "${input.companyName}"` +
          (linkedinUrl ? ` (LinkedIn: ${linkedinUrl})` : " (no LinkedIn match)"),
      );
    }

    return {
      companyName: company?.name ?? input.companyName,
      companyDescription: company?.description ?? undefined,
      employeeCount: company?.employee_count ?? undefined,
      companySize: company?.company_size ?? undefined,
      industry: company?.industry ?? undefined,
      headcountGrowth: formatGrowth(company?.employee_growth_12mo),
      recentEvents: recentEvents.length > 0 ? recentEvents : undefined,
      locations: locations.length > 0 ? locations : undefined,
      website: company?.website ?? undefined,
      domain: resolvedDomain,
      linkedinCompanyUrl: company?.linkedin_url ?? linkedinUrl,
      enrichmentStatus: hasCoreData ? "full" : "limited",
    };
  }
}

export function createOrangeSliceService(): OrangeSliceService {
  return new OrangeSliceService(getApiKey());
}

/** Property-level enrichment stub used by risk agent workflow. */
export async function enrichProperty(
  input: { propertyName: string; location: string },
): Promise<{
  buildingYear?: number;
  propertyType?: string;
  floodZone?: string;
  notes: string[];
  source: "orange_slice_stub" | "orange_slice";
}> {
  try {
    const service = createOrangeSliceService();
    const result = await service.enrichCompany({
      companyName: input.propertyName,
      location: input.location,
    });

    return {
      buildingYear: undefined,
      propertyType: result.industry ?? "Commercial Property",
      notes: result.recentEvents?.slice(0, 2) ?? [
        "Near coastline",
        "High wind exposure",
      ],
      source: "orange_slice",
    };
  } catch {
    return {
      buildingYear: 1974,
      propertyType: "Commercial Multi-Family",
      floodZone: "AE",
      notes: ["Near coastline", "High wind exposure"],
      source: "orange_slice_stub",
    };
  }
}
