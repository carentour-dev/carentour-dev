INSERT INTO public.cms_pages (slug, title, status, seo, settings, content)
VALUES (
    'treatment-detail-template',
    'Treatment Detail Shell',
    'published',
    $${
    "title": "Treatment Detail | Care N Tour",
    "description": "Treatment detail shell used by Care N Tour to present live procedure options, planning context, and recovery-oriented support for international patients."
  }$$::jsonb,
    '{}'::jsonb,
    $$[
    {
      "type": "treatmentDetail",
      "eyebrow": "Care N Tour Treatment Guide",
      "trustStatement": "Care N Tour helps patients evaluate procedures, compare recovery and pricing visibility, and move from exploration to a structured treatment-planning conversation.",
      "searchPlaceholder": "Search treatments or procedures by name...",
      "sectionTitles": {
        "quickFacts": "Key treatment facts",
        "overview": "Treatment overview",
        "idealCandidates": "Who this treatment is designed for",
        "procedures": "Procedures within this treatment pathway",
        "specialists": "Specialist doctors for this treatment",
        "patientReviews": "Patient reviews",
        "patientStories": "Patient stories"
      },
      "sectionDescriptions": {
        "overview": "Review the treatment profile, planning context, and patient suitability factors before you move into procedure comparison.",
        "procedures": "Use treatment and procedure search to move between pathways quickly, then compare the live procedures shown for the current treatment in greater detail.",
        "specialists": "Meet the doctors most closely associated with this treatment category before you start case review or travel planning.",
        "patientStories": "Read outcome-focused patient stories that help future patients understand timelines, recovery expectations, and decision context."
      },
      "quickFactLabels": {
        "duration": "Treatment duration",
        "recovery": "Recovery timeline",
        "estimatedCost": "Estimated cost",
        "successRate": "Success rate",
        "treatmentPdf": "Treatment PDF",
        "downloadOverview": "Download overview",
        "personalizedConsultation": "Personalized consultation",
        "personalizedConsultationDescription": "Care N Tour refines pricing, timeline, and procedure planning against the medical case before any travel is confirmed."
      },
      "procedureLabels": {
        "duration": "Duration",
        "recovery": "Recovery",
        "price": "Price",
        "successRate": "Success rate",
        "procedurePdf": "Procedure PDF",
        "procedurePdfDescription": "Download a detailed overview when a patient-ready procedure guide is available.",
        "download": "Download",
        "candidateRequirements": "Candidate requirements",
        "additionalNotes": "Additional notes",
        "recoveryTimeline": "Recovery timeline",
        "startJourney": "Start your journey",
        "priceComparisonToggle": "International price comparison",
        "priceComparisonShow": "Show price comparison",
        "priceComparisonHide": "Hide price comparison"
      },
      "filterLabels": {
        "search": "Search",
        "treatment": "Treatment",
        "procedure": "Procedure"
      },
      "filterPlaceholders": {
        "treatment": "All treatments",
        "procedure": "All procedures"
      },
      "filterSearchPlaceholders": {
        "treatment": "Search treatments...",
        "procedure": "Search procedures..."
      },
      "filterEmptyCopy": {
        "treatment": "No treatments found.",
        "procedure": "No procedures found."
      },
      "filterOptionLabels": {
        "pricingGuidance": "Has pricing guidance",
        "pricingComparison": "Has international comparison",
        "recoveryGuidance": "Has recovery guidance",
        "recoveryTimeline": "Has recovery timeline",
        "resourcesGuide": "Has downloadable guide",
        "resourcesRequirements": "Has candidacy guidance"
      },
      "clearButtonLabel": "Clear filters",
      "states": {
        "resultsIntro": "Search treatments and procedures, then compare the live procedure options available within the selected treatment pathway before speaking with Care N Tour about next steps.",
        "resultsCountLabel": "procedures available",
        "emptyHeading": "No procedures found",
        "emptyDescription": "Adjust your treatment search or procedure filter to explore more options."
      },
      "labels": {
        "backLink": "Back to all treatments",
        "fallbackDescription": "Learn more about this treatment pathway through Care N Tour.",
        "fallbackOverview": "Care N Tour structures treatment planning around specialist access, provider fit, travel coordination, and recovery clarity.",
        "candidateSuitability": "Case suitability is confirmed during consultation so the treatment pathway aligns with the patient's goals and medical profile.",
        "noSpecialists": "No specialists are currently available for this treatment.",
        "internationalLabel": "International",
        "patientReviewsEmpty": "Published patient reviews for this treatment will appear here once they are available.",
        "noPatientStories": "No patient stories are published yet. Check back for outcome-focused journeys and recovery context.",
        "featuredSuccess": "Featured success",
        "requestConsultation": "Request consultation"
      }
    },
    {
      "type": "faq",
      "eyebrow": "Treatment Planning FAQ",
      "heading": "What international patients want to know about treatment in Egypt",
      "description": "These answers explain how Care N Tour helps patients evaluate treatment options, understand likely timelines and costs, and plan care in Egypt with greater confidence.",
      "layout": "twoColumn",
      "items": [
        {
          "question": "How does Care N Tour help me choose the right treatment pathway in Egypt?",
          "answer": "Care N Tour helps patients understand their treatment options, coordinate specialist review, and narrow the most suitable pathway based on medical goals, recovery priorities, and travel considerations."
        },
        {
          "question": "What is included when I plan treatment through Care N Tour?",
          "answer": "Depending on the case, Care N Tour can support specialist matching, provider coordination, preliminary treatment guidance, travel planning, accommodation support, and next-step coordination before arrival in Egypt."
        },
        {
          "question": "How are treatment costs and timelines confirmed?",
          "answer": "Published pricing and timelines are guidance only. Final recommendations, costs, and scheduling are confirmed after medical records are reviewed and the provider defines the recommended treatment plan."
        }
      ]
    },
    {
      "type": "callToAction",
      "eyebrow": "Ready To Plan Properly?",
      "heading": "Move from treatment research to a clearer next step with Care N Tour.",
      "description": "Share your case and our team will help translate treatment options into a practical plan shaped around provider fit, travel timing, and recovery requirements.",
      "layout": "split",
      "background": "dark",
      "actions": [
        {
          "label": "Start your journey",
          "href": "/start-journey",
          "variant": "default"
        },
        {
          "label": "Book a consultation",
          "href": "/consultation",
          "variant": "outline"
        }
      ]
    }
  ]$$::jsonb
)
ON CONFLICT (slug) DO UPDATE
    SET
        title = excluded.title,
        status = excluded.status,
        seo = excluded.seo,
        settings = excluded.settings,
        content = excluded.content,
        updated_at = now();
