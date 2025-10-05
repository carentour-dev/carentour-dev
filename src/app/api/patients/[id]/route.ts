import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/integrations/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("patient_testimonial_public")
      .select("*")
      .eq("patient_id", params.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching patient profile:", error);
      return NextResponse.json(
        { error: "Failed to fetch patient profile" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Patient not found or has no published testimonials" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Patient profile error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
