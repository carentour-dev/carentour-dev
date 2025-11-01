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
      blog_authors: {
        Row: {
          active: boolean | null;
          avatar: string | null;
          bio: string | null;
          created_at: string;
          email: string | null;
          id: string;
          name: string;
          slug: string;
          social_links: Json | null;
          updated_at: string;
          user_id: string | null;
          website: string | null;
        };
        Insert: {
          active?: boolean | null;
          avatar?: string | null;
          bio?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          name: string;
          slug: string;
          social_links?: Json | null;
          updated_at?: string;
          user_id?: string | null;
          website?: string | null;
        };
        Update: {
          active?: boolean | null;
          avatar?: string | null;
          bio?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string;
          slug?: string;
          social_links?: Json | null;
          updated_at?: string;
          user_id?: string | null;
          website?: string | null;
        };
        Relationships: [];
      };
      blog_categories: {
        Row: {
          color: string | null;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          order: number | null;
          slug: string;
          updated_at: string;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          order?: number | null;
          slug: string;
          updated_at?: string;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          order?: number | null;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      blog_comments: {
        Row: {
          author_email: string;
          author_name: string;
          author_user_id: string | null;
          content: string;
          created_at: string;
          id: string;
          parent_id: string | null;
          post_id: string;
          status: string;
        };
        Insert: {
          author_email: string;
          author_name: string;
          author_user_id?: string | null;
          content: string;
          created_at?: string;
          id?: string;
          parent_id?: string | null;
          post_id: string;
          status?: string;
        };
        Update: {
          author_email?: string;
          author_name?: string;
          author_user_id?: string | null;
          content?: string;
          created_at?: string;
          id?: string;
          parent_id?: string | null;
          post_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blog_comments_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "blog_comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blog_comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "blog_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      blog_post_tags: {
        Row: {
          created_at: string;
          post_id: string;
          tag_id: string;
        };
        Insert: {
          created_at?: string;
          post_id: string;
          tag_id: string;
        };
        Update: {
          created_at?: string;
          post_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "blog_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blog_post_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "blog_tags";
            referencedColumns: ["id"];
          },
        ];
      };
      blog_posts: {
        Row: {
          author_id: string | null;
          author_user_id: string | null;
          category_id: string | null;
          content: Json;
          created_at: string;
          enable_comments: boolean | null;
          excerpt: string | null;
          featured: boolean | null;
          featured_image: string | null;
          id: string;
          og_image: string | null;
          publish_date: string | null;
          reading_time: number | null;
          seo_description: string | null;
          seo_keywords: string | null;
          seo_title: string | null;
          slug: string;
          status: string;
          title: string;
          updated_at: string;
          view_count: number | null;
        };
        Insert: {
          author_id?: string | null;
          author_user_id?: string | null;
          category_id?: string | null;
          content?: Json;
          created_at?: string;
          enable_comments?: boolean | null;
          excerpt?: string | null;
          featured?: boolean | null;
          featured_image?: string | null;
          id?: string;
          og_image?: string | null;
          publish_date?: string | null;
          reading_time?: number | null;
          seo_description?: string | null;
          seo_keywords?: string | null;
          seo_title?: string | null;
          slug: string;
          status?: string;
          title: string;
          updated_at?: string;
          view_count?: number | null;
        };
        Update: {
          author_id?: string | null;
          author_user_id?: string | null;
          category_id?: string | null;
          content?: Json;
          created_at?: string;
          enable_comments?: boolean | null;
          excerpt?: string | null;
          featured?: boolean | null;
          featured_image?: string | null;
          id?: string;
          og_image?: string | null;
          publish_date?: string | null;
          reading_time?: number | null;
          seo_description?: string | null;
          seo_keywords?: string | null;
          seo_title?: string | null;
          slug?: string;
          status?: string;
          title?: string;
          updated_at?: string;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "blog_authors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blog_posts_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "blog_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      blog_tags: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      cms_pages: {
        Row: {
          content: Json;
          created_at: string;
          id: string;
          seo: Json | null;
          slug: string;
          status: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          content?: Json;
          created_at?: string;
          id?: string;
          seo?: Json | null;
          slug: string;
          status?: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          content?: Json;
          created_at?: string;
          id?: string;
          seo?: Json | null;
          slug?: string;
          status?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
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
          medical_reports: string | null;
          message: string;
          notes: string | null;
          origin: string;
          patient_id: string | null;
          phone: string | null;
          portal_metadata: Json | null;
          request_type: string;
          resolved_at: string | null;
          status: Database["public"]["Enums"]["contact_request_status"];
          travel_window: string | null;
          treatment: string | null;
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
          medical_reports?: string | null;
          message: string;
          notes?: string | null;
          origin?: string;
          patient_id?: string | null;
          phone?: string | null;
          portal_metadata?: Json | null;
          request_type?: string;
          resolved_at?: string | null;
          status?: Database["public"]["Enums"]["contact_request_status"];
          travel_window?: string | null;
          treatment?: string | null;
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
          medical_reports?: string | null;
          message?: string;
          notes?: string | null;
          origin?: string;
          patient_id?: string | null;
          phone?: string | null;
          portal_metadata?: Json | null;
          request_type?: string;
          resolved_at?: string | null;
          status?: Database["public"]["Enums"]["contact_request_status"];
          travel_window?: string | null;
          treatment?: string | null;
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
            foreignKeyName: "contact_requests_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "secure_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contact_requests_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patient_testimonial_public";
            referencedColumns: ["patient_id"];
          },
          {
            foreignKeyName: "contact_requests_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patient_testimonial_rollup";
            referencedColumns: ["patient_id"];
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
          display_order: number | null;
          doctor_id: string | null;
          highlight: boolean | null;
          id: string;
          is_verified: boolean | null;
          locale: string | null;
          media: Json | null;
          patient_country: string | null;
          patient_id: string | null;
          patient_name: string;
          procedure_name: string | null;
          published: boolean | null;
          rating: number;
          recovery_time: string | null;
          review_text: string;
          treatment_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_order?: number | null;
          doctor_id?: string | null;
          highlight?: boolean | null;
          id?: string;
          is_verified?: boolean | null;
          locale?: string | null;
          media?: Json | null;
          patient_country?: string | null;
          patient_id?: string | null;
          patient_name: string;
          procedure_name?: string | null;
          published?: boolean | null;
          rating: number;
          recovery_time?: string | null;
          review_text: string;
          treatment_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_order?: number | null;
          doctor_id?: string | null;
          highlight?: boolean | null;
          id?: string;
          is_verified?: boolean | null;
          locale?: string | null;
          media?: Json | null;
          patient_country?: string | null;
          patient_id?: string | null;
          patient_name?: string;
          procedure_name?: string | null;
          published?: boolean | null;
          rating?: number;
          recovery_time?: string | null;
          review_text?: string;
          treatment_id?: string;
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
            referencedRelation: "patient_testimonial_public";
            referencedColumns: ["patient_id"];
          },
          {
            foreignKeyName: "doctor_reviews_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patient_testimonial_rollup";
            referencedColumns: ["patient_id"];
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
      hotels: {
        Row: {
          address: Json | null;
          amenities: string[] | null;
          contact_info: Json | null;
          coordinates: Json | null;
          created_at: string;
          currency: string | null;
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
        };
        Insert: {
          address?: Json | null;
          amenities?: string[] | null;
          contact_info?: Json | null;
          coordinates?: Json | null;
          created_at?: string;
          currency?: string | null;
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
        };
        Update: {
          address?: Json | null;
          amenities?: string[] | null;
          contact_info?: Json | null;
          coordinates?: Json | null;
          created_at?: string;
          currency?: string | null;
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
      navigation_links: {
        Row: {
          cms_page_id: string | null;
          created_at: string;
          href: string;
          id: string;
          kind: string;
          label: string;
          position: number;
          slug: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          cms_page_id?: string | null;
          created_at?: string;
          href: string;
          id?: string;
          kind?: string;
          label: string;
          position?: number;
          slug: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          cms_page_id?: string | null;
          created_at?: string;
          href?: string;
          id?: string;
          kind?: string;
          label?: string;
          position?: number;
          slug?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "navigation_links_cms_page_id_fkey";
            columns: ["cms_page_id"];
            isOneToOne: true;
            referencedRelation: "cms_pages";
            referencedColumns: ["id"];
          },
        ];
      };
      newsletter_subscriptions: {
        Row: {
          confirmed_at: string | null;
          created_at: string;
          email: string;
          id: string;
          ip_address: unknown;
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
          ip_address?: unknown;
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
          ip_address?: unknown;
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
            referencedRelation: "patient_testimonial_public";
            referencedColumns: ["patient_id"];
          },
          {
            foreignKeyName: "patient_appointments_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patient_testimonial_rollup";
            referencedColumns: ["patient_id"];
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
            foreignKeyName: "patient_consultations_coordinator_id_fkey";
            columns: ["coordinator_id"];
            isOneToOne: false;
            referencedRelation: "secure_profiles";
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
            referencedRelation: "patient_testimonial_public";
            referencedColumns: ["patient_id"];
          },
          {
            foreignKeyName: "patient_consultations_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patient_testimonial_rollup";
            referencedColumns: ["patient_id"];
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
      patient_stories: {
        Row: {
          body_markdown: string;
          created_at: string;
          display_order: number | null;
          doctor_id: string | null;
          excerpt: string | null;
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
          updated_at: string;
        };
        Insert: {
          body_markdown: string;
          created_at?: string;
          display_order?: number | null;
          doctor_id?: string | null;
          excerpt?: string | null;
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
          updated_at?: string;
        };
        Update: {
          body_markdown?: string;
          created_at?: string;
          display_order?: number | null;
          doctor_id?: string | null;
          excerpt?: string | null;
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
            referencedRelation: "patient_testimonial_public";
            referencedColumns: ["patient_id"];
          },
          {
            foreignKeyName: "patient_stories_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patient_testimonial_rollup";
            referencedColumns: ["patient_id"];
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
      patients: {
        Row: {
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string;
          date_of_birth: string | null;
          email_verified: boolean;
          full_name: string;
          has_testimonial: boolean | null;
          home_city: string | null;
          id: string;
          nationality: string | null;
          notes: string | null;
          preferred_currency: string | null;
          preferred_language: string | null;
          sex: string | null;
          travel_year: number | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          email_verified?: boolean;
          full_name: string;
          has_testimonial?: boolean | null;
          home_city?: string | null;
          id?: string;
          nationality?: string | null;
          notes?: string | null;
          preferred_currency?: string | null;
          preferred_language?: string | null;
          sex?: string | null;
          travel_year?: number | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          email_verified?: boolean;
          full_name?: string;
          has_testimonial?: boolean | null;
          home_city?: string | null;
          id?: string;
          nationality?: string | null;
          notes?: string | null;
          preferred_currency?: string | null;
          preferred_language?: string | null;
          sex?: string | null;
          travel_year?: number | null;
          updated_at?: string;
          user_id?: string | null;
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
            foreignKeyName: "profile_roles_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "secure_profiles";
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
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          date_of_birth: string | null;
          email: string | null;
          id: string;
          job_title: string | null;
          language: string | null;
          nationality: string | null;
          phone: string | null;
          sex: string | null;
          updated_at: string;
          user_id: string;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          email?: string | null;
          id?: string;
          job_title?: string | null;
          language?: string | null;
          nationality?: string | null;
          phone?: string | null;
          sex?: string | null;
          updated_at?: string;
          user_id: string;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          email?: string | null;
          id?: string;
          job_title?: string | null;
          language?: string | null;
          nationality?: string | null;
          phone?: string | null;
          sex?: string | null;
          updated_at?: string;
          user_id?: string;
          username?: string | null;
        };
        Relationships: [];
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
          ip_address: unknown;
          risk_level: string | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          event_data?: Json | null;
          event_type: string;
          id?: string;
          ip_address?: unknown;
          risk_level?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          event_data?: Json | null;
          event_type?: string;
          id?: string;
          ip_address?: unknown;
          risk_level?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      service_providers: {
        Row: {
          address: Json | null;
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
        };
        Insert: {
          address?: Json | null;
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
        };
        Update: {
          address?: Json | null;
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
        };
        Relationships: [];
      };
      start_journey_submissions: {
        Row: {
          accessibility_needs: string | null;
          accommodation_type: string | null;
          age: string | null;
          allergies: string | null;
          assigned_to: string | null;
          budget_range: string | null;
          companion_travelers: string | null;
          consultation_id: string | null;
          consultation_mode: string | null;
          country: string;
          created_at: string;
          current_medications: string | null;
          dietary_requirements: string | null;
          doctor_preference: string | null;
          documents: Json | null;
          email: string;
          first_name: string;
          has_insurance: boolean | null;
          has_medical_records: boolean | null;
          has_passport: boolean | null;
          id: string;
          language_notes: string | null;
          language_preference: string | null;
          last_name: string;
          medical_condition: string;
          notes: string | null;
          origin: string;
          patient_id: string | null;
          phone: string;
          previous_treatments: string | null;
          procedure_id: string | null;
          procedure_name: string | null;
          resolved_at: string | null;
          status: Database["public"]["Enums"]["journey_submission_status"];
          timeline: string | null;
          travel_dates: Json | null;
          treatment_id: string | null;
          treatment_name: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          accessibility_needs?: string | null;
          accommodation_type?: string | null;
          age?: string | null;
          allergies?: string | null;
          assigned_to?: string | null;
          budget_range?: string | null;
          companion_travelers?: string | null;
          consultation_id?: string | null;
          consultation_mode?: string | null;
          country: string;
          created_at?: string;
          current_medications?: string | null;
          dietary_requirements?: string | null;
          doctor_preference?: string | null;
          documents?: Json | null;
          email: string;
          first_name: string;
          has_insurance?: boolean | null;
          has_medical_records?: boolean | null;
          has_passport?: boolean | null;
          id?: string;
          language_notes?: string | null;
          language_preference?: string | null;
          last_name: string;
          medical_condition: string;
          notes?: string | null;
          origin?: string;
          patient_id?: string | null;
          phone: string;
          previous_treatments?: string | null;
          procedure_id?: string | null;
          procedure_name?: string | null;
          resolved_at?: string | null;
          status?: Database["public"]["Enums"]["journey_submission_status"];
          timeline?: string | null;
          travel_dates?: Json | null;
          treatment_id?: string | null;
          treatment_name?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          accessibility_needs?: string | null;
          accommodation_type?: string | null;
          age?: string | null;
          allergies?: string | null;
          assigned_to?: string | null;
          budget_range?: string | null;
          companion_travelers?: string | null;
          consultation_id?: string | null;
          consultation_mode?: string | null;
          country?: string;
          created_at?: string;
          current_medications?: string | null;
          dietary_requirements?: string | null;
          doctor_preference?: string | null;
          documents?: Json | null;
          email?: string;
          first_name?: string;
          has_insurance?: boolean | null;
          has_medical_records?: boolean | null;
          has_passport?: boolean | null;
          id?: string;
          language_notes?: string | null;
          language_preference?: string | null;
          last_name?: string;
          medical_condition?: string;
          notes?: string | null;
          origin?: string;
          patient_id?: string | null;
          phone?: string;
          previous_treatments?: string | null;
          procedure_id?: string | null;
          procedure_name?: string | null;
          resolved_at?: string | null;
          status?: Database["public"]["Enums"]["journey_submission_status"];
          timeline?: string | null;
          travel_dates?: Json | null;
          treatment_id?: string | null;
          treatment_name?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "start_journey_submissions_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "start_journey_submissions_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "secure_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "start_journey_submissions_consultation_id_fkey";
            columns: ["consultation_id"];
            isOneToOne: false;
            referencedRelation: "patient_consultations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "start_journey_submissions_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patient_testimonial_public";
            referencedColumns: ["patient_id"];
          },
          {
            foreignKeyName: "start_journey_submissions_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patient_testimonial_rollup";
            referencedColumns: ["patient_id"];
          },
          {
            foreignKeyName: "start_journey_submissions_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "start_journey_submissions_procedure_id_fkey";
            columns: ["procedure_id"];
            isOneToOne: false;
            referencedRelation: "treatment_procedures";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "start_journey_submissions_treatment_id_fkey";
            columns: ["treatment_id"];
            isOneToOne: false;
            referencedRelation: "treatments";
            referencedColumns: ["id"];
          },
        ];
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
      treatment_procedures: {
        Row: {
          additional_notes: string | null;
          candidate_requirements: string[] | null;
          created_at: string;
          description: string | null;
          display_order: number;
          duration: string | null;
          egypt_price: number | null;
          id: string;
          international_prices: Json | null;
          name: string;
          pdf_url: string | null;
          price: string | null;
          recovery: string | null;
          recovery_stages: Json | null;
          success_rate: string | null;
          treatment_id: string;
          updated_at: string;
        };
        Insert: {
          additional_notes?: string | null;
          candidate_requirements?: string[] | null;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          duration?: string | null;
          egypt_price?: number | null;
          id?: string;
          international_prices?: Json | null;
          name: string;
          pdf_url?: string | null;
          price?: string | null;
          recovery?: string | null;
          recovery_stages?: Json | null;
          success_rate?: string | null;
          treatment_id: string;
          updated_at?: string;
        };
        Update: {
          additional_notes?: string | null;
          candidate_requirements?: string[] | null;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          duration?: string | null;
          egypt_price?: number | null;
          id?: string;
          international_prices?: Json | null;
          name?: string;
          pdf_url?: string | null;
          price?: string | null;
          recovery?: string | null;
          recovery_stages?: Json | null;
          success_rate?: string | null;
          treatment_id?: string;
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
          download_url: string | null;
          duration_days: number | null;
          id: string;
          ideal_candidates: string[] | null;
          is_active: boolean | null;
          is_featured: boolean;
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
          download_url?: string | null;
          duration_days?: number | null;
          id?: string;
          ideal_candidates?: string[] | null;
          is_active?: boolean | null;
          is_featured?: boolean;
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
          download_url?: string | null;
          duration_days?: number | null;
          id?: string;
          ideal_candidates?: string[] | null;
          is_active?: boolean | null;
          is_featured?: boolean;
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
    };
    Views: {
      patient_testimonial_public: {
        Row: {
          created_at: string | null;
          full_name: string | null;
          has_testimonial: boolean | null;
          home_city: string | null;
          nationality: string | null;
          patient_id: string | null;
          published_review_count: number | null;
          published_story_count: number | null;
          reviews: Json | null;
          stories: Json | null;
          travel_year: number | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          full_name?: never;
          has_testimonial?: boolean | null;
          home_city?: string | null;
          nationality?: string | null;
          patient_id?: string | null;
          published_review_count?: never;
          published_story_count?: never;
          reviews?: never;
          stories?: never;
          travel_year?: number | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          full_name?: never;
          has_testimonial?: boolean | null;
          home_city?: string | null;
          nationality?: string | null;
          patient_id?: string | null;
          published_review_count?: never;
          published_story_count?: never;
          reviews?: never;
          stories?: never;
          travel_year?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      patient_testimonial_rollup: {
        Row: {
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string | null;
          date_of_birth: string | null;
          full_name: string | null;
          has_testimonial: boolean | null;
          home_city: string | null;
          nationality: string | null;
          notes: string | null;
          patient_id: string | null;
          preferred_currency: string | null;
          preferred_language: string | null;
          published_review_count: number | null;
          published_story_count: number | null;
          reviews: Json | null;
          sex: string | null;
          stories: Json | null;
          total_review_count: number | null;
          total_story_count: number | null;
          travel_year: number | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string | null;
          date_of_birth?: string | null;
          full_name?: string | null;
          has_testimonial?: boolean | null;
          home_city?: string | null;
          nationality?: string | null;
          notes?: string | null;
          patient_id?: string | null;
          preferred_currency?: string | null;
          preferred_language?: string | null;
          published_review_count?: never;
          published_story_count?: never;
          reviews?: never;
          sex?: string | null;
          stories?: never;
          total_review_count?: never;
          total_story_count?: never;
          travel_year?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string | null;
          date_of_birth?: string | null;
          full_name?: string | null;
          has_testimonial?: boolean | null;
          home_city?: string | null;
          nationality?: string | null;
          notes?: string | null;
          patient_id?: string | null;
          preferred_currency?: string | null;
          preferred_language?: string | null;
          published_review_count?: never;
          published_story_count?: never;
          reviews?: never;
          sex?: string | null;
          stories?: never;
          total_review_count?: never;
          total_story_count?: never;
          travel_year?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      secure_profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          email: string | null;
          id: string | null;
          role: string | null;
          updated_at: string | null;
          user_id: string | null;
          username: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      check_email_exists: { Args: { p_email: string }; Returns: boolean };
      check_login_rate_limit: {
        Args: { p_email?: string; p_ip_address: unknown };
        Returns: Json;
      };
      cleanup_old_login_attempts: { Args: never; Returns: number };
      current_user_has_permission: {
        Args: { p_permission: string };
        Returns: boolean;
      };
      current_user_permissions: { Args: never; Returns: string[] };
      current_user_roles: { Args: never; Returns: string[] };
      generate_anonymized_patient_name: {
        Args: { review_id: string };
        Returns: string;
      };
      get_patient_testimonial: {
        Args: { p_patient_id: string };
        Returns: {
          created_at: string | null;
          full_name: string | null;
          has_testimonial: boolean | null;
          home_city: string | null;
          nationality: string | null;
          patient_id: string | null;
          published_review_count: number | null;
          published_story_count: number | null;
          reviews: Json | null;
          stories: Json | null;
          travel_year: number | null;
          updated_at: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "patient_testimonial_public";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      get_user_display_name: { Args: { user_id: string }; Returns: string };
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
      increment_blog_post_view_count: {
        Args: { post_id: string };
        Returns: undefined;
      };
      is_admin_or_editor: { Args: never; Returns: boolean };
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
      user_permissions: { Args: { p_user_id: string }; Returns: string[] };
      user_roles: { Args: { p_user_id: string }; Returns: string[] };
    };
    Enums: {
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "rescheduled";
      consultation_status:
        | "scheduled"
        | "rescheduled"
        | "completed"
        | "cancelled"
        | "no_show";
      contact_request_status: "new" | "in_progress" | "resolved";
      journey_submission_status:
        | "new"
        | "reviewing"
        | "contacted"
        | "consultation_scheduled"
        | "completed"
        | "archived";
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
      appointment_status: [
        "scheduled",
        "confirmed",
        "completed",
        "cancelled",
        "rescheduled",
      ],
      consultation_status: [
        "scheduled",
        "rescheduled",
        "completed",
        "cancelled",
        "no_show",
      ],
      contact_request_status: ["new", "in_progress", "resolved"],
      journey_submission_status: [
        "new",
        "reviewing",
        "contacted",
        "consultation_scheduled",
        "completed",
        "archived",
      ],
      subscription_status: ["pending", "active", "unsubscribed", "bounced"],
      treatment_grade: ["grade_a", "grade_b", "grade_c"],
    },
  },
} as const;
