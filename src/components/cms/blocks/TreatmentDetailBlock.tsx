import { PublicQueryBoundary } from "@/components/public/PublicInteractiveProviders";
import type { PublicLocale } from "@/i18n/routing";
import type { BlockInstance } from "@/lib/cms/blocks";
import type { LocalizedPublicTreatmentDetail } from "@/server/modules/treatments/public";
import { BlockSurface } from "./BlockSurface";
import { TreatmentDetailClient } from "./TreatmentDetailClient";

type TreatmentDetailBlockContext = {
  treatmentDetail?: LocalizedPublicTreatmentDetail | null;
  treatmentSlug?: string;
  treatmentOptions?: Array<{
    slug: string;
    name: string;
  }>;
};

export async function TreatmentDetailBlock({
  block,
  context,
  locale = "en",
}: {
  block: BlockInstance<"treatmentDetail">;
  context?: TreatmentDetailBlockContext;
  locale?: PublicLocale;
}) {
  const detail = context?.treatmentDetail ?? null;
  const slug = context?.treatmentSlug ?? detail?.treatment.slug ?? "";

  return (
    <BlockSurface
      block={block}
      container={false}
      className="overflow-visible bg-background"
      defaultPadding={{ top: "0rem", bottom: "0rem" }}
    >
      {() =>
        detail && slug ? (
          <PublicQueryBoundary>
            <TreatmentDetailClient
              block={block}
              treatment={detail.treatment}
              slug={slug}
              locale={locale}
              treatmentOptions={context?.treatmentOptions}
            />
          </PublicQueryBoundary>
        ) : null
      }
    </BlockSurface>
  );
}
