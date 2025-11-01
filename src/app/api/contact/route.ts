"use server";

import { NextRequest } from "next/server";
import { contactRequestController } from "@/server/modules/contactRequests/module";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { jsonResponse, handleRouteError } from "@/server/utils/http";
import { createClient as createSupabaseClient } from "@/integrations/supabase/server";

export const POST = async (req: NextRequest) => {
  try {
    const supabaseClient = await createSupabaseClient();
    const supabaseAdmin = getSupabaseAdmin();

    const authHeader = req.headers.get("authorization");
    let user = null;

    if (authHeader?.startsWith("Bearer ")) {
      const accessToken = authHeader.slice(7).trim();
      if (accessToken.length > 0) {
        const { data: tokenUser, error: tokenError } =
          await supabaseAdmin.auth.getUser(accessToken);
        if (!tokenError && tokenUser?.user) {
          user = tokenUser.user;
        }
      }
    }

    if (!user) {
      const {
        data: { session },
        error: sessionError,
      } = await supabaseClient.auth.getSession();

      user = session?.user ?? null;

      if (!user && !sessionError) {
        const { data: userResult } = await supabaseClient.auth.getUser();
        user = userResult?.user ?? null;
      }
    }

    let patientId: string | null = null;

    if (user?.id) {
      const { data: existingPatient, error: patientError } = await supabaseAdmin
        .from("patients")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!patientError && existingPatient?.id) {
        patientId = existingPatient.id;
      }
    }

    const payload = await req.json();

    const contactRequest = await contactRequestController.create({
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      country: payload.country,
      treatment: payload.treatment,
      message: payload.message,
      request_type: "general",
      user_id: user?.id ?? null,
      patient_id: patientId,
      origin: user ? "portal" : undefined,
    });

    const { error: emailError } = await supabaseAdmin.functions.invoke(
      "send-contact-email",
      {
        body: {
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          phone: payload.phone,
          country: payload.country,
          treatment: payload.treatment,
          message: payload.message,
          skipLogging: true,
        },
      },
    );

    if (emailError) {
      throw emailError;
    }

    return jsonResponse({
      success: true,
      contactRequestId: contactRequest.id,
      status: contactRequest.status,
    });
  } catch (error) {
    return handleRouteError(error);
  }
};
