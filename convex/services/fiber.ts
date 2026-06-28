"use node";

const FIBER_BASE_URL = "https://api.fiber.ai";

export type DiscoveryInput = {
  propertyName: string;
  location: string;
};

export type DiscoveryResult = {
  company: string;
  contactName: string;
  contactTitle: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  source: "fiber";
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

type PeopleSearchResponse = {
  output?: {
    data?: FiberPerson[];
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

function getApiKey(): string {
  // Convex actions read deployment env vars (set via root .env.local or `npx convex env set`).
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

function parseCity(location: string): string {
  return location.split(",")[0]?.trim() || location;
}

function pickBestPerson(people: FiberPerson[]): FiberPerson | null {
  const priorityTitles = [
    "director of operations",
    "facilities manager",
    "property manager",
    "operations director",
    "general manager",
  ];

  for (const title of priorityTitles) {
    const match = people.find((person) =>
      person.current_job?.title?.toLowerCase().includes(title),
    );
    if (match) return match;
  }

  return people[0] ?? null;
}

/**
 * FiberService — abstraction layer for Fiber AI contact discovery.
 * @see https://api.fiber.ai/ai-docs/peopleSearch.md
 * @see https://api.fiber.ai/ai-docs/syncQuickContactReveal.md
 */
export class FiberService {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async discoverDecisionMaker(input: DiscoveryInput): Promise<DiscoveryResult> {
    const city = parseCity(input.location);

    const peopleResponse = await fiberPost<PeopleSearchResponse>(
      "/v1/people-search",
      {
        apiKey: this.apiKey,
        pageSize: 10,
        searchParams: {
          country3LetterCode: { anyOf: ["USA"] },
          jobTitleV2: {
            anyOf: [
              { type: "term", term: "Property Manager" },
              { type: "term", term: "Director of Operations" },
              { type: "term", term: "Facilities Manager" },
              { type: "term", term: "Operations Director" },
              {
                type: "dynamic-groups",
                groups: ["director", "management"],
                keywords: ["property", "facilities", "operations"],
              },
            ],
          },
          keywordsV2: {
            operator: "OR",
            clauses: [
              {
                terms: [input.propertyName, "property management", city],
              },
            ],
            options: {
              fieldsToSearchOver: {
                currentCompanyNames: true,
                currentJobTitles: true,
                headline: true,
                summary: true,
              },
            },
          },
          location: {
            unionAll: [
              {
                strategy: "free-form-city",
                city,
                countryCode: "USA",
                radius: { unit: "miles", quantity: 25 },
              },
              {
                strategy: "preset-region",
                region: "miami-south-florida",
              },
            ],
          },
        },
      },
    );

    const people = peopleResponse.output?.data ?? [];
    const person = pickBestPerson(people);

    if (!person) {
      throw new Error(
        `No decision makers found for ${input.propertyName} in ${input.location}`,
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

    if (linkedinUrl || linkedinSlug) {
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
      email = profile?.emails?.find((e) => e.type === "work")?.email
        ?? profile?.emails?.[0]?.email;
      phone = profile?.phoneNumbers?.[0]?.number;
    }

    const contactName = [person.first_name, person.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (!contactName) {
      throw new Error("Fiber returned a profile without a contact name");
    }

    return {
      company:
        person.current_job?.company_name ??
        `${input.propertyName} Management`,
      contactName,
      contactTitle:
        person.current_job?.title ?? "Director of Operations",
      email,
      phone,
      linkedinUrl,
      source: "fiber",
    };
  }
}

export function createFiberService(): FiberService {
  return new FiberService(getApiKey());
}

/** @deprecated Use FiberService.discoverDecisionMaker */
export async function findDecisionMaker(input: {
  propertyName: string;
  companyHint?: string;
  location?: string;
}): Promise<DiscoveryResult> {
  const service = createFiberService();
  return service.discoverDecisionMaker({
    propertyName: input.propertyName,
    location: input.location ?? "Miami Beach",
  });
}
