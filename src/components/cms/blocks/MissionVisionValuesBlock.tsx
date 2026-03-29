import type { BlockInstance } from "@/lib/cms/blocks";
import { cn } from "@/lib/utils";
import { BlockSurface } from "./BlockSurface";
import { resolveIcon } from "./utils";

const accentPresetClasses = {
  neutral: {
    card: "border-slate-200 bg-slate-50",
    overlay: "from-slate-300/34 via-slate-200/12 to-transparent",
  },
  warm: {
    card: "border-amber-200/80 bg-amber-50/70",
    overlay: "from-amber-300/45 via-orange-100/22 to-transparent",
  },
  sage: {
    card: "border-emerald-200/80 bg-emerald-50/75",
    overlay: "from-emerald-300/48 via-teal-100/22 to-transparent",
  },
  sky: {
    card: "border-sky-200/80 bg-sky-50/75",
    overlay: "from-sky-300/46 via-cyan-100/20 to-transparent",
  },
  brand: {
    card: "border-blue-200/80 bg-blue-50/80",
    overlay: "from-blue-400/42 via-indigo-100/22 to-transparent",
  },
  none: {
    card: "border-slate-200 bg-white",
    overlay: "from-transparent via-transparent to-transparent",
  },
} as const;

export function MissionVisionValuesBlock({
  block,
}: {
  block: BlockInstance<"missionVisionValues">;
}) {
  return (
    <BlockSurface
      block={block}
      className="bg-white"
      defaultPadding={{ top: "6rem", bottom: "6rem" }}
      contentClassName="space-y-14"
    >
      {() => (
        <>
          <div className="mx-auto max-w-3xl space-y-4 text-center">
            {block.eyebrow ? (
              <span className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
                {block.eyebrow}
              </span>
            ) : null}
            {block.heading ? (
              <h2 className="text-3xl font-semibold text-slate-950 md:text-5xl">
                {block.heading}
              </h2>
            ) : null}
            {block.description ? (
              <p className="text-lg leading-8 text-slate-600">
                {block.description}
              </p>
            ) : null}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {[
              {
                title: block.missionTitle,
                body: block.missionBody,
                accent:
                  accentPresetClasses[block.missionAccentPreset ?? "neutral"],
              },
              {
                title: block.visionTitle,
                body: block.visionBody,
                accent: accentPresetClasses[block.visionAccentPreset ?? "warm"],
              },
            ].map((entry) => (
              <article
                key={entry.title}
                className={cn(
                  "group/mission relative overflow-hidden rounded-[2rem] border px-6 py-8 shadow-[0_14px_36px_rgba(15,23,42,0.08)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(15,23,42,0.14),0_0_0_1px_rgba(59,130,246,0.08),0_0_26px_rgba(59,130,246,0.16)] dark:shadow-[0_14px_36px_rgba(15,23,42,0.08)] md:px-8",
                  entry.accent.card,
                )}
              >
                <div
                  className={cn(
                    "absolute inset-x-0 top-0 h-28 bg-gradient-to-b",
                    entry.accent.overlay,
                  )}
                />
                <div className="relative space-y-4">
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500 transition-colors duration-300 group-hover/mission:text-primary dark:group-hover/mission:text-[hsl(210_85%_45%)]">
                    {entry.title}
                  </p>
                  <p className="text-lg leading-8 text-slate-700">
                    {entry.body}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <div className="space-y-8 border-t border-slate-200 pt-10">
            <div className="mx-auto max-w-3xl space-y-3 text-center">
              <h3 className="text-2xl font-semibold text-slate-950 md:text-4xl">
                {block.valuesTitle}
              </h3>
              {block.valuesDescription ? (
                <p className="text-base leading-7 text-slate-600 md:text-lg">
                  {block.valuesDescription}
                </p>
              ) : null}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {block.values.map((value, index) => {
                const Icon = resolveIcon(value.icon);
                return (
                  <article
                    key={`${value.title}-${index}`}
                    className="group/value flex h-full flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white px-6 py-7 shadow-[0_14px_36px_rgba(15,23,42,0.08)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(15,23,42,0.14),0_0_0_1px_rgba(59,130,246,0.08),0_0_26px_rgba(59,130,246,0.16)] dark:shadow-[0_14px_36px_rgba(15,23,42,0.08)]"
                  >
                    <div className="flex items-center gap-3">
                      {Icon ? (
                        <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-cyan-50 text-cyan-700 transition-transform duration-300 ease-out group-hover/value:scale-105">
                          <Icon size={20} strokeWidth={1.75} />
                        </div>
                      ) : null}
                      <h4 className="text-lg font-semibold text-slate-950 transition-colors duration-300 group-hover/value:text-primary">
                        {value.title}
                      </h4>
                    </div>
                    <p className="text-base leading-7 text-slate-600">
                      {value.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </>
      )}
    </BlockSurface>
  );
}
