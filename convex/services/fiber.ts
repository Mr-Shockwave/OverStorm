export type DecisionMakerInput = {
  propertyName: string;
  companyHint?: string;
};

export type DecisionMakerResult = {
  company: string;
  contactName: string;
  contactTitle: string;
  email?: string;
  phone?: string;
  source: "fiber_stub" | "fiber";
};

/**
 * Fiber integration point — replace stub with real Fiber API calls.
 * @see https://fiber.ai for contact enrichment
 */
export async function findDecisionMaker(
  input: DecisionMakerInput,
): Promise<DecisionMakerResult> {
  // TODO: Integrate Fiber API
  // const response = await fetch("https://api.fiber.ai/v1/contacts/search", { ... });

  return {
    company: input.companyHint ?? "ABC Property Management",
    contactName: "John Smith",
    contactTitle: "Director of Operations",
    email: "john.smith@abcpropertymgmt.com",
    source: "fiber_stub",
  };
}
