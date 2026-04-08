import type { Database } from "@/integrations/supabase/types";

export type PublicDoctor = Database["public"]["Tables"]["doctors"]["Row"];
export type LocalizedPublicDoctor = PublicDoctor;
type DoctorClientSource = Pick<
  LocalizedPublicDoctor,
  | "id"
  | "name"
  | "title"
  | "specialization"
  | "bio"
  | "experience_years"
  | "education"
  | "languages"
  | "avatar_url"
  | "achievements"
  | "certifications"
  | "research_publications"
  | "successful_procedures"
  | "patient_rating"
  | "total_reviews"
>;
export type ClientDoctor = {
  id: string;
  name: string;
  title: string;
  specialization: string;
  bio?: string;
  experience_years: number;
  education: string;
  languages: string[];
  avatar_url?: string;
  achievements: string[];
  certifications: string[];
  research_publications: number;
  successful_procedures: number;
  patient_rating: number;
  total_reviews: number;
};

export type DoctorDirectoryFilters = {
  search?: string;
  specialty?: string;
  language?: string;
  limit?: number;
};

export type DoctorDirectoryFilterMeta = {
  specialties: string[];
  languages: string[];
};

export type DoctorDirectoryResponse<TDoctor = LocalizedPublicDoctor> = {
  doctors: TDoctor[];
  filters: DoctorDirectoryFilterMeta;
};

const normalizeCaseInsensitive = (value: string | null | undefined) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const normalizeTrimmed = (value: string | null | undefined) =>
  typeof value === "string" ? value.trim() : "";

export function getDoctorInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export function pickDoctorImage(doctor: { avatar_url?: string | null }) {
  return doctor.avatar_url ?? null;
}

export function normalizeDoctorForClient(
  doctor: DoctorClientSource,
): ClientDoctor {
  return {
    id: doctor.id,
    name: doctor.name,
    title: doctor.title,
    specialization: doctor.specialization,
    bio: doctor.bio ?? undefined,
    experience_years: doctor.experience_years,
    education: doctor.education,
    languages: doctor.languages ?? [],
    avatar_url: doctor.avatar_url ?? undefined,
    achievements: doctor.achievements ?? [],
    certifications: doctor.certifications ?? [],
    research_publications: doctor.research_publications ?? 0,
    successful_procedures: doctor.successful_procedures ?? 0,
    patient_rating: doctor.patient_rating ?? 0,
    total_reviews: doctor.total_reviews ?? 0,
  };
}

export function buildDoctorDirectoryState<
  TDoctor extends {
    name: string;
    specialization: string;
    languages: string[] | null | undefined;
  },
>(input: {
  doctors: TDoctor[];
  filters?: DoctorDirectoryFilters;
}): DoctorDirectoryResponse<TDoctor> {
  const filters = input.filters ?? {};
  const specialtyFilter = normalizeTrimmed(filters.specialty);
  const languageFilter = normalizeTrimmed(filters.language);
  const searchTerm = normalizeCaseInsensitive(filters.search);

  const specialties = new Set<string>();
  const languages = new Set<string>();

  input.doctors.forEach((doctor) => {
    if (doctor.specialization.trim()) {
      specialties.add(doctor.specialization.trim());
    }

    (doctor.languages ?? []).forEach((language) => {
      if (language.trim()) {
        languages.add(language.trim());
      }
    });
  });

  let doctors = input.doctors.filter((doctor) => {
    if (specialtyFilter && doctor.specialization !== specialtyFilter) {
      return false;
    }

    if (languageFilter && !(doctor.languages ?? []).includes(languageFilter)) {
      return false;
    }

    if (!searchTerm) {
      return true;
    }

    return (
      normalizeCaseInsensitive(doctor.name).includes(searchTerm) ||
      normalizeCaseInsensitive(doctor.specialization).includes(searchTerm)
    );
  });

  if (typeof filters.limit === "number" && filters.limit > 0) {
    doctors = doctors.slice(0, filters.limit);
  }

  return {
    doctors,
    filters: {
      specialties: Array.from(specialties).sort((a, b) => a.localeCompare(b)),
      languages: Array.from(languages).sort((a, b) => a.localeCompare(b)),
    },
  };
}
