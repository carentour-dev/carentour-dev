import { z } from "zod";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { ApiError } from "@/server/utils/errors";

const assignmentSchema = z.object({
  category: z.string().min(2),
  doctorIds: z.array(z.string().uuid()),
  primaryDoctorId: z.string().uuid().optional().nullable(),
});

export const doctorTreatmentsController = {
  async list(category: string) {
    const supabase = getSupabaseAdmin();

    const { data: doctors, error: doctorError } = await supabase
      .from("doctors")
      .select("id, name, title, specialization, is_active")
      .order("name", { ascending: true });

    if (doctorError) {
      throw new ApiError(500, "Failed to fetch doctors", doctorError.message);
    }

    const { data: assignments, error: assignmentError } = await supabase
      .from("doctor_treatments")
      .select("doctor_id, is_primary_specialist")
      .eq("treatment_category", category);

    if (assignmentError) {
      throw new ApiError(
        500,
        "Failed to fetch doctor assignments",
        assignmentError.message,
      );
    }

    const assignedMap = new Map(
      (assignments ?? []).map((entry) => [
        entry.doctor_id,
        entry.is_primary_specialist === true,
      ]),
    );

    return (doctors ?? []).map((doctor) => ({
      id: doctor.id,
      name: doctor.name,
      title: doctor.title,
      specialization: doctor.specialization,
      isActive: doctor.is_active !== false,
      isAssigned: assignedMap.has(doctor.id),
      isPrimary: assignedMap.get(doctor.id) === true,
    }));
  },

  async setAssignments(payload: unknown) {
    const { category, doctorIds, primaryDoctorId } =
      assignmentSchema.parse(payload);

    const supabase = getSupabaseAdmin();

    const { error: deleteError } = await supabase
      .from("doctor_treatments")
      .delete()
      .eq("treatment_category", category);

    if (deleteError) {
      throw new ApiError(
        500,
        "Failed to reset doctor assignments",
        deleteError.message,
      );
    }

    if (doctorIds.length === 0) {
      return { success: true, count: 0 };
    }

    const rows = doctorIds.map((doctorId) => ({
      doctor_id: doctorId,
      treatment_category: category,
      is_primary_specialist: primaryDoctorId === doctorId,
    }));

    const { error: insertError } = await supabase
      .from("doctor_treatments")
      .insert(rows);

    if (insertError) {
      throw new ApiError(500, "Failed to assign doctors", insertError.message);
    }

    return { success: true, count: rows.length };
  },
};
