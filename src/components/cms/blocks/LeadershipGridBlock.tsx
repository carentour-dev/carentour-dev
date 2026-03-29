import Image from "next/image";
import type { BlockInstance } from "@/lib/cms/blocks";
import { BlockSurface } from "./BlockSurface";

export function LeadershipGridBlock({
  block,
}: {
  block: BlockInstance<"leadershipGrid">;
}) {
  return (
    <BlockSurface
      block={block}
      className="bg-slate-50"
      defaultPadding={{ top: "6rem", bottom: "6rem" }}
      contentClassName="space-y-12"
    >
      {() => (
        <>
          {(block.eyebrow || block.heading || block.description) && (
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              {block.eyebrow ? (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
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
          )}

          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {block.people.map((person, index) => (
              <article
                key={`${person.name}-${index}`}
                className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white"
              >
                <div className="relative aspect-[4/4.5] bg-slate-100">
                  {person.image ? (
                    <Image
                      src={person.image}
                      alt={person.name}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1280px) 28vw, (min-width: 768px) 42vw, 100vw"
                      unoptimized={person.image.startsWith("http")}
                    />
                  ) : null}
                </div>
                <div className="space-y-4 px-6 py-6">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-slate-950">
                      {person.name}
                    </h3>
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                      {person.role}
                    </p>
                  </div>
                  <p className="text-base leading-7 text-slate-600">
                    {person.bio}
                  </p>

                  {person.expertise && person.expertise.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {person.expertise.map((item) => (
                        <span
                          key={item}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {person.languages && person.languages.length > 0 ? (
                    <p className="text-sm text-slate-500">
                      Languages: {person.languages.join(", ")}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </BlockSurface>
  );
}
