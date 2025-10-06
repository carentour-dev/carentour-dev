"use server";

import { NextRequest } from "next/server";
import { contactRequestController } from "@/server/modules/contactRequests/module";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { jsonResponse, handleRouteError } from "@/server/utils/http";

export const POST = async (req: NextRequest) => {
  try {
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
    });

    const supabase = getSupabaseAdmin();
    const { error: emailError } = await supabase.functions.invoke("send-contact-email", {
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
    });

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
