import type { PublicLocale } from "@/i18n/routing";
import type { BlockInstance } from "@/lib/cms/blocks";
import { localizeDigits, localizeOptionalDigits } from "@/lib/public/numbers";
import { BlockSurface } from "./BlockSurface";

export function StoryNarrativeBlock({
  block,
  locale = "en",
}: {
  block: BlockInstance<"storyNarrative">;
  locale?: PublicLocale;
}) {
  return (
    <BlockSurface
      block={block}
      className="bg-background dark:border-y dark:border-slate-200 dark:bg-white"
      defaultPadding={{ top: "6rem", bottom: "6rem" }}
      contentClassName="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]"
    >
      {() => (
        <>
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {block.eyebrow ? (
              <span className="inline-flex items-center rounded-full border border-border/70 bg-card/90 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground dark:border-slate-200 dark:bg-white dark:text-slate-500">
                {localizeOptionalDigits(block.eyebrow, locale)}
              </span>
            ) : null}
            <div className="space-y-4">
              <h2 className="text-3xl font-semibold leading-tight text-foreground dark:text-slate-950 md:text-5xl">
                {localizeOptionalDigits(block.heading, locale)}
              </h2>
              <p className="max-w-xl text-lg leading-8 text-muted-foreground dark:text-slate-600 md:text-xl">
                {localizeOptionalDigits(block.lead, locale)}
              </p>
            </div>
          </div>

          <div className="space-y-10">
            <div className="space-y-5 text-base leading-8 text-muted-foreground dark:text-slate-600 md:text-lg">
              {block.paragraphs.map((paragraph, index) => (
                <p key={`story-paragraph-${index}`}>
                  {localizeOptionalDigits(paragraph, locale)}
                </p>
              ))}
            </div>

            <div className="grid gap-8 border-t border-border pt-8 dark:border-slate-200 lg:grid-cols-[0.75fr_1.25fr]">
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground dark:text-slate-500">
                  {localizeOptionalDigits(block.strengthsTitle, locale)}
                </p>
                {block.closing ? (
                  <p className="text-base leading-7 text-muted-foreground dark:text-slate-600">
                    {localizeOptionalDigits(block.closing, locale)}
                  </p>
                ) : null}
              </div>

              <div className="space-y-6">
                {block.strengths.map((strength, index) => (
                  <div
                    key={`${strength.title}-${index}`}
                    className="grid gap-3 border-b border-border/80 pb-6 last:border-b-0 last:pb-0 dark:border-slate-200 md:grid-cols-[3rem_1fr]"
                  >
                    <span className="text-sm font-medium text-primary dark:text-cyan-700">
                      {localizeDigits(
                        String(index + 1).padStart(2, "0"),
                        locale,
                      )}
                    </span>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground dark:text-slate-950">
                        {localizeOptionalDigits(strength.title, locale)}
                      </h3>
                      {strength.description ? (
                        <p className="text-base leading-7 text-muted-foreground dark:text-slate-600">
                          {localizeOptionalDigits(strength.description, locale)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </BlockSurface>
  );
}
