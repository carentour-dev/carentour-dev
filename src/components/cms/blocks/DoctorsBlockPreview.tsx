"use client";

import { useMemo } from "react";

import { useDoctors } from "@/hooks/useDoctors";
import type { BlockInstance } from "@/lib/cms/blocks";

import { BlockSurface } from "./BlockSurface";
import {
  DoctorsBlockContent,
  type DoctorBlockItem,
} from "./DoctorsBlockContent";

function selectPreviewDoctors(
  doctors: DoctorBlockItem[],
  block: BlockInstance<"doctors">,
) {
  const manual = (block.manualDoctors ?? [])
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (manual.length > 0) {
    const orderMap = new Map(manual.map((id, index) => [id, index]));
    return doctors
      .filter((doctor) => manual.includes(doctor.id))
      .sort((a, b) => {
        const rankA = orderMap.get(a.id) ?? 9999;
        const rankB = orderMap.get(b.id) ?? 9999;
        return rankA - rankB;
      })
      .slice(0, block.limit);
  }

  return doctors
    .filter((doctor) => {
      if (block.featuredOnly) {
        return (doctor.patient_rating ?? 0) >= 4.5;
      }
      return true;
    })
    .filter((doctor) => {
      if (!block.specialties?.length) {
        return true;
      }

      return block.specialties.includes(doctor.specialization ?? "");
    })
    .slice(0, block.limit);
}

function PreviewState({
  block,
  title,
  description,
}: {
  block: BlockInstance<"doctors">;
  title: string;
  description: string;
}) {
  return (
    <BlockSurface
      block={block}
      defaultPadding={{ top: "4rem", bottom: "4rem" }}
      contentClassName="space-y-6"
    >
      {() => (
        <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 p-8 text-center">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
      )}
    </BlockSurface>
  );
}

export function DoctorsBlockPreview({
  block,
}: {
  block: BlockInstance<"doctors">;
}) {
  const { doctors, loading, error } = useDoctors();
  const selectedDoctors = useMemo(
    () => selectPreviewDoctors(doctors, block),
    [block, doctors],
  );

  if (loading) {
    return (
      <PreviewState
        block={block}
        title="Loading doctors"
        description="Fetching live doctor data for the preview."
      />
    );
  }

  if (error) {
    return (
      <PreviewState
        block={block}
        title="Doctors preview unavailable"
        description={error}
      />
    );
  }

  if (!selectedDoctors.length) {
    return (
      <PreviewState
        block={block}
        title="No doctors available"
        description="Adjust the block filters or publish doctor profiles to populate this section."
      />
    );
  }

  return <DoctorsBlockContent block={block} doctors={selectedDoctors} />;
}
