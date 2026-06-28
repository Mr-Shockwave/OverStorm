"use node";

export type RevenuePackageInput = {
  stormName: string;
  stormLocation: string;
  propertyName: string;
  riskScore: number;
  riskExplanation: string;
  expectedRevenue: number;
  revenueExplanation: string;
  contactName: string;
  contactTitle: string;
  company: string;
  email?: string;
  phone?: string;
  companyDescription?: string;
  employeeCount?: number;
  companySize?: string;
  industry?: string;
  headcountGrowth?: string;
  recentEvents?: string[];
  locations?: string[];
  limitedIntelligence: boolean;
};

export type RevenuePackageOutput = {
  executiveSummary: string;
  personalizedEmail: string;
  linkedinMessage: string;
  callScript: string;
  aiReasoning: string;
};

type OpenAiPackageResponse = RevenuePackageOutput;

export async function generateRevenueCapturePackage(
  input: RevenuePackageInput,
): Promise<RevenuePackageOutput> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Set it with: npx convex env set OPENAI_API_KEY",
    );
  }

  const systemPrompt = `You are OverStorm's revenue capture strategist for disaster restoration companies.
Generate a complete Revenue Capture Package. Respond ONLY with valid JSON:
{
  "executiveSummary": "string (2-3 sentences)",
  "personalizedEmail": "string (full email with subject line)",
  "linkedinMessage": "string (concise, under 300 chars)",
  "callScript": "string (opening + key talking points + close)",
  "aiReasoning": "string (explain why this company matters, why this contact was chosen, why outreach is urgent given the storm, and if company intelligence is available, how recent events like portfolio expansion, acquisitions, growth hiring, or operational scaling increase outreach priority)"
}

IMPORTANT:
- Risk scores and revenue figures are OverStorm model predictions, NOT government data.
- When recent company events are provided, explicitly connect them to outreach urgency in aiReasoning.`;

  const companyIntel = input.limitedIntelligence
    ? "Limited company intelligence available — rely on storm urgency and property data."
    : [
        input.companyDescription && `Description: ${input.companyDescription}`,
        input.employeeCount && `Employees: ${input.employeeCount}`,
        input.companySize && `Size: ${input.companySize}`,
        input.industry && `Industry: ${input.industry}`,
        input.headcountGrowth &&
          `Headcount growth: ${input.headcountGrowth} (growth hiring signal)`,
        input.recentEvents?.length &&
          `Recent company events (use in reasoning — connect to portfolio expansion, acquisitions, growth hiring, or operational scaling): ${input.recentEvents.join("; ")}`,
        input.locations?.length &&
          `Locations: ${input.locations.join("; ")}`,
      ]
        .filter(Boolean)
        .join("\n");

  const userPrompt = `STORM CONTEXT
Storm: ${input.stormName}
Location: ${input.stormLocation}

PROPERTY
Name: ${input.propertyName}
Risk Score: ${input.riskScore}/100
Risk Analysis: ${input.riskExplanation}
Expected Revenue: $${input.expectedRevenue.toLocaleString()}
Revenue Analysis: ${input.revenueExplanation}

CONTACT (from Fiber)
Name: ${input.contactName}
Title: ${input.contactTitle}
Company: ${input.company}
Email: ${input.email ?? "Not available"}
Phone: ${input.phone ?? "Not available"}

COMPANY INTELLIGENCE (Orange Slice)
${companyIntel || "No enrichment data"}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response");
  }

  return JSON.parse(content) as OpenAiPackageResponse;
}
