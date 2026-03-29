import Link from "next/link";
import { AlertCircle, AlertTriangle, Info, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BlockInstance } from "@/lib/cms/blocks";
import { BlockSurface } from "./BlockSurface";

const toneStyles = {
  neutral: {
    icon: ShieldCheck,
    iconClass: "text-emerald-700",
    accentClass: "text-emerald-700",
  },
  info: {
    icon: Info,
    iconClass: "text-sky-700",
    accentClass: "text-sky-700",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-amber-800",
    accentClass: "text-amber-800",
  },
} as const;

export function AdvisoryNoticeBlock({
  block,
}: {
  block: BlockInstance<"advisoryNotice">;
}) {
  const tone = toneStyles[block.tone];
  const ToneIcon = tone.icon;
  const facts = [
    { label: "Last reviewed", value: block.lastReviewed },
    { label: "Applies to", value: block.appliesTo },
    { label: "Planning scope", value: block.planningScope },
  ].filter(
    (item): item is { label: string; value: string } =>
      typeof item.value === "string" && item.value.trim().length > 0,
  );

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
            <div className="flex flex-wrap items-center gap-3">
              {block.eyebrow ? (
                <span className="inline-flex items-center rounded-full border border-border/70 bg-card/90 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground dark:border-slate-200 dark:bg-white dark:text-slate-500">
                  {block.eyebrow}
                </span>
              ) : null}
              <span
                className={[
                  "inline-flex items-center text-[0.72rem] font-semibold uppercase tracking-[0.22em]",
                  tone.accentClass,
                ].join(" ")}
              >
                {block.tone === "warning"
                  ? "Important"
                  : block.tone === "neutral"
                    ? "Verified"
                    : "Updated guidance"}
              </span>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-semibold leading-tight text-foreground dark:text-slate-950 md:text-5xl">
                {block.heading}
              </h2>
              {block.description ? (
                <p className="max-w-xl text-lg leading-8 text-muted-foreground dark:text-slate-600 md:text-xl">
                  {block.description}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-10">
            {facts.length ? (
              <div className="space-y-6">
                {facts.map((fact, index) => (
                  <div
                    key={fact.label}
                    className="grid gap-3 border-b border-border/80 pb-6 last:border-b-0 last:pb-0 dark:border-slate-200 md:grid-cols-[3rem_1fr]"
                  >
                    <span
                      className={["text-sm font-medium", tone.accentClass].join(
                        " ",
                      )}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground dark:text-slate-500">
                        {fact.label}
                      </p>
                      <p className="text-base leading-7 text-muted-foreground dark:text-slate-600">
                        {fact.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {(block.items?.length ||
              block.disclaimer ||
              block.actions?.length) && (
              <div className="grid gap-8 border-t border-border pt-8 dark:border-slate-200 lg:grid-cols-[0.75fr_1.25fr]">
                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground dark:text-slate-500">
                    Important To Keep In Mind
                  </p>
                  {block.disclaimer ? (
                    <p className="text-base leading-7 text-muted-foreground dark:text-slate-600">
                      {block.disclaimer}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-6">
                  {block.items?.map((item, index) => (
                    <div
                      key={`${item}-${index}`}
                      className="flex items-start gap-3 border-b border-border/80 pb-6 last:border-b-0 last:pb-0 dark:border-slate-200"
                    >
                      <AlertCircle
                        className={[
                          "mt-1 h-4 w-4 shrink-0",
                          tone.iconClass,
                        ].join(" ")}
                      />
                      <p className="text-base leading-7 text-muted-foreground dark:text-slate-600">
                        {item}
                      </p>
                    </div>
                  ))}

                  {block.actions?.length ? (
                    <div className="flex flex-wrap gap-3 pt-2">
                      {block.actions.map((action, index) => (
                        <Button
                          key={`${action.href}-${index}`}
                          asChild
                          variant={
                            action.variant ??
                            (index === 0 ? "default" : "outline")
                          }
                        >
                          <Link
                            href={action.href}
                            target={action.target ?? "_self"}
                            rel={
                              action.target === "_blank"
                                ? "noopener noreferrer"
                                : undefined
                            }
                          >
                            {action.label}
                          </Link>
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </BlockSurface>
  );
}
