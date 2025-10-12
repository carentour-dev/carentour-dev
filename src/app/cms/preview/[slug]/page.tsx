import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { headers } from "next/headers";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";

type PreviewProps = {
  params: { slug: string };
  searchParams?: { token?: string };
};

export const dynamic = "force-dynamic";

export default async function CmsPreviewPage({ params, searchParams }: PreviewProps) {
  const headerStore = headers();
  const authHeader = headerStore.get("authorization");
  let token: string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  } else if (searchParams?.token) {
    token = decodeURIComponent(searchParams.token);
  }

  if (!token) {
    return <main className="container mx-auto px-4 py-8">Unauthorized</main>;
  }

  const admin = getSupabaseAdmin();
  const { data: user } = await admin.auth.getUser(token);
  if (!user?.user) {
    return (
      <main className="container mx-auto px-4 py-8">Unauthorized</main>
    );
  }
  const { data: profile } = await admin.from("profiles").select("role").eq("user_id", user.user.id).maybeSingle();
  if (!profile || !["admin", "editor"].includes((profile as any).role)) {
    return (
      <main className="container mx-auto px-4 py-8">Forbidden</main>
    );
  }
  const { data } = await admin
    .from("cms_pages")
    .select("content")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!data?.content) {
    return <main className="container mx-auto px-4 py-8">No preview available</main>;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <BlockRenderer blocks={(data.content as any[]) ?? []} />
    </main>
  );
}
