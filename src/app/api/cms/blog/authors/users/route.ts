import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/server/auth/requireAdmin";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";

type ProfileRecord = {
  id: string;
  user_id: string | null;
  email: string | null;
  username: string | null;
  avatar_url: string | null;
};

type AuthorRecord = {
  id: string;
  user_id: string | null;
};

export async function GET(request: NextRequest) {
  try {
    await requireRole(["admin", "editor"]);

    const supabase = getSupabaseAdmin();
    const searchParams = request.nextUrl.searchParams;
    const authorId = searchParams.get("authorId");

    const [{ data: authorLinks, error: authorLinksError }, { data, error }] =
      await Promise.all([
        supabase.from("blog_authors").select("id, user_id"),
        supabase
          .from("profiles")
          .select("id, user_id, email, username, avatar_url")
          .order("email", { ascending: true }),
      ]);

    if (authorLinksError) {
      console.error("Failed to load existing author links:", authorLinksError);
      return NextResponse.json(
        { error: "Failed to load existing author links" },
        { status: 500 },
      );
    }

    if (error) {
      console.error("Failed to load users for author linking:", error);
      return NextResponse.json(
        { error: "Failed to load users" },
        { status: 500 },
      );
    }

    const linkedUserIds = new Set(
      (authorLinks as AuthorRecord[] | null | undefined)
        ?.map((record) => record.user_id)
        .filter((value): value is string => typeof value === "string") ?? [],
    );

    if (authorId) {
      const currentAuthor = (
        authorLinks as AuthorRecord[] | null | undefined
      )?.find((record) => record.id === authorId);
      if (currentAuthor?.user_id) {
        linkedUserIds.delete(currentAuthor.user_id);
      }
    }

    const users =
      (data as ProfileRecord[] | null | undefined)
        ?.filter(
          (profile) => profile.user_id && !linkedUserIds.has(profile.user_id),
        )
        .map((profile) => ({
          profile_id: profile.id,
          user_id: profile.user_id as string,
          email: profile.email,
          username: profile.username,
          avatar_url: profile.avatar_url,
        })) ?? [];

    return NextResponse.json({ users });
  } catch (requestError) {
    console.error(
      "Unexpected error loading users for author linking:",
      requestError,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
