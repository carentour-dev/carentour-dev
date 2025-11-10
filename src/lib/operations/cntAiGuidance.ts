export type CntAiChecklistSnippet = {
  id: string;
  label: string;
  prompt: string;
  description?: string;
};

export type CntAiRewriteOption = {
  id: string;
  label: string;
  prompt: string;
};

export const CNT_AI_CHECKLIST_SNIPPETS: CntAiChecklistSnippet[] = [
  {
    id: "pricing-disclaimer",
    label: "Pricing disclaimer",
    description: "Remind them that final pricing follows medical review.",
    prompt:
      "Clarify that any pricing shared is indicative only and final quotes require physician review of their medical history.",
  },
  {
    id: "documents-request",
    label: "Documents",
    description: "Passport + medical records reminder.",
    prompt:
      "Ask them to email a recent medical report plus a clear passport copy so the care team can coordinate travel documents.",
  },
  {
    id: "next-steps",
    label: "Next steps",
    description: "Lay out the immediate actions.",
    prompt:
      "Outline the next two steps (virtual consultation + itinerary review) so they know what will happen after this reply.",
  },
  {
    id: "concierge",
    label: "Concierge",
    description: "Highlight door-to-door concierge support.",
    prompt:
      "Mention that our concierge team coordinates airport pickup, hotel, and in-city transportation so they only focus on recovery.",
  },
  {
    id: "post-op-care",
    label: "Post-op care",
    description: "Reinforce aftercare follow-up.",
    prompt:
      "Reassure them that post-procedure check-ins and follow-up teleconsultations are included for a smooth recovery.",
  },
];

export const CNT_AI_REWRITE_OPTIONS: CntAiRewriteOption[] = [
  {
    id: "shorter",
    label: "Shorter",
    prompt:
      "Rewrite the draft so it stays under 120 words while keeping the key commitments intact.",
  },
  {
    id: "empathetic",
    label: "More empathetic",
    prompt:
      "Keep the facts but warm up the tone to feel more comforting and human without sounding informal.",
  },
  {
    id: "cta",
    label: "Stronger CTA",
    prompt:
      "Emphasize the specific call-to-action and end with a clear next step they should confirm.",
  },
];
