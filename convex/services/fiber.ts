"use node";

import {
  formatVisitLocation,
  type PropertyContext,
} from "./propertyContext";
import { hasMapCoordinates } from "./propertyContext";

const FIBER_BASE_URL = "https://api.fiber.ai";
const MIN_MATCH_CONFIDENCE = 0.35;
const PROPERTY_SEARCH_RADIUS_MILES = 2;
const CITY_SEARCH_RADIUS_MILES = 6;
const PEOPLE_PAGE_SIZE = 12;

const STOP_WORDS = new Set([
  "miami",
  "hotel",
  "hotels",
  "the",
  "luxury",
  "resort",
  "and",
  "at",
  "of",
]);

/** Location tokens that distinguish sibling properties (e.g. South Beach vs Bal Harbour). */
const LOCATION_MARKERS = new Set([
  "south",
  "north",
  "mid",
  "bal",
  "harbour",
  "harbor",
  "beach",
  "downtown",
  "coconut",
  "grove",
  "brickell",
  "key",
  "biscayne",
]);

export type DiscoveryInput = PropertyContext;

export type DiscoveryResult = {
  propertyName: string;
  company: string;
  matchedCompany: string;
  matchConfidence: number;
  verified: boolean;
  contactName: string;
  contactTitle: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  searchCenterLat?: number;
  searchCenterLng?: number;
  source: "fiber";
};

export type DiscoveryProgressStep =
  | "searching_companies"
  | "searching_people"
  | "validating"
  | "complete";

export type DiscoveryProgressReporter = (
  step: DiscoveryProgressStep,
  message: string,
  meta?: Record<string, unknown>,
) => Promise<void>;

export type DiscoverOptions = {
  revealContact?: boolean;
  onProgress?: DiscoveryProgressReporter;
};

export type DiscoveryOutcome =
  | { status: "found"; result: DiscoveryResult }
  | {
      status: "unavailable";
      propertyName: string;
      city: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      message: string;
      visitLocation: string;
      bestCandidate?: string;
      bestConfidence?: number;
    };

type FiberPerson = {
  first_name?: string | null;
  last_name?: string | null;
  primary_slug?: string | null;
  url?: string | null;
  current_job?: {
    company_name?: string | null;
    title?: string | null;
  } | null;
};

type FiberCompany = {
  preferred_name?: string | null;
  name?: string | null;
  linkedin_slug?: string | null;
};

type PeopleSearchResponse = {
  output?: {
    data?: FiberPerson[];
  };
};

type CompanySearchResponse = {
  output?: {
    data?: FiberCompany[];
  };
};

type ContactRevealResponse = {
  output?: {
    profile?: {
      emails?: Array<{ email: string; type: string }>;
      phoneNumbers?: Array<{ number: string; type: string }>;
    };
  };
};

const PRIORITY_TITLES = [
  "general manager",
  "director of operations",
  "facilities manager",
  "property manager",
  "operations director",
  "director of engineering",
  "chief engineer",
];

function getApiKey(): string {
  const apiKey = process.env.FIBER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "FIBER_API_KEY is not configured. Add it to the project root .env.local or run: npx convex env set FIBER_API_KEY <your-key>",
    );
  }
  return apiKey;
}

async function fiberPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${FIBER_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fiber API error (${response.status}): ${errorText}`);
  }

  return (await response.json()) as T;
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function significantTokens(value: string): string[] {
  const tokens = tokenize(value);
  const meaningful = tokens.filter(
    (token) => token.length > 2 && !STOP_WORDS.has(token),
  );
  return meaningful.length > 0 ? meaningful : tokens.slice(0, 3);
}

function locationMarkers(value: string): string[] {
  return tokenize(value).filter((token) => LOCATION_MARKERS.has(token));
}

function locationConflictPenalty(propertyName: string, employer: string): number {
  const propertyMarkers = locationMarkers(propertyName);
  const employerMarkers = locationMarkers(employer);

  // Brand-only employer names (e.g. "Fontainebleau", "Faena Hotel") — no location penalty.
  if (employerMarkers.length === 0) return 0;
  if (propertyMarkers.length === 0) return 0;

  let penalty = 0;
  for (const marker of employerMarkers) {
    if (!propertyMarkers.includes(marker)) {
      penalty += 0.4;
    }
  }

  return Math.min(0.75, penalty);
}

function isExcludedEmployer(employer: string, input: PropertyContext): boolean {
  const patterns = input.excludedEmployerPatterns ?? [];
  const lower = employer.toLowerCase();
  return patterns.some((pattern) => lower.includes(pattern.toLowerCase()));
}

function bestPropertyMatchScore(
  employer: string,
  input: PropertyContext,
): number {
  return Math.max(
    ...searchNames(input).map((name) => companyNameSimilarity(employer, name)),
  );
}

function passesEmployerGuard(
  employer: string,
  input: PropertyContext,
  companyHint?: string,
): boolean {
  if (isExcludedEmployer(employer, input)) return false;

  const required = input.requiredEmployerTokens ?? [];
  if (required.length === 0) return true;

  const employerLower = employer.toLowerCase();
  if (required.some((token) => employerLower.includes(token))) return true;

  if (companyHint) {
    return (
      companyNameSimilarity(employer, companyHint) >= MIN_MATCH_CONFIDENCE &&
      companyNameSimilarity(companyHint, input.propertyName) >=
        MIN_MATCH_CONFIDENCE
    );
  }

  return false;
}

export function companyNameSimilarity(a: string, b: string): number {
  const tokensA = new Set(significantTokens(a));
  const tokensB = new Set(significantTokens(b));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let overlap = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) overlap += 1;
  }

  const union = new Set([...tokensA, ...tokensB]).size;
  const jaccard = overlap / union;

  const normalizedA = a.toLowerCase();
  const normalizedB = b.toLowerCase();
  const containsBonus =
    normalizedA.includes(normalizedB) || normalizedB.includes(normalizedA)
      ? 0.2
      : 0;

  const conflictPenalty = locationConflictPenalty(a, b);
  return Math.max(0, Math.min(1, jaccard + containsBonus - conflictPenalty));
}

function searchNames(input: PropertyContext): string[] {
  const names = [input.propertyName, ...(input.searchAliases ?? [])];
  return [...new Set(names.map((name) => name.trim()).filter(Boolean))];
}

function buildLocationFilter(input: PropertyContext) {
  if (hasMapCoordinates(input)) {
    return {
      unionAll: [
        {
          strategy: "radial-distance",
          center: {
            latitude: input.latitude,
            longitude: input.longitude,
            name: input.propertyName,
          },
          radius: {
            unit: "miles",
            quantity: PROPERTY_SEARCH_RADIUS_MILES,
          },
        },
      ],
    };
  }

  return {
    unionAll: [
      {
        strategy: "free-form-city",
        city: input.city,
        countryCode: "USA",
        radius: { unit: "miles", quantity: CITY_SEARCH_RADIUS_MILES },
      },
    ],
  };
}

function jobTitleFilter() {
  return {
    anyOf: [
      { type: "term", term: "General Manager" },
      { type: "term", term: "Property Manager" },
      { type: "term", term: "Director of Operations" },
      { type: "term", term: "Facilities Manager" },
      { type: "term", term: "Director of Engineering" },
      {
        type: "dynamic-groups",
        groups: ["director", "management"],
        keywords: ["property", "facilities", "operations", "hotel"],
      },
    ],
  };
}

function propertyKeywordFilter(propertyName: string, companyHint?: string) {
  const propertyTokens = significantTokens(propertyName);
  const clauses: Array<{ operator?: string; terms: string[] }> = [
    {
      operator: "OR",
      terms: propertyTokens.length > 0 ? propertyTokens : [propertyName],
    },
  ];

  if (companyHint) {
    clauses.push({
      operator: "OR",
      terms: significantTokens(companyHint),
    });
  }

  return {
    operator: "AND",
    clauses,
    options: {
      fieldsToSearchOver: {
        currentCompanyNames: true,
        currentJobTitles: true,
        headline: true,
        summary: true,
      },
    },
  };
}

function scorePerson(
  person: FiberPerson,
  input: PropertyContext,
  companyHint?: string,
) {
  const company = person.current_job?.company_name ?? "";
  if (isExcludedEmployer(company, input)) return -1;

  const title = person.current_job?.title?.toLowerCase() ?? "";
  const companyScore = companyHint
    ? companyNameSimilarity(company, companyHint)
    : bestPropertyMatchScore(company, input);
  const titleBoost = PRIORITY_TITLES.findIndex((priority) =>
    title.includes(priority),
  );
  const titleScore =
    titleBoost === -1
      ? 0
      : (PRIORITY_TITLES.length - titleBoost) / PRIORITY_TITLES.length;

  return companyScore * 0.75 + titleScore * 0.25;
}

function pickBestPerson(
  people: FiberPerson[],
  input: PropertyContext,
  companyHint?: string,
): FiberPerson | null {
  const eligible = people.filter((person) => {
    const company = person.current_job?.company_name ?? "";
    return !isExcludedEmployer(company, input);
  });

  if (eligible.length === 0) return null;

  return [...eligible].sort(
    (a, b) =>
      scorePerson(b, input, companyHint) - scorePerson(a, input, companyHint),
  )[0];
}

function companyDisplayName(company: FiberCompany): string {
  return company.preferred_name ?? company.name ?? "";
}

function unavailableOutcome(
  input: PropertyContext,
  message: string,
  bestCandidate?: string,
  bestConfidence?: number,
): DiscoveryOutcome {
  return {
    status: "unavailable",
    propertyName: input.propertyName,
    city: input.city,
    address: input.address,
    latitude: input.latitude,
    longitude: input.longitude,
    message,
    visitLocation: formatVisitLocation(input),
    bestCandidate,
    bestConfidence,
  };
}

/**
 * FiberService — property-anchored contact discovery.
 * @see https://api.fiber.ai/ai-docs/peopleSearch.md
 * @see https://api.fiber.ai/ai-docs/companySearch.md
 */
export class FiberService {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async searchCompaniesForName(
    input: PropertyContext,
    searchName: string,
  ): Promise<FiberCompany[]> {
    const response = await fiberPost<CompanySearchResponse>(
      "/v1/company-search",
      {
        apiKey: this.apiKey,
        pageSize: 5,
        searchParams: {
          country3LetterCode: { anyOf: ["USA"] },
          keywordsV2: {
            operator: "AND",
            clauses: [
              {
                terms: significantTokens(searchName),
              },
            ],
            options: {
              fieldsToSearchOver: {
                name: true,
                description: true,
              },
            },
          },
          location: buildLocationFilter(input),
        },
      },
    );

    return response.output?.data ?? [];
  }

  private async searchCompanies(input: PropertyContext): Promise<FiberCompany[]> {
    const names = searchNames(input);
    const bySlug = new Map<string, FiberCompany>();

    for (const name of names) {
      try {
        const companies = await this.searchCompaniesForName(input, name);
        for (const company of companies) {
          const key =
            company.linkedin_slug ??
            companyDisplayName(company).toLowerCase();
          if (key && !bySlug.has(key)) {
            bySlug.set(key, company);
          }
        }
      } catch (error) {
        console.warn(
          `[FiberService] company-search failed for "${name}":`,
          error instanceof Error ? error.message : error,
        );
      }
    }

    return [...bySlug.values()];
  }

  private async searchPeople(
    input: PropertyContext,
    searchName: string,
    companyHint?: string,
  ): Promise<FiberPerson[]> {
    const response = await fiberPost<PeopleSearchResponse>("/v1/people-search", {
      apiKey: this.apiKey,
      pageSize: PEOPLE_PAGE_SIZE,
      searchParams: {
        country3LetterCode: { anyOf: ["USA"] },
        jobTitleV2: jobTitleFilter(),
        keywordsV2: propertyKeywordFilter(searchName, companyHint),
        location: buildLocationFilter(input),
      },
    });

    return response.output?.data ?? [];
  }

  private async revealContact(linkedinUrl?: string, linkedinSlug?: string | null) {
    if (!linkedinUrl && !linkedinSlug) {
      return { email: undefined, phone: undefined };
    }

    const revealResponse = await fiberPost<ContactRevealResponse>(
      "/v1/contact-details/single",
      {
        apiKey: this.apiKey,
        linkedinUrl: linkedinUrl ?? linkedinSlug,
        enrichmentType: {
          getWorkEmails: true,
          getPersonalEmails: false,
          getPhoneNumbers: true,
        },
      },
    );

    const profile = revealResponse.output?.profile;
    return {
      email:
        profile?.emails?.find((entry) => entry.type === "work")?.email ??
        profile?.emails?.[0]?.email,
      phone: profile?.phoneNumbers?.[0]?.number,
    };
  }

  async revealContactDetails(linkedinUrl: string) {
    return this.revealContact(linkedinUrl);
  }

  async discoverDecisionMaker(
    input: PropertyContext,
    options: DiscoverOptions = {},
  ): Promise<DiscoveryOutcome> {
    const { revealContact = false, onProgress } = options;
    const searchCenterLat = input.latitude;
    const searchCenterLng = input.longitude;
    const names = searchNames(input);

    await onProgress?.(
      "searching_companies",
      `Searching operators near ${input.propertyName}…`,
    );

    const companies = await this.searchCompanies(input);
    const rankedCompanies = companies
      .map((company) => ({
        company,
        score: Math.max(
          ...searchNames(input).map((name) =>
            companyNameSimilarity(companyDisplayName(company), name),
          ),
        ),
      }))
      .sort((a, b) => b.score - a.score);

    const bestCompany = rankedCompanies[0];
    const companyHint =
      bestCompany && bestCompany.score >= MIN_MATCH_CONFIDENCE
        ? companyDisplayName(bestCompany.company)
        : undefined;

    await onProgress?.(
      "searching_people",
      companyHint
        ? `Found ${companyHint} — searching decision makers…`
        : `Searching decision makers near map pin…`,
    );

    let people: FiberPerson[] = [];
    for (const name of names) {
      const batch = await this.searchPeople(input, name, companyHint);
      people = people.concat(batch);
      if (people.length >= 8) break;
    }

    const person = pickBestPerson(people, input, companyHint);

    if (!person) {
      return unavailableOutcome(
        input,
        `No operator contacts found near this property. Visit on-site: ${formatVisitLocation(input)}`,
      );
    }

    await onProgress?.("validating", "Verifying employer match…");

    const employer =
      person.current_job?.company_name ?? companyHint ?? input.propertyName;

    if (!passesEmployerGuard(employer, input, companyHint)) {
      return unavailableOutcome(
        input,
        `No verified operator contact for this property. Best match "${employer}" is a sibling property or failed location check. Visit on-site: ${formatVisitLocation(input)}`,
        employer,
        bestPropertyMatchScore(employer, input),
      );
    }

    const matchConfidence = bestPropertyMatchScore(employer, input);
    const verified = matchConfidence >= MIN_MATCH_CONFIDENCE;

    if (!verified) {
      return unavailableOutcome(
        input,
        `No verified operator contact for this property. Best match "${employer}" scored ${(matchConfidence * 100).toFixed(0)}%. Visit on-site: ${formatVisitLocation(input)}`,
        employer,
        matchConfidence,
      );
    }

    const linkedinSlug = person.primary_slug;
    const linkedinUrl =
      person.url ??
      (linkedinSlug
        ? `https://www.linkedin.com/in/${linkedinSlug}`
        : undefined);

    let email: string | undefined;
    let phone: string | undefined;

    if (revealContact) {
      const revealed = await this.revealContact(linkedinUrl, linkedinSlug);
      email = revealed.email;
      phone = revealed.phone;
    }

    const contactName = [person.first_name, person.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (!contactName) {
      return unavailableOutcome(
        input,
        `Fiber returned an incomplete profile for this property. Visit on-site: ${formatVisitLocation(input)}`,
        employer,
        matchConfidence,
      );
    }

    await onProgress?.("complete", `Verified contact: ${contactName}`);

    return {
      status: "found",
      result: {
        propertyName: input.propertyName,
        company: employer,
        matchedCompany: employer,
        matchConfidence,
        verified,
        contactName,
        contactTitle: person.current_job?.title ?? "General Manager",
        email,
        phone,
        linkedinUrl,
        searchCenterLat,
        searchCenterLng,
        source: "fiber",
      },
    };
  }
}

export function createFiberService(): FiberService {
  return new FiberService(getApiKey());
}

export async function revealContactDetails(linkedinUrl?: string): Promise<{
  email?: string;
  phone?: string;
}> {
  if (!linkedinUrl) {
    return { email: undefined, phone: undefined };
  }

  const service = createFiberService();
  return service.revealContactDetails(linkedinUrl);
}

export async function discoverDecisionMaker(
  input: PropertyContext,
  options?: DiscoverOptions,
): Promise<DiscoveryOutcome> {
  const service = createFiberService();
  return service.discoverDecisionMaker(input, options);
}

/** @deprecated Use discoverDecisionMaker — throws when contact is unavailable */
export async function findDecisionMaker(
  input: PropertyContext,
): Promise<DiscoveryResult> {
  const outcome = await discoverDecisionMaker(input, { revealContact: true });
  if (outcome.status === "unavailable") {
    throw new Error(outcome.message);
  }
  return outcome.result;
}
