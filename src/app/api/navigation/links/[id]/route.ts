import { NextRequest, NextResponse } from "next/server";

import { resolveAdminLocale } from "@/lib/public/adminLocale";
import { localizePublicPathname } from "@/lib/public/routing";
import {
  isSafeManagedHref,
  normalizeManagedHref,
  SAFE_MANAGED_HREF_MESSAGE,
} from "@/lib/managedHrefs";
import { requirePermission } from "@/server/auth/requireAdmin";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { revalidateSeoPaths } from "@/lib/seo";
import { Database } from "@/integrations/supabase/types";

type NavigationLinkRow =
  Database["public"]["Tables"]["navigation_links"]["Row"];

const SELECT_COLUMNS =
  "id,label,slug,href,status,position,kind,cms_page_id,created_at,updated_at";

function validateNavigationHref(value: unknown) {
  const normalizedHref = normalizeManagedHref(
    typeof value === "string" ? value : null,
  );

  if (!isSafeManagedHref(normalizedHref)) {
    return {
      ok: false as const,
      error: SAFE_MANAGED_HREF_MESSAGE,
    };
  }

  return {
    ok: true as const,
    href: normalizedHref,
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await requirePermission("nav.manage");
  const locale = resolveAdminLocale(request);

  const payload = (await request.json()) as Partial<NavigationLinkRow>;

  const supabase = getSupabaseAdmin();

  const { data: existing, error: fetchError } = await supabase
    .from("navigation_links")
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json(
      { error: "Navigation link not found" },
      { status: 404 },
    );
  }

  if (locale === "ar") {
    const { data, error } = await (supabase as any)
      .from("navigation_link_translations")
      .upsert(
        {
          navigation_link_id: id,
          locale: "ar",
          label: payload.label ?? existing.label,
          status: payload.status ?? existing.status,
        },
        { onConflict: "navigation_link_id,locale" },
      )
      .select("label, status, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidateSeoPaths([
      "/",
      "/ar",
      existing.href,
      localizePublicPathname(existing.href, "ar"),
    ]);

    return NextResponse.json({
      data: {
        ...existing,
        label: data?.label ?? existing.label,
        status: data?.status ?? existing.status,
        updated_at: data?.updated_at ?? existing.updated_at,
      },
    });
  }

  const isAutoManaged = Boolean(existing.cms_page_id);
  if (!isAutoManaged && payload.href !== undefined) {
    const hrefValidation = validateNavigationHref(payload.href);
    if (!hrefValidation.ok) {
      return NextResponse.json(
        { error: hrefValidation.error },
        { status: 400 },
      );
    }
    payload.href = hrefValidation.href;
  }

  const updates = isAutoManaged
    ? {
        label: payload.label ?? existing.label,
        status: payload.status ?? existing.status,
        position: payload.position ?? existing.position,
      }
    : {
        label: payload.label ?? existing.label,
        href: payload.href ?? existing.href,
        slug: payload.slug ?? existing.slug,
        status: payload.status ?? existing.status,
        position: payload.position ?? existing.position,
        kind: payload.kind ?? existing.kind,
        cms_page_id: payload.cms_page_id ?? existing.cms_page_id,
      };

  const { data, error } = await supabase
    .from("navigation_links")
    .update(updates)
    .eq("id", id)
    .select(SELECT_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await requirePermission("nav.manage");
  const locale = resolveAdminLocale(_request);

  const supabase = getSupabaseAdmin();

  if (locale === "ar") {
    const { error } = await (supabase as any)
      .from("navigation_link_translations")
      .delete()
      .eq("navigation_link_id", id)
      .eq("locale", "ar");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidateSeoPaths(["/", "/ar"]);
    return NextResponse.json({ data: { id } });
  }

  const { error } = await supabase
    .from("navigation_links")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { id } });
}
