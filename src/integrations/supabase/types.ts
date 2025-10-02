export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      doctor_reviews: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          is_verified: boolean | null
          patient_country: string | null
          patient_name: string
          procedure_name: string | null
          rating: number
          recovery_time: string | null
          review_text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          is_verified?: boolean | null
          patient_country?: string | null
          patient_name: string
          procedure_name?: string | null
          rating: number
          recovery_time?: string | null
          review_text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          is_verified?: boolean | null
          patient_country?: string | null
          patient_name?: string
          procedure_name?: string | null
          rating?: number
          recovery_time?: string | null
          review_text?: string
          updated_at?: string
      }
      Relationships: [
        {
          foreignKeyName: "doctor_reviews_doctor_id_fkey"
          columns: ["doctor_id"]
          isOneToOne: false
          referencedRelation: "doctors"
          referencedColumns: ["id"]
        },
      ]
      }
      patients: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          date_of_birth: string | null
          full_name: string
          id: string
          nationality: string | null
          notes: string | null
          preferred_currency: string | null
          preferred_language: string | null
          sex: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name: string
          id?: string
          nationality?: string | null
          notes?: string | null
          preferred_currency?: string | null
          preferred_language?: string | null
          sex?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          id?: string
          nationality?: string | null
          notes?: string | null
          preferred_currency?: string | null
          preferred_language?: string | null
          sex?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      doctor_specialties: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      doctor_treatments: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          is_primary_specialist: boolean | null
          treatment_category: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          is_primary_specialist?: boolean | null
          treatment_category: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          is_primary_specialist?: boolean | null
          treatment_category?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_treatments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
          referencedColumns: ["id"]
          },
        ]
      }
      treatments: {
        Row: {
          base_price: number | null
          category: string | null
          created_at: string
          currency: string | null
          description: string | null
          duration_days: number | null
          id: string
          is_active: boolean | null
          name: string
          recovery_time_days: number | null
          slug: string
          success_rate: number | null
          summary: string | null
          updated_at: string
        }
        Insert: {
          base_price?: number | null
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          duration_days?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          recovery_time_days?: number | null
          slug: string
          success_rate?: number | null
          summary?: string | null
          updated_at?: string
        }
        Update: {
          base_price?: number | null
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          duration_days?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          recovery_time_days?: number | null
          slug?: string
          success_rate?: number | null
          summary?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      facilities: {
        Row: {
          amenities: string[] | null
          contact_info: Json | null
          coordinates: Json | null
          created_at: string
          description: string | null
          facility_type: string
          id: string
          images: Json | null
          is_partner: boolean | null
          name: string
          rating: number | null
          review_count: number | null
          slug: string
          specialties: string[] | null
          updated_at: string
          address: Json | null
        }
        Insert: {
          amenities?: string[] | null
          contact_info?: Json | null
          coordinates?: Json | null
          created_at?: string
          description?: string | null
          facility_type: string
          id?: string
          images?: Json | null
          is_partner?: boolean | null
          name: string
          rating?: number | null
          review_count?: number | null
          slug: string
          specialties?: string[] | null
          updated_at?: string
          address?: Json | null
        }
        Update: {
          amenities?: string[] | null
          contact_info?: Json | null
          coordinates?: Json | null
          created_at?: string
          description?: string | null
          facility_type?: string
          id?: string
          images?: Json | null
          is_partner?: boolean | null
          name?: string
          rating?: number | null
          review_count?: number | null
          slug?: string
          specialties?: string[] | null
          updated_at?: string
          address?: Json | null
        }
        Relationships: []
      }
      hotels: {
        Row: {
          amenities: string[] | null
          contact_info: Json | null
          coordinates: Json | null
          created_at: string
          description: string | null
          distance_to_facility_km: number | null
          id: string
          images: Json | null
          is_partner: boolean | null
          medical_services: string[] | null
          name: string
          nightly_rate: number | null
          rating: number | null
          review_count: number | null
          slug: string
          star_rating: number
          updated_at: string
          address: Json | null
          currency: string | null
        }
        Insert: {
          amenities?: string[] | null
          contact_info?: Json | null
          coordinates?: Json | null
          created_at?: string
          description?: string | null
          distance_to_facility_km?: number | null
          id?: string
          images?: Json | null
          is_partner?: boolean | null
          medical_services?: string[] | null
          name: string
          nightly_rate?: number | null
          rating?: number | null
          review_count?: number | null
          slug: string
          star_rating: number
          updated_at?: string
          address?: Json | null
          currency?: string | null
        }
        Update: {
          amenities?: string[] | null
          contact_info?: Json | null
          coordinates?: Json | null
          created_at?: string
          description?: string | null
          distance_to_facility_km?: number | null
          id?: string
          images?: Json | null
          is_partner?: boolean | null
          medical_services?: string[] | null
          name?: string
          nightly_rate?: number | null
          rating?: number | null
          review_count?: number | null
          slug?: string
          star_rating?: number
          updated_at?: string
          address?: Json | null
          currency?: string | null
        }
        Relationships: []
      }
      doctors: {
        Row: {
          achievements: string[] | null
          avatar_url: string | null
          bio: string | null
          certifications: string[] | null
          created_at: string
          education: string
          experience_years: number
          id: string
          is_active: boolean | null
          languages: string[] | null
          name: string
          patient_rating: number | null
          research_publications: number | null
          specialization: string
          successful_procedures: number | null
          title: string
          total_reviews: number | null
          updated_at: string
        }
        Insert: {
          achievements?: string[] | null
          avatar_url?: string | null
          bio?: string | null
          certifications?: string[] | null
          created_at?: string
          education: string
          experience_years: number
          id?: string
          is_active?: boolean | null
          languages?: string[] | null
          name: string
          patient_rating?: number | null
          research_publications?: number | null
          specialization: string
          successful_procedures?: number | null
          title: string
          total_reviews?: number | null
          updated_at?: string
        }
        Update: {
          achievements?: string[] | null
          avatar_url?: string | null
          bio?: string | null
          certifications?: string[] | null
          created_at?: string
          education?: string
          experience_years?: number
          id?: string
          is_active?: boolean | null
          languages?: string[] | null
          name?: string
          patient_rating?: number | null
          research_publications?: number | null
          specialization?: string
          successful_procedures?: number | null
          title?: string
          total_reviews?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          ip_address: unknown
          success: boolean
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          ip_address: unknown
          success?: boolean
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          ip_address?: unknown
          success?: boolean
        }
        Relationships: []
      }
      newsletter_subscriptions: {
        Row: {
          confirmed_at: string | null
          created_at: string
          email: string
          id: string
          ip_address: unknown | null
          preferences: Json | null
          status: Database["public"]["Enums"]["subscription_status"]
          subscribed_at: string
          subscription_source: string | null
          unsubscribe_token: string
          unsubscribed_at: string | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          email: string
          id?: string
          ip_address?: unknown | null
          preferences?: Json | null
          status?: Database["public"]["Enums"]["subscription_status"]
          subscribed_at?: string
          subscription_source?: string | null
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          email?: string
          id?: string
          ip_address?: unknown | null
          preferences?: Json | null
          status?: Database["public"]["Enums"]["subscription_status"]
          subscribed_at?: string
          subscription_source?: string | null
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          role: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          created_at: string | null
          details: string | null
          event_type: string
          id: string
          table_name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          event_type: string
          id?: string
          table_name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: string | null
          event_type?: string
          id?: string
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          risk_level: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      trip_plan_accommodations: {
        Row: {
          amenities: string[] | null
          available_from: string | null
          available_to: string | null
          created_at: string
          distance_to_hospital_km: number | null
          id: string
          images: Json | null
          is_active: boolean | null
          location: Json | null
          name: string
          price_per_night: number
          special_medical_features: string[] | null
          star_rating: number | null
          type: string
        }
        Insert: {
          amenities?: string[] | null
          available_from?: string | null
          available_to?: string | null
          created_at?: string
          distance_to_hospital_km?: number | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          location?: Json | null
          name: string
          price_per_night: number
          special_medical_features?: string[] | null
          star_rating?: number | null
          type: string
        }
        Update: {
          amenities?: string[] | null
          available_from?: string | null
          available_to?: string | null
          created_at?: string
          distance_to_hospital_km?: number | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          location?: Json | null
          name?: string
          price_per_night?: number
          special_medical_features?: string[] | null
          star_rating?: number | null
          type?: string
        }
        Relationships: []
      }
      trip_plan_bookings: {
        Row: {
          accommodation_id: string | null
          booking_reference: string | null
          booking_status: string | null
          check_in_date: string
          check_out_date: string
          created_at: string
          guest_count: number
          id: string
          special_requests: string | null
          total_cost: number
          trip_plan_id: string
          updated_at: string
        }
        Insert: {
          accommodation_id?: string | null
          booking_reference?: string | null
          booking_status?: string | null
          check_in_date: string
          check_out_date: string
          created_at?: string
          guest_count: number
          id?: string
          special_requests?: string | null
          total_cost: number
          trip_plan_id: string
          updated_at?: string
        }
        Update: {
          accommodation_id?: string | null
          booking_reference?: string | null
          booking_status?: string | null
          check_in_date?: string
          check_out_date?: string
          created_at?: string
          guest_count?: number
          id?: string
          special_requests?: string | null
          total_cost?: number
          trip_plan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_plan_bookings_accommodation_id_fkey"
            columns: ["accommodation_id"]
            isOneToOne: false
            referencedRelation: "trip_plan_accommodations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_plan_bookings_trip_plan_id_fkey"
            columns: ["trip_plan_id"]
            isOneToOne: false
            referencedRelation: "trip_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_plans: {
        Row: {
          accommodation_preferences: Json | null
          budget_range: Json | null
          companion_count: number | null
          created_at: string
          cultural_interests: string[] | null
          current_step: number | null
          id: string
          preferred_travel_dates: Json | null
          recovery_timeline: number | null
          special_requirements: string[] | null
          status: string | null
          total_estimated_cost: number | null
          transportation_preferences: Json | null
          travel_insurance_needed: boolean | null
          treatment_type: string
          updated_at: string
          user_id: string | null
          visa_assistance_needed: boolean | null
        }
        Insert: {
          accommodation_preferences?: Json | null
          budget_range?: Json | null
          companion_count?: number | null
          created_at?: string
          cultural_interests?: string[] | null
          current_step?: number | null
          id?: string
          preferred_travel_dates?: Json | null
          recovery_timeline?: number | null
          special_requirements?: string[] | null
          status?: string | null
          total_estimated_cost?: number | null
          transportation_preferences?: Json | null
          travel_insurance_needed?: boolean | null
          treatment_type: string
          updated_at?: string
          user_id?: string | null
          visa_assistance_needed?: boolean | null
        }
        Update: {
          accommodation_preferences?: Json | null
          budget_range?: Json | null
          companion_count?: number | null
          created_at?: string
          cultural_interests?: string[] | null
          current_step?: number | null
          id?: string
          preferred_travel_dates?: Json | null
          recovery_timeline?: number | null
          special_requirements?: string[] | null
          status?: string | null
          total_estimated_cost?: number | null
          transportation_preferences?: Json | null
          travel_insurance_needed?: boolean | null
          treatment_type?: string
          updated_at?: string
          user_id?: string | null
          visa_assistance_needed?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_email_exists: {
        Args: { p_email: string }
        Returns: boolean
      }
      check_login_rate_limit: {
        Args: { p_email?: string; p_ip_address: unknown }
        Returns: Json
      }
      cleanup_old_login_attempts: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      generate_anonymized_patient_name: {
        Args: { review_id: string }
        Returns: string
      }
      get_user_display_name: {
        Args: { user_id: string }
        Returns: string
      }
      log_security_event: {
        Args: {
          p_event_data?: Json
          p_event_type: string
          p_ip_address?: unknown
          p_risk_level?: string
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: string
      }
      record_login_attempt: {
        Args: { p_email: string; p_ip_address: unknown; p_success: boolean }
        Returns: undefined
      }
    }
    Enums: {
      subscription_status: "pending" | "active" | "unsubscribed" | "bounced"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      subscription_status: ["pending", "active", "unsubscribed", "bounced"],
    },
  },
} as const
