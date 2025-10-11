import { z } from "zod";
import { CrudService } from "@/server/modules/common/crudService";
import { ApiError } from "@/server/utils/errors";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import type { Database } from "@/integrations/supabase/types";

// Patients share the generic CRUD helpers used by other admin modules.
const patientServiceInstance = new CrudService("patients", "patient");

const isoDate = z
  .string()
  .regex(/^(\d{4})-(\d{2})-(\d{2})$/)
  .optional();

const optionalUuid = z.preprocess(
  (value) => {
    if (typeof value === "string" && value.trim() === "") {
      return null;
    }
    return value;
  },
  z.string().uuid().nullable().optional(),
);

const createPatientSchema = z.object({
  user_id: optionalUuid,
  full_name: z.string().min(2),
  date_of_birth: isoDate,
  sex: z.enum(["female", "male", "non_binary", "prefer_not_to_say"]).optional(),
  nationality: z.string().optional(),
  contact_email: z
    .preprocess(
      (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
      z.string().email().optional(),
    )
    .optional(),
  contact_phone: z.string().optional(),
  preferred_language: z.string().optional(),
  preferred_currency: z.string().optional(),
  notes: z.string().optional(),
  email_verified: z.boolean().optional(),
  portal_password: z
    .preprocess(
      (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
      z.string().min(8).max(72).optional(),
    )
    .optional(),
});

const updatePatientSchema = createPatientSchema.partial();
const patientIdSchema = z.string().uuid();

export const patientService = patientServiceInstance;

type PatientInsert = Database["public"]["Tables"]["patients"]["Insert"];
type PatientUpdate = Database["public"]["Tables"]["patients"]["Update"];

const trimString = (value: string) => value.trim();

const trimOptionalString = (value: string | undefined) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeOptionalEmail = (value: string | null | undefined) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.toLowerCase() : null;
};

type SupabaseAdminClient = ReturnType<typeof getSupabaseAdmin>;

const ACCOUNT_ALREADY_EXISTS = /already registered/i;

const createOrUpdatePortalAccount = async (
  supabase: SupabaseAdminClient,
  {
    email,
    password,
    fullName,
    emailVerified,
  }: { email: string; password: string; fullName: string; emailVerified: boolean },
): Promise<{ userId: string; createdNew: boolean }> => {
  const metadata = fullName.length > 0 ? { full_name: fullName } : undefined;
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: emailVerified,
    user_metadata: metadata,
  });

  if (!error) {
    const userId = data?.user?.id;
    if (!userId) {
      throw new ApiError(500, "Supabase did not return an identifier for the new portal user.");
    }
    return { userId, createdNew: true };
  }

  if (error.message && ACCOUNT_ALREADY_EXISTS.test(error.message)) {
    const { data: lookupData, error: lookupError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
    });

    if (lookupError || !lookupData?.user) {
      throw new ApiError(
        400,
        "An account already exists for this email address. Update it manually from Supabase Auth.",
        lookupError?.message,
      );
    }

    const userId = lookupData.user.id;
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password,
      email,
      email_confirm: emailVerified,
      user_metadata: metadata,
    });

    if (updateError) {
      throw new ApiError(500, "Failed to update the existing patient portal account.", updateError.message);
    }

    return { userId, createdNew: false };
  }

  throw new ApiError(500, "Failed to create patient portal account.", error.message);
};

const sendPortalPasswordEmail = async (
  supabase: SupabaseAdminClient,
  { email, fullName, password }: { email: string; fullName: string; password: string },
) => {
  const fallbackName = fullName.trim().length > 0 ? fullName : email.split("@")[0] ?? "Care N Tour Patient";
  const { error } = await supabase.functions.invoke("send-welcome-email", {
    body: {
      email,
      username: fallbackName,
      password,
    },
  });

  if (error) {
    const message = typeof error === "string" ? error : error.message ?? "Unknown email service error.";
    throw new ApiError(500, "Failed to send portal credentials email to the patient.", message);
  }
};

export const patientController = {
  async list() {
    return patientService.list();
  },

  async search(query: string) {
    const supabase = getSupabaseAdmin();
    const searchTerm = `%${query.trim()}%`;

    const { data, error } = await supabase
      .from("patients")
      .select("id, full_name, contact_email, nationality, home_city, has_testimonial")
      .or(`full_name.ilike.${searchTerm},contact_email.ilike.${searchTerm}`)
      .order("full_name", { ascending: true })
      .limit(20);

    if (error) {
      throw new ApiError(500, "Failed to search patients", error.message);
    }

    return data ?? [];
  },

  async get(id: unknown) {
    const patientId = patientIdSchema.parse(id);
    return patientService.getById(patientId);
  },

  async create(payload: unknown) {
    const parsed = createPatientSchema.parse(payload);
    const supabase = getSupabaseAdmin();
    const trimmedFullName = trimString(parsed.full_name);
    const contactEmail = normalizeOptionalEmail(parsed.contact_email);
    const portalPassword = typeof parsed.portal_password === "string" ? parsed.portal_password.trim() : undefined;

    const createPayload: PatientInsert = {
      full_name: trimmedFullName,
      user_id: parsed.user_id ?? null,
      date_of_birth: parsed.date_of_birth ?? null,
      sex: parsed.sex ?? null,
      nationality: trimOptionalString(parsed.nationality),
      contact_email: contactEmail,
      contact_phone: trimOptionalString(parsed.contact_phone),
      preferred_language: trimOptionalString(parsed.preferred_language),
      preferred_currency: trimOptionalString(parsed.preferred_currency),
      notes: trimOptionalString(parsed.notes),
      email_verified: parsed.email_verified ?? false,
    };

    let effectiveEmailVerified = createPayload.email_verified;
    let portalAccount: { userId: string; createdNew: boolean } | null = null;

    if (portalPassword) {
      if (!contactEmail) {
        throw new ApiError(400, "Provide a patient email address to deliver the portal password.");
      }

      if (parsed.user_id) {
        const { error: updateError } = await supabase.auth.admin.updateUserById(parsed.user_id, {
          password: portalPassword,
          email: contactEmail,
          email_confirm: true,
          user_metadata: { full_name: trimmedFullName },
        });

        if (updateError) {
          throw new ApiError(500, "Failed to update the linked portal user account.", updateError.message);
        }

        portalAccount = { userId: parsed.user_id, createdNew: false };
        createPayload.user_id = parsed.user_id;
      } else {
        portalAccount = await createOrUpdatePortalAccount(supabase, {
          email: contactEmail,
          password: portalPassword,
          fullName: trimmedFullName,
          emailVerified: true,
        });
        createPayload.user_id = portalAccount.userId;
      }

      effectiveEmailVerified = true;
    }

    createPayload.email_verified = effectiveEmailVerified;

    let patient;
    try {
      patient = await patientService.create(createPayload);
    } catch (error) {
      if (portalAccount?.createdNew) {
        await supabase.auth.admin.deleteUser(portalAccount.userId).catch(() => {});
      }
      throw error;
    }

    if (portalPassword && contactEmail) {
      try {
        await sendPortalPasswordEmail(supabase, {
          email: contactEmail,
          fullName: trimmedFullName,
          password: portalPassword,
        });
      } catch (error) {
        if (portalAccount?.createdNew) {
          await supabase.auth.admin.deleteUser(portalAccount.userId).catch(() => {});
        }
        await patientService.remove(patient.id).catch(() => {});
        throw error;
      }
    }

    return patient;
  },

  async update(id: unknown, payload: unknown) {
    const patientId = patientIdSchema.parse(id);
    const parsed = updatePatientSchema.parse(payload);

    if (Object.keys(parsed).length === 0) {
      throw new ApiError(400, "No fields provided for update");
    }

    const supabase = getSupabaseAdmin();
    const existing = await patientService.getById(patientId);

    const updatePayload: PatientUpdate = {};

    const fullName =
      parsed.full_name !== undefined ? trimString(parsed.full_name) : trimString(existing.full_name);
    const parsedContactEmail =
      parsed.contact_email !== undefined ? normalizeOptionalEmail(parsed.contact_email) : undefined;
    const effectiveContactEmail =
      parsedContactEmail !== undefined ? parsedContactEmail : normalizeOptionalEmail(existing.contact_email);
    const portalPassword = typeof parsed.portal_password === "string" ? parsed.portal_password.trim() : undefined;

    if (parsed.full_name !== undefined) updatePayload.full_name = fullName;
    if (parsed.user_id !== undefined) updatePayload.user_id = parsed.user_id ?? null;
    if (parsed.date_of_birth !== undefined) updatePayload.date_of_birth = parsed.date_of_birth ?? null;
    if (parsed.sex !== undefined) updatePayload.sex = parsed.sex ?? null;
    if (parsed.nationality !== undefined) updatePayload.nationality = trimOptionalString(parsed.nationality);
    if (parsed.contact_email !== undefined) updatePayload.contact_email = parsedContactEmail ?? null;
    if (parsed.contact_phone !== undefined) updatePayload.contact_phone = trimOptionalString(parsed.contact_phone);
    if (parsed.preferred_language !== undefined)
      updatePayload.preferred_language = trimOptionalString(parsed.preferred_language);
    if (parsed.preferred_currency !== undefined)
      updatePayload.preferred_currency = trimOptionalString(parsed.preferred_currency);
    if (parsed.notes !== undefined) updatePayload.notes = trimOptionalString(parsed.notes);

    let effectiveEmailVerified =
      parsed.email_verified !== undefined ? parsed.email_verified : existing.email_verified ?? false;
    let portalAccount: { userId: string; createdNew: boolean } | null = null;

    if (portalPassword) {
      if (!effectiveContactEmail) {
        throw new ApiError(400, "Provide a patient email address to deliver the portal password.");
      }

      const targetUserId = parsed.user_id ?? existing.user_id ?? null;

      if (targetUserId) {
        const { error: updateError } = await supabase.auth.admin.updateUserById(targetUserId, {
          password: portalPassword,
          email: effectiveContactEmail,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        });

        if (updateError) {
          throw new ApiError(500, "Failed to update the linked portal user account.", updateError.message);
        }

        portalAccount = { userId: targetUserId, createdNew: false };
        updatePayload.user_id = targetUserId;
      } else {
        portalAccount = await createOrUpdatePortalAccount(supabase, {
          email: effectiveContactEmail,
          password: portalPassword,
          fullName,
          emailVerified: true,
        });
        updatePayload.user_id = portalAccount.userId;
      }

      effectiveEmailVerified = true;
    }

    updatePayload.email_verified = effectiveEmailVerified;

    const updated = await patientService.update(patientId, updatePayload);

    if (portalPassword && effectiveContactEmail) {
      try {
        await sendPortalPasswordEmail(supabase, {
          email: effectiveContactEmail,
          fullName,
          password: portalPassword,
        });
      } catch (error) {
        if (portalAccount?.createdNew) {
          await supabase.auth.admin.deleteUser(portalAccount.userId).catch(() => {});
          await patientService
            .update(patientId, {
              user_id: existing.user_id ?? null,
              email_verified: existing.email_verified ?? false,
            })
            .catch(() => {});
        }
        throw error;
      }
    }

    return updated;
  },

  async delete(id: unknown) {
    const patientId = patientIdSchema.parse(id);
    return patientService.remove(patientId);
  },
};
