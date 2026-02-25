import type { User } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@/integrations/supabase/server";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { financeController } from "@/server/modules/finance/module";

type AuthenticatedUser = User | null;

const resolveUser = async (
  req: NextRequest,
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
) => {
  const supabaseClient = await createSupabaseClient();
  const authHeader = req.headers.get("authorization");
  let user: AuthenticatedUser = null;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token.length > 0) {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data?.user) {
        user = data.user;
      }
    }
  }

  if (!user) {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    user = session?.user ?? null;
  }

  if (!user) {
    const { data } = await supabaseClient.auth.getUser();
    user = data?.user ?? null;
  }

  return user;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const user = await resolveUser(req, supabaseAdmin);

    if (!user?.id) {
      return NextResponse.json(
        { error: "Authentication required to view finance installments" },
        { status: 401 },
      );
    }

    const data = await financeController.listPatientInstallments(user.id);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[patient][finance][installments][GET]", error);
    return NextResponse.json(
      { error: "Failed to load finance installments" },
      { status: 500 },
    );
  }
}
