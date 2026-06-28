"use node";

export type AnalysisInput = {
  stormName: string;
  stormLocation: string;
  propertyName: string;
  riskScore: number;
  expectedRevenue: number;
  buildingYear?: number;
  propertyNotes?: string;
};

export type AnalysisOutput = {
  riskReasoning: string[];
  revenueSummary: string;
  outreachRecommendation: string;
  emailDraft: string;
};

type OpenAiResponse = {
  riskReasoning: string[];
  revenueSummary: string;
  outreachRecommendation: string;
  emailDraft: string;
};

export async function analyzePropertyWithOpenAI(
  input: AnalysisInput,
): Promise<AnalysisOutput> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Set it with: npx convex env set OPENAI_API_KEY",
    );
  }

  const systemPrompt = `You are OverStorm's predictive revenue intelligence engine for disaster restoration companies.
Analyze property storm risk and revenue opportunity. Respond ONLY with valid JSON matching this schema:
{
  "riskReasoning": ["string", "string", "string"],
  "revenueSummary": "string",
  "outreachRecommendation": "string",
  "emailDraft": "string"
}
Keep riskReasoning to 3 concise bullet points. emailDraft should be a professional outreach email (3-4 sentences).`;

  const userPrompt = `Storm: ${input.stormName} impacting ${input.stormLocation}
Property: ${input.propertyName}
Risk Score: ${input.riskScore}/100
Expected Revenue: $${input.expectedRevenue.toLocaleString()}
Building Year: ${input.buildingYear ?? "Unknown"}
Property Notes: ${input.propertyNotes ?? "Commercial property in storm impact zone"}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.4,
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

  const parsed = JSON.parse(content) as OpenAiResponse;

  return {
    riskReasoning: parsed.riskReasoning,
    revenueSummary: parsed.revenueSummary,
    outreachRecommendation: parsed.outreachRecommendation,
    emailDraft: parsed.emailDraft,
  };
}
