export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      contact_requests: {
        Row: {
          additional_questions: string | null;
          assigned_to: string | null;
          budget_range: string | null;
          companions: string | null;
          contact_preference: string | null;
          country: string | null;
          created_at: string;
          destination: string | null;
          email: string;
          first_name: string;
          health_background: string | null;
          id: string;
          last_name: string;
          message: string;
          medical_reports: string | null;
          notes: string | null;
          origin: string;
          patient_id: string | null;
          phone: string | null;
          portal_metadata: Json | null;
          request_type: string;
          resolved_at: string | null;
          status: Database["public"]["Enums"]["contact_request_status"];
          treatment: string | null;
          travel_window: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          additional_questions?: string | null;
          assigned_to?: string | null;
          budget_range?: string | null;
          companions?: string | null;
          contact_preference?: string | null;
          country?: string | null;
          created_at?: string;
          destination?: string | null;
          email: string;
          first_name: string;
          health_background?: string | null;
          id?: string;
          last_name: string;
          message: string;
          medical_reports?: string | null;
          notes?: string | null;
          origin?: string;
          patient_id?: string | null;
          phone?: string | null;
          portal_metadata?: Json | null;
          request_type?: string;
          resolved_at?: string | null;
          status?: Database["public"]["Enums"]["contact_request_status"];
          treatment?: string | null;
          travel_window?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          additional_questions?: string | null;
          assigned_to?: string | null;
          budget_range?: string | null;
          companions?: string | null;
          contact_preference?: string | null;
          country?: string | null;
          created_at?: string;
          destination?: string | null;
          email?: string;
          first_name?: string;
          health_background?: string | null;
          id?: string;
          last_name?: string;
          message?: string;
          medical_reports?: string | null;
          notes?: string | null;
          origin?: string;
          patient_id?: string | null;
          phone?: string | null;
          portal_metadata?: Json | null;
          request_type?: string;
          resolved_at?: string | null;
          status?: Database["public"]["Enums"]["contact_request_status"];
          treatment?: string | null;
          travel_window?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "contact_requests_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contact_requests_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ];
      };
      doctor_reviews: {
        Row: {
          created_at: string;
          doctor_id: string;
          id: string;
          is_verified: boolean | null;
          patient_id: string | null;
          treatment_id: string;
          locale: string | null;
          published: boolean | null;
          highlight: boolean | null;
          display_order: number | null;
          media: Json | null;
          patient_country: string | null;
          patient_name: string;
          procedure_name: string | null;
          rating: number;
          recovery_time: string | null;
          review_text: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          doctor_id: string;
          id?: string;
          is_verified?: boolean | null;
          patient_id?: string | null;
          treatment_id: string;
          locale?: string | null;
          published?: boolean | null;
          highlight?: boolean | null;
          display_order?: number | null;
          media?: Json | null;
          patient_country?: string | null;
          patient_name: string;
          procedure_name?: string | null;
          rating: number;
          recovery_time?: string | null;
          review_text: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          doctor_id?: string;
          id?: string;
          is_verified?: boolean | null;
          patient_id?: string | null;
          treatment_id?: string;
          locale?: string | null;
          published?: boolean | null;
          highlight?: boolean | null;
          display_order?: number | null;
          media?: Json | null;
          patient_country?: string | null;
          patient_name?: string;
          procedure_name?: string | null;
          rating?: number;
          recovery_time?: string | null;
          review_text?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "doctor_reviews_doctor_id_fkey";
            columns: ["doctor_id"];
            isOneToOne: false;
            referencedRelation: "doctors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "doctor_reviews_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "doctor_reviews_treatment_id_fkey";
            columns: ["treatment_id"];
            isOneToOne: false;
            referencedRelation: "treatments";
            referencedColumns: ["id"];
          },
        ];
      };
      patients: {
        Row: {
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string;
          date_of_birth: string | null;
          home_city: string | null;
          travel_year: number | null;
          has_testimonial: boolean | null;
          email_verified: boolean | null;
          full_name: string;
          id: string;
          nationality: string | null;
          notes: string | null;
          preferred_currency: string | null;
          preferred_language: string | null;
          sex: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          home_city?: string | null;
          travel_year?: number | null;
          has_testimonial?: boolean | null;
          email_verified?: boolean | null;
          full_name: string;
          id?: string;
          nationality?: string | null;
          notes?: string | null;
          preferred_currency?: string | null;
          preferred_language?: string | null;
          sex?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          home_city?: string | null;
          travel_year?: number | null;
          has_testimonial?: boolean | null;
          email_verified?: boolean | null;
          full_name?: string;
          id?: string;
          nationality?: string | null;
          notes?: string | null;
          preferred_currency?: string | null;
          preferred_language?: string | null;
          sex?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      patient_consultations: {
        Row: {
          contact_request_id: string | null;
          coordinator_id: string | null;
          created_at: string;
          doctor_id: string | null;
          duration_minutes: number | null;
          id: string;
          location: string | null;
          meeting_url: string | null;
          notes: string | null;
          patient_id: string;
          scheduled_at: string;
          status: Database["public"]["Enums"]["consultation_status"];
          timezone: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          contact_request_id?: string | null;
          coordinator_id?: string | null;
          created_at?: string;
          doctor_id?: string | null;
          duration_minutes?: number | null;
          id?: string;
          location?: string | null;
          meeting_url?: string | null;
          notes?: string | null;
          patient_id: string;
          scheduled_at: string;
          status?: Database["public"]["Enums"]["consultation_status"];
          timezone?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          contact_request_id?: string | null;
          coordinator_id?: string | null;
          created_at?: string;
          doctor_id?: string | null;
          duration_minutes?: number | null;
          id?: string;
          location?: string | null;
          meeting_url?: string | null;
          notes?: string | null;
          patient_id?: string;
          scheduled_at?: string;
          status?: Database["public"]["Enums"]["consultation_status"];
          timezone?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "patient_consultations_contact_request_id_fkey";
            columns: ["contact_request_id"];
            isOneToOne: false;
            referencedRelation: "contact_requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "patient_consultations_coordinator_id_fkey";
            columns: ["coordinator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "patient_consultations_doctor_id_fkey";
            columns: ["doctor_id"];
            isOneToOne: false;
            referencedRelation: "doctors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "patient_consultations_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ];
      };
      patient_appointments: {
        Row: {
          appointment_type: string;
          consultation_id: string | null;
          created_at: string;
          doctor_id: string | null;
          ends_at: string | null;
          facility_id: string | null;
          id: string;
          location: string | null;
          notes: string | null;
          patient_id: string;
          pre_visit_instructions: string | null;
          starts_at: string;
          status: Database["public"]["Enums"]["appointment_status"];
          timezone: string | null;
          title: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          appointment_type: string;
          consultation_id?: string | null;
          created_at?: string;
          doctor_id?: string | null;
          ends_at?: string | null;
          facility_id?: string | null;
          id?: string;
          location?: string | null;
          notes?: string | null;
          patient_id: string;
          pre_visit_instructions?: string | null;
          starts_at: string;
          status?: Database["public"]["Enums"]["appointment_status"];
          timezone?: string | null;
          title: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          appointment_type?: string;
          consultation_id?: string | null;
          created_at?: string;
          doctor_id?: string | null;
          ends_at?: string | null;
          facility_id?: string | null;
          id?: string;
          location?: string | null;
          notes?: string | null;
          patient_id?: string;
          pre_visit_instructions?: string | null;
          starts_at?: string;
          status?: Database["public"]["Enums"]["appointment_status"];
          timezone?: string | null;
          title?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "patient_appointments_consultation_id_fkey";
            columns: ["consultation_id"];
            isOneToOne: false;
            referencedRelation: "patient_consultations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "patient_appointments_doctor_id_fkey";
            columns: ["doctor_id"];
            isOneToOne: false;
            referencedRelation: "doctors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "patient_appointments_facility_id_fkey";
            columns: ["facility_id"];
            isOneToOne: false;
            referencedRelation: "service_providers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "patient_appointments_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ];
      };
      doctor_specialties: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      doctor_treatments: {
        Row: {
          created_at: string;
          doctor_id: string;
          id: string;
          is_primary_specialist: boolean | null;
          treatment_category: string;
        };
        Insert: {
          created_at?: string;
          doctor_id: string;
          id?: string;
          is_primary_specialist?: boolean | null;
          treatment_category: string;
        };
        Update: {
          created_at?: string;
          doctor_id?: string;
          id?: string;
          is_primary_specialist?: boolean | null;
          treatment_category?: string;
        };
        Relationships: [
          {
            foreignKeyName: "doctor_treatments_doctor_id_fkey";
            columns: ["doctor_id"];
            isOneToOne: false;
            referencedRelation: "doctors";
            referencedColumns: ["id"];
          },
        ];
      };
      patient_stories: {
        Row: {
          body_markdown: string;
          created_at: string;
          display_order: number | null;
          doctor_id: string | null;
          featured: boolean | null;
          headline: string;
          hero_image: string | null;
          id: string;
          locale: string | null;
          media: Json | null;
          outcome_summary: Json | null;
          patient_id: string | null;
          published: boolean | null;
          treatment_id: string;
          excerpt: string | null;
          updated_at: string;
        };
        Insert: {
          body_markdown: string;
          created_at?: string;
          display_order?: number | null;
          doctor_id?: string | null;
          featured?: boolean | null;
          headline: string;
          hero_image?: string | null;
          id?: string;
          locale?: string | null;
          media?: Json | null;
          outcome_summary?: Json | null;
          patient_id?: string | null;
          published?: boolean | null;
          treatment_id: string;
          excerpt?: string | null;
          updated_at?: string;
        };
        Update: {
          body_markdown?: string;
          created_at?: string;
          display_order?: number | null;
          doctor_id?: string | null;
          featured?: boolean | null;
          headline?: string;
          hero_image?: string | null;
          id?: string;
          locale?: string | null;
          media?: Json | null;
          outcome_summary?: Json | null;
          patient_id?: string | null;
          published?: boolean | null;
          treatment_id?: string;
          excerpt?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "patient_stories_doctor_id_fkey";
            columns: ["doctor_id"];
            isOneToOne: false;
            referencedRelation: "doctors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "patient_stories_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "patient_stories_treatment_id_fkey";
            columns: ["treatment_id"];
            isOneToOne: false;
            referencedRelation: "treatments";
            referencedColumns: ["id"];
          },
        ];
      };
      treatment_procedures: {
        Row: {
          candidate_requirements: string[] | null;
          created_at: string;
          description: string | null;
          display_order: number;
          egypt_price: number | null;
          id: string;
          international_prices: Json | null;
          name: string;
          price: string | null;
          recovery: string | null;
          recovery_stages: Json | null;
          success_rate: string | null;
          treatment_id: string;
          duration: string | null;
          updated_at: string;
        };
        Insert: {
          candidate_requirements?: string[] | null;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          egypt_price?: number | null;
          id?: string;
          international_prices?: Json | null;
          name: string;
          price?: string | null;
          recovery?: string | null;
          recovery_stages?: Json | null;
          success_rate?: string | null;
          treatment_id: string;
          duration?: string | null;
          updated_at?: string;
        };
        Update: {
          candidate_requirements?: string[] | null;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          egypt_price?: number | null;
          id?: string;
          international_prices?: Json | null;
          name?: string;
          price?: string | null;
          recovery?: string | null;
          recovery_stages?: Json | null;
          success_rate?: string | null;
          treatment_id?: string;
          duration?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "treatment_procedures_treatment_id_fkey";
            columns: ["treatment_id"];
            isOneToOne: false;
            referencedRelation: "treatments";
            referencedColumns: ["id"];
          },
        ];
      };
      treatments: {
        Row: {
          base_price: number | null;
          category: string | null;
          created_at: string;
          currency: string | null;
          description: string | null;
          ideal_candidates: string[] | null;
          duration_days: number | null;
          id: string;
          is_featured: boolean;
          is_active: boolean | null;
          name: string;
          overview: string | null;
          recovery_time_days: number | null;
          slug: string;
          success_rate: number | null;
          summary: string | null;
          updated_at: string;
        };
        Insert: {
          base_price?: number | null;
          category?: string | null;
          created_at?: string;
          currency?: string | null;
          description?: string | null;
          ideal_candidates?: string[] | null;
          duration_days?: number | null;
          id?: string;
          is_featured?: boolean;
          is_active?: boolean | null;
          name: string;
          overview?: string | null;
          recovery_time_days?: number | null;
          slug: string;
          success_rate?: number | null;
          summary?: string | null;
          updated_at?: string;
        };
        Update: {
          base_price?: number | null;
          category?: string | null;
          created_at?: string;
          currency?: string | null;
          description?: string | null;
          ideal_candidates?: string[] | null;
          duration_days?: number | null;
          id?: string;
          is_featured?: boolean;
          is_active?: boolean | null;
          name?: string;
          overview?: string | null;
          recovery_time_days?: number | null;
          slug?: string;
          success_rate?: number | null;
          summary?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      service_providers: {
        Row: {
          amenities: string[] | null;
          contact_info: Json | null;
          coordinates: Json | null;
          created_at: string;
          description: string | null;
          facility_type: string;
          id: string;
          images: Json | null;
          is_partner: boolean | null;
          name: string;
          rating: number | null;
          review_count: number | null;
          slug: string;
          specialties: string[] | null;
          updated_at: string;
          address: Json | null;
        };
        Insert: {
          amenities?: string[] | null;
          contact_info?: Json | null;
          coordinates?: Json | null;
          created_at?: string;
          description?: string | null;
          facility_type: string;
          id?: string;
          images?: Json | null;
          is_partner?: boolean | null;
          name: string;
          rating?: number | null;
          review_count?: number | null;
          slug: string;
          specialties?: string[] | null;
          updated_at?: string;
          address?: Json | null;
        };
        Update: {
          amenities?: string[] | null;
          contact_info?: Json | null;
          coordinates?: Json | null;
          created_at?: string;
          description?: string | null;
          facility_type?: string;
          id?: string;
          images?: Json | null;
          is_partner?: boolean | null;
          name?: string;
          rating?: number | null;
          review_count?: number | null;
          slug?: string;
          specialties?: string[] | null;
          updated_at?: string;
          address?: Json | null;
        };
        Relationships: [];
      };
      hotels: {
        Row: {
          amenities: string[] | null;
          contact_info: Json | null;
          coordinates: Json | null;
          created_at: string;
          description: string | null;
          distance_to_facility_km: number | null;
          id: string;
          images: Json | null;
          is_partner: boolean | null;
          medical_services: string[] | null;
          name: string;
          nightly_rate: number | null;
          rating: number | null;
          review_count: number | null;
          slug: string;
          star_rating: number;
          updated_at: string;
          address: Json | null;
          currency: string | null;
        };
        Insert: {
          amenities?: string[] | null;
          contact_info?: Json | null;
          coordinates?: Json | null;
          created_at?: string;
          description?: string | null;
          distance_to_facility_km?: number | null;
          id?: string;
          images?: Json | null;
          is_partner?: boolean | null;
          medical_services?: string[] | null;
          name: string;
          nightly_rate?: number | null;
          rating?: number | null;
          review_count?: number | null;
          slug: string;
          star_rating: number;
          updated_at?: string;
          address?: Json | null;
          currency?: string | null;
        };
        Update: {
          amenities?: string[] | null;
          contact_info?: Json | null;
          coordinates?: Json | null;
          created_at?: string;
          description?: string | null;
          distance_to_facility_km?: number | null;
          id?: string;
          images?: Json | null;
          is_partner?: boolean | null;
          medical_services?: string[] | null;
          name?: string;
          nightly_rate?: number | null;
          rating?: number | null;
          review_count?: number | null;
          slug?: string;
          star_rating?: number;
          updated_at?: string;
          address?: Json | null;
          currency?: string | null;
        };
        Relationships: [];
      };
      doctors: {
        Row: {
          achievements: string[] | null;
          avatar_url: string | null;
          bio: string | null;
          certifications: string[] | null;
          created_at: string;
          education: string;
          experience_years: number;
          id: string;
          is_active: boolean | null;
          languages: string[] | null;
          name: string;
          patient_rating: number | null;
          research_publications: number | null;
          specialization: string;
          successful_procedures: number | null;
          title: string;
          total_reviews: number | null;
          updated_at: string;
        };
        Insert: {
          achievements?: string[] | null;
          avatar_url?: string | null;
          bio?: string | null;
          certifications?: string[] | null;
          created_at?: string;
          education: string;
          experience_years: number;
          id?: string;
          is_active?: boolean | null;
          languages?: string[] | null;
          name: string;
          patient_rating?: number | null;
          research_publications?: number | null;
          specialization: string;
          successful_procedures?: number | null;
          title: string;
          total_reviews?: number | null;
          updated_at?: string;
        };
        Update: {
          achievements?: string[] | null;
          avatar_url?: string | null;
          bio?: string | null;
          certifications?: string[] | null;
          created_at?: string;
          education?: string;
          experience_years?: number;
          id?: string;
          is_active?: boolean | null;
          languages?: string[] | null;
          name?: string;
          patient_rating?: number | null;
          research_publications?: number | null;
          specialization?: string;
          successful_procedures?: number | null;
          title?: string;
          total_reviews?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      login_attempts: {
        Row: {
          created_at: string | null;
          email: string | null;
          id: string;
          ip_address: unknown;
          success: boolean;
        };
        Insert: {
          created_at?: string | null;
          email?: string | null;
          id?: string;
          ip_address: unknown;
          success?: boolean;
        };
        Update: {
          created_at?: string | null;
          email?: string | null;
          id?: string;
          ip_address?: unknown;
          success?: boolean;
        };
        Relationships: [];
      };
      newsletter_subscriptions: {
        Row: {
          confirmed_at: string | null;
          created_at: string;
          email: string;
          id: string;
          ip_address: unknown | null;
          preferences: Json | null;
          status: Database["public"]["Enums"]["subscription_status"];
          subscribed_at: string;
          subscription_source: string | null;
          unsubscribe_token: string;
          unsubscribed_at: string | null;
          updated_at: string;
          user_agent: string | null;
        };
        Insert: {
          confirmed_at?: string | null;
          created_at?: string;
          email: string;
          id?: string;
          ip_address?: unknown | null;
          preferences?: Json | null;
          status?: Database["public"]["Enums"]["subscription_status"];
          subscribed_at?: string;
          subscription_source?: string | null;
          unsubscribe_token?: string;
          unsubscribed_at?: string | null;
          updated_at?: string;
          user_agent?: string | null;
        };
        Update: {
          confirmed_at?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          ip_address?: unknown | null;
          preferences?: Json | null;
          status?: Database["public"]["Enums"]["subscription_status"];
          subscribed_at?: string;
          subscription_source?: string | null;
          unsubscribe_token?: string;
          unsubscribed_at?: string | null;
          updated_at?: string;
          user_agent?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          date_of_birth: string | null;
          created_at: string;
          email: string | null;
          id: string;
          nationality: string | null;
          phone: string | null;
          sex: string | null;
          updated_at: string;
          user_id: string;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          date_of_birth?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          nationality?: string | null;
          phone?: string | null;
          sex?: string | null;
          updated_at?: string;
          user_id: string;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          date_of_birth?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          nationality?: string | null;
          phone?: string | null;
          sex?: string | null;
          updated_at?: string;
          user_id?: string;
          username?: string | null;
        };
        Relationships: [];
      };
      profile_roles: {
        Row: {
          assigned_at: string;
          assigned_by: string | null;
          id: string;
          profile_id: string;
          role_id: string;
        };
        Insert: {
          assigned_at?: string;
          assigned_by?: string | null;
          id?: string;
          profile_id: string;
          role_id: string;
        };
        Update: {
          assigned_at?: string;
          assigned_by?: string | null;
          id?: string;
          profile_id?: string;
          role_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profile_roles_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_roles_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      role_permissions: {
        Row: {
          created_at: string;
          id: string;
          permission_id: string;
          role_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          permission_id: string;
          role_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          permission_id?: string;
          role_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey";
            columns: ["permission_id"];
            isOneToOne: false;
            referencedRelation: "permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      roles: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_superuser: boolean;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_superuser?: boolean;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_superuser?: boolean;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      permissions: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      security_audit_log: {
        Row: {
          created_at: string | null;
          details: string | null;
          event_type: string;
          id: string;
          table_name: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          details?: string | null;
          event_type: string;
          id?: string;
          table_name: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          details?: string | null;
          event_type?: string;
          id?: string;
          table_name?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      security_events: {
        Row: {
          created_at: string | null;
          event_data: Json | null;
          event_type: string;
          id: string;
          ip_address: unknown | null;
          risk_level: string | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          event_data?: Json | null;
          event_type: string;
          id?: string;
          ip_address?: unknown | null;
          risk_level?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          event_data?: Json | null;
          event_type?: string;
          id?: string;
          ip_address?: unknown | null;
          risk_level?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      trip_plan_accommodations: {
        Row: {
          amenities: string[] | null;
          available_from: string | null;
          available_to: string | null;
          created_at: string;
          distance_to_hospital_km: number | null;
          id: string;
          images: Json | null;
          is_active: boolean | null;
          location: Json | null;
          name: string;
          price_per_night: number;
          special_medical_features: string[] | null;
          star_rating: number | null;
          type: string;
        };
        Insert: {
          amenities?: string[] | null;
          available_from?: string | null;
          available_to?: string | null;
          created_at?: string;
          distance_to_hospital_km?: number | null;
          id?: string;
          images?: Json | null;
          is_active?: boolean | null;
          location?: Json | null;
          name: string;
          price_per_night: number;
          special_medical_features?: string[] | null;
          star_rating?: number | null;
          type: string;
        };
        Update: {
          amenities?: string[] | null;
          available_from?: string | null;
          available_to?: string | null;
          created_at?: string;
          distance_to_hospital_km?: number | null;
          id?: string;
          images?: Json | null;
          is_active?: boolean | null;
          location?: Json | null;
          name?: string;
          price_per_night?: number;
          special_medical_features?: string[] | null;
          star_rating?: number | null;
          type?: string;
        };
        Relationships: [];
      };
      trip_plan_bookings: {
        Row: {
          accommodation_id: string | null;
          booking_reference: string | null;
          booking_status: string | null;
          check_in_date: string;
          check_out_date: string;
          created_at: string;
          guest_count: number;
          id: string;
          special_requests: string | null;
          total_cost: number;
          trip_plan_id: string;
          updated_at: string;
        };
        Insert: {
          accommodation_id?: string | null;
          booking_reference?: string | null;
          booking_status?: string | null;
          check_in_date: string;
          check_out_date: string;
          created_at?: string;
          guest_count: number;
          id?: string;
          special_requests?: string | null;
          total_cost: number;
          trip_plan_id: string;
          updated_at?: string;
        };
        Update: {
          accommodation_id?: string | null;
          booking_reference?: string | null;
          booking_status?: string | null;
          check_in_date?: string;
          check_out_date?: string;
          created_at?: string;
          guest_count?: number;
          id?: string;
          special_requests?: string | null;
          total_cost?: number;
          trip_plan_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trip_plan_bookings_accommodation_id_fkey";
            columns: ["accommodation_id"];
            isOneToOne: false;
            referencedRelation: "trip_plan_accommodations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trip_plan_bookings_trip_plan_id_fkey";
            columns: ["trip_plan_id"];
            isOneToOne: false;
            referencedRelation: "trip_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      trip_plans: {
        Row: {
          accommodation_preferences: Json | null;
          budget_range: Json | null;
          companion_count: number | null;
          created_at: string;
          cultural_interests: string[] | null;
          current_step: number | null;
          id: string;
          preferred_travel_dates: Json | null;
          recovery_timeline: number | null;
          special_requirements: string[] | null;
          status: string | null;
          total_estimated_cost: number | null;
          transportation_preferences: Json | null;
          travel_insurance_needed: boolean | null;
          treatment_type: string;
          updated_at: string;
          user_id: string | null;
          visa_assistance_needed: boolean | null;
        };
        Insert: {
          accommodation_preferences?: Json | null;
          budget_range?: Json | null;
          companion_count?: number | null;
          created_at?: string;
          cultural_interests?: string[] | null;
          current_step?: number | null;
          id?: string;
          preferred_travel_dates?: Json | null;
          recovery_timeline?: number | null;
          special_requirements?: string[] | null;
          status?: string | null;
          total_estimated_cost?: number | null;
          transportation_preferences?: Json | null;
          travel_insurance_needed?: boolean | null;
          treatment_type: string;
          updated_at?: string;
          user_id?: string | null;
          visa_assistance_needed?: boolean | null;
        };
        Update: {
          accommodation_preferences?: Json | null;
          budget_range?: Json | null;
          companion_count?: number | null;
          created_at?: string;
          cultural_interests?: string[] | null;
          current_step?: number | null;
          id?: string;
          preferred_travel_dates?: Json | null;
          recovery_timeline?: number | null;
          special_requirements?: string[] | null;
          status?: string | null;
          total_estimated_cost?: number | null;
          transportation_preferences?: Json | null;
          travel_insurance_needed?: boolean | null;
          treatment_type?: string;
          updated_at?: string;
          user_id?: string | null;
          visa_assistance_needed?: boolean | null;
        };
        Relationships: [];
      };
      cms_pages: {
        Row: {
          id: string;
          slug: string;
          title: string;
          status: string;
          seo: Json | null;
          content: Json;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          status?: string;
          seo?: Json | null;
          content?: Json;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          status?: string;
          seo?: Json | null;
          content?: Json;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      navigation_links: {
        Row: {
          id: string;
          label: string;
          slug: string;
          href: string;
          status: "published" | "hidden";
          position: number;
          kind: "system" | "cms" | "manual";
          cms_page_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          label: string;
          slug: string;
          href: string;
          status?: "published" | "hidden";
          position?: number;
          kind?: "system" | "cms" | "manual";
          cms_page_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          label?: string;
          slug?: string;
          href?: string;
          status?: "published" | "hidden";
          position?: number;
          kind?: "system" | "cms" | "manual";
          cms_page_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "navigation_links_cms_page_id_fkey";
            columns: ["cms_page_id"];
            isOneToOne: false;
            referencedRelation: "cms_pages";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      patient_testimonial_public: {
        Row: {
          created_at: string;
          full_name: string;
          has_testimonial: boolean | null;
          home_city: string | null;
          nationality: string | null;
          patient_id: string;
          published_review_count: number;
          published_story_count: number;
          reviews: Json;
          stories: Json;
          travel_year: number | null;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      patient_testimonial_rollup: {
        Row: {
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string;
          date_of_birth: string | null;
          full_name: string;
          has_testimonial: boolean | null;
          home_city: string | null;
          nationality: string | null;
          notes: string | null;
          patient_id: string;
          preferred_currency: string | null;
          preferred_language: string | null;
          published_review_count: number;
          published_story_count: number;
          reviews: Json;
          sex: string | null;
          stories: Json;
          total_review_count: number;
          total_story_count: number;
          travel_year: number | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      treatment_metadata: {
        Row: {
          grade: Database["public"]["Enums"]["treatment_grade"];
          treatment_id: string;
          updated_at: string;
        };
        Insert: {
          grade?: Database["public"]["Enums"]["treatment_grade"];
          treatment_id: string;
          updated_at?: string;
        };
        Update: {
          grade?: Database["public"]["Enums"]["treatment_grade"];
          treatment_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "treatment_metadata_treatment_id_fkey";
            columns: ["treatment_id"];
            isOneToOne: true;
            referencedRelation: "treatments";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      check_email_exists: {
        Args: { p_email: string };
        Returns: boolean;
      };
      check_login_rate_limit: {
        Args: { p_email?: string; p_ip_address: unknown };
        Returns: Json;
      };
      cleanup_old_login_attempts: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      generate_anonymized_patient_name: {
        Args: { review_id: string };
        Returns: string;
      };
      get_user_display_name: {
        Args: { user_id: string };
        Returns: string;
      };
      get_patient_testimonial: {
        Args: { p_patient_id: string };
        Returns:
          | Database["public"]["Views"]["patient_testimonial_public"]["Row"]
          | null;
      };
      log_security_event: {
        Args: {
          p_event_data?: Json;
          p_event_type: string;
          p_ip_address?: unknown;
          p_risk_level?: string;
          p_user_agent?: string;
          p_user_id?: string;
        };
        Returns: string;
      };
      record_login_attempt: {
        Args: { p_email: string; p_ip_address: unknown; p_success: boolean };
        Returns: undefined;
      };
      current_user_has_permission: {
        Args: { p_permission: string };
        Returns: boolean;
      };
      current_user_permissions: {
        Args: Record<PropertyKey, never>;
        Returns: string[];
      };
      current_user_roles: {
        Args: Record<PropertyKey, never>;
        Returns: string[];
      };
      has_any_role: {
        Args: { p_roles: string[]; p_user_id: string };
        Returns: boolean;
      };
      has_permission: {
        Args: { p_permission: string; p_user_id: string };
        Returns: boolean;
      };
      has_role: {
        Args: { p_role: string; p_user_id: string };
        Returns: boolean;
      };
      user_permissions: {
        Args: { p_user_id: string };
        Returns: string[];
      };
      user_roles: {
        Args: { p_user_id: string };
        Returns: string[];
      };
    };
    Enums: {
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "rescheduled";
      contact_request_status: "new" | "in_progress" | "resolved";
      consultation_status:
        | "scheduled"
        | "rescheduled"
        | "completed"
        | "cancelled"
        | "no_show";
      subscription_status: "pending" | "active" | "unsubscribed" | "bounced";
      treatment_grade: "grade_a" | "grade_b" | "grade_c";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      subscription_status: ["pending", "active", "unsubscribed", "bounced"],
      treatment_grade: ["grade_a", "grade_b", "grade_c"],
    },
  },
} as const;
