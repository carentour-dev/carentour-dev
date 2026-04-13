import nextVitals from "eslint-config-next";

const reactCompilerIncompatibleLibraryFiles = [
  "src/app/(internal)/admin/consultations/page.tsx",
  "src/app/(internal)/admin/service-providers/page.tsx",
  "src/components/cms/editor/BlockInspector.tsx",
];

const reactCompilerManualMemoizationFiles = [
  "src/app/(internal)/admin/accounts/page.tsx",
  "src/app/(internal)/staff/onboarding/page.tsx",
  "src/app/(public)/**/TreatmentCategoryPageClient.tsx",
];

const reactCompilerSetStateInEffectFiles = [
  "src/app/(internal)/auth/page.tsx",
  "src/app/(internal)/cms/CmsLayoutClient.tsx",
  "src/app/(internal)/cms/faqs/page.tsx",
  "src/app/(internal)/cms/navigation/page.tsx",
  "src/app/(internal)/operations/cnt-ai/page.tsx",
  "src/app/(internal)/operations/consultations/page.tsx",
  "src/app/(internal)/operations/requests/page.tsx",
  "src/app/(internal)/operations/start-journey/page.tsx",
  "src/components/Footer.tsx",
  "src/components/Header.tsx",
  "src/components/ThemeToggle.tsx",
  "src/components/admin/AdminShell.tsx",
  "src/components/blog/SocialShare.tsx",
  "src/components/blog/TableOfContents.tsx",
  "src/components/cms/BlogPostEditor.tsx",
  "src/components/cms/TemplateBrowser.tsx",
  "src/components/cms/blocks/MedicalFacilitiesDirectoryClient.tsx",
  "src/components/cms/blocks/TabbedGuideContent.tsx",
  "src/components/cms/editor/PageBuilder.tsx",
  "src/components/finance/FinanceReportScreen.tsx",
  "src/components/finance/FinanceSettingsConsole.tsx",
  "src/components/finance/FinanceShell.tsx",
  "src/components/finance/FinanceWorkspace.tsx",
  "src/components/operations/OperationsShell.tsx",
  "src/components/operations/quotation-calculator/QuotationCalculatorWorkspace.tsx",
  "src/components/operations/quotation-calculator/QuotationPrintView.tsx",
  "src/components/ui/filter-combobox.tsx",
  "src/components/workspaces/InternalWorkspaceShell.tsx",
  "src/hooks/useTableOfContents.ts",
];

const reactCompilerStaticComponentFiles = [
  "src/components/cms/blocks/TabbedGuideContent.tsx",
];

const config = [
  {
    ignores: ["dist", ".next", "supabase/functions"],
  },
  ...nextVitals,
  {
    rules: {
      "react-hooks/incompatible-library": "error",
      "react-hooks/preserve-manual-memoization": "error",
      "react-hooks/set-state-in-effect": "error",
      "react-hooks/static-components": "error",
    },
  },
  {
    files: reactCompilerIncompatibleLibraryFiles,
    rules: {
      "react-hooks/incompatible-library": "off",
    },
  },
  {
    files: reactCompilerManualMemoizationFiles,
    rules: {
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
  {
    files: reactCompilerSetStateInEffectFiles,
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: reactCompilerStaticComponentFiles,
    rules: {
      "react-hooks/static-components": "off",
    },
  },
];

export default config;
