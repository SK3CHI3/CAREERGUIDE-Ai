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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      academic_terms: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          start_date: string | null
          term_name: string
          term_order: number
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          start_date?: string | null
          term_name: string
          term_order: number
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          start_date?: string | null
          term_name?: string
          term_order?: number
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          content: string
          cover_image_url: string | null
          created_at: string | null
          excerpt: string | null
          id: string
          published: boolean | null
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          cover_image_url?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          published?: boolean | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          cover_image_url?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          published?: boolean | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cache_invalidation: {
        Row: {
          cache_type: string
          id: string
          invalidated_at: string | null
          reason: string | null
          user_id: string | null
        }
        Insert: {
          cache_type: string
          id?: string
          invalidated_at?: string | null
          reason?: string | null
          user_id?: string | null
        }
        Update: {
          cache_type?: string
          id?: string
          invalidated_at?: string | null
          reason?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cached_career_details: {
        Row: {
          career_name: string
          created_at: string | null
          details: Json
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          career_name: string
          created_at?: string | null
          details: Json
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          career_name?: string
          created_at?: string | null
          details?: Json
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cached_career_recommendations: {
        Row: {
          career_name: string
          created_at: string | null
          description: string | null
          education: string | null
          growth: string | null
          id: string
          match_percentage: number
          salary_range: string | null
          updated_at: string | null
          user_id: string | null
          why_recommended: string | null
        }
        Insert: {
          career_name: string
          created_at?: string | null
          description?: string | null
          education?: string | null
          growth?: string | null
          id?: string
          match_percentage: number
          salary_range?: string | null
          updated_at?: string | null
          user_id?: string | null
          why_recommended?: string | null
        }
        Update: {
          career_name?: string
          created_at?: string | null
          description?: string | null
          education?: string | null
          growth?: string | null
          id?: string
          match_percentage?: number
          salary_range?: string | null
          updated_at?: string | null
          user_id?: string | null
          why_recommended?: string | null
        }
        Relationships: []
      }
      cached_course_recommendations: {
        Row: {
          courses: Json
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          courses: Json
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          courses?: Json
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      career_interests: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          interest_name: string
          is_active: boolean | null
          related_subjects: string[] | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          interest_name: string
          is_active?: boolean | null
          related_subjects?: string[] | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          interest_name?: string
          is_active?: boolean | null
          related_subjects?: string[] | null
        }
        Relationships: []
      }
      career_paths: {
        Row: {
          career_level: string | null
          category: string
          created_at: string | null
          demand_level: string
          description: string
          education_requirements: string | null
          growth_percentage: string
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          salary_range: string
          skills_required: string[]
          title: string
          updated_at: string | null
        }
        Insert: {
          career_level?: string | null
          category: string
          created_at?: string | null
          demand_level: string
          description: string
          education_requirements?: string | null
          growth_percentage: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          salary_range: string
          skills_required: string[]
          title: string
          updated_at?: string | null
        }
        Update: {
          career_level?: string | null
          category?: string
          created_at?: string | null
          demand_level?: string
          description?: string
          education_requirements?: string | null
          growth_percentage?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          salary_range?: string
          skills_required?: string[]
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      career_recommendations: {
        Row: {
          career_name: string
          created_at: string | null
          description: string | null
          education_required: string | null
          expires_at: string | null
          growth_prospect: string | null
          id: string
          match_percentage: number
          salary_range: string | null
          skills_required: string[] | null
          user_id: string | null
        }
        Insert: {
          career_name: string
          created_at?: string | null
          description?: string | null
          education_required?: string | null
          expires_at?: string | null
          growth_prospect?: string | null
          id?: string
          match_percentage: number
          salary_range?: string | null
          skills_required?: string[] | null
          user_id?: string | null
        }
        Update: {
          career_name?: string
          created_at?: string | null
          description?: string | null
          education_required?: string | null
          expires_at?: string | null
          growth_prospect?: string | null
          id?: string
          match_percentage?: number
          salary_range?: string | null
          skills_required?: string[] | null
          user_id?: string | null
        }
        Relationships: []
      }
      cbe_subjects: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          subject_code: string | null
          subject_name: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          subject_code?: string | null
          subject_name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          subject_code?: string | null
          subject_name?: string
        }
        Relationships: []
      }
      class_enrollments: {
        Row: {
          class_id: string
          enrolled_at: string | null
          id: string
          source: string | null
          student_name: string | null
          student_phone: string | null
          student_upi: string | null
          student_user_id: string | null
        }
        Insert: {
          class_id: string
          enrolled_at?: string | null
          id?: string
          source?: string | null
          student_name?: string | null
          student_phone?: string | null
          student_upi?: string | null
          student_user_id?: string | null
        }
        Update: {
          class_id?: string
          enrolled_at?: string | null
          id?: string
          source?: string | null
          student_name?: string | null
          student_phone?: string | null
          student_upi?: string | null
          student_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_enrollments_student_profile_fkey"
            columns: ["student_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year: string | null
          created_at: string | null
          grade_level: string | null
          id: string
          name: string
          school_id: string
          teacher_id: string | null
          updated_at: string | null
        }
        Insert: {
          academic_year?: string | null
          created_at?: string | null
          grade_level?: string | null
          id?: string
          name: string
          school_id: string
          teacher_id?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_year?: string | null
          created_at?: string | null
          grade_level?: string | null
          id?: string
          name?: string
          school_id?: string
          teacher_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      counselor_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          sender_id: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          sender_id: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          sender_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "counselor_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counselor_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "counselor_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      counselor_profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          hourly_rate: number
          id: string
          image_url: string | null
          is_active: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          hourly_rate?: number
          id: string
          image_url?: string | null
          is_active?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          hourly_rate?: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "counselor_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      counselor_sessions: {
        Row: {
          counselor_id: string | null
          created_at: string | null
          id: string
          intasend_transaction_id: string | null
          payment_amount: number | null
          payment_reference: string | null
          status: string
          student_id: string
          updated_at: string | null
        }
        Insert: {
          counselor_id?: string | null
          created_at?: string | null
          id?: string
          intasend_transaction_id?: string | null
          payment_amount?: number | null
          payment_reference?: string | null
          status?: string
          student_id: string
          updated_at?: string | null
        }
        Update: {
          counselor_id?: string | null
          created_at?: string | null
          id?: string
          intasend_transaction_id?: string | null
          payment_amount?: number | null
          payment_reference?: string | null
          status?: string
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "counselor_sessions_counselor_id_fkey"
            columns: ["counselor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counselor_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feedbacks: {
        Row: {
          category: string
          content: string
          created_at: string | null
          id: string
          status: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          id?: string
          status?: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          id?: string
          status?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      field_day_requests: {
        Row: {
          contact_number: string
          created_at: string | null
          full_name: string
          id: string
          preferred_date: string | null
          preferred_location: string | null
          school_id: string | null
          status: string | null
          student_id: string | null
          updated_at: string | null
        }
        Insert: {
          contact_number: string
          created_at?: string | null
          full_name: string
          id?: string
          preferred_date?: string | null
          preferred_location?: string | null
          school_id?: string | null
          status?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_number?: string
          created_at?: string | null
          full_name?: string
          id?: string
          preferred_date?: string | null
          preferred_location?: string | null
          school_id?: string | null
          status?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "field_day_requests_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_day_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      global_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value: Json
        }
        Relationships: []
      }
      grade_categories: {
        Row: {
          category_name: string
          created_at: string | null
          description: string | null
          grade_scale: Json
          id: string
          is_active: boolean | null
        }
        Insert: {
          category_name: string
          created_at?: string | null
          description?: string | null
          grade_scale: Json
          id?: string
          is_active?: boolean | null
        }
        Update: {
          category_name?: string
          created_at?: string | null
          description?: string | null
          grade_scale?: Json
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      platform_analytics: {
        Row: {
          additional_data: Json | null
          created_at: string | null
          id: string
          metric_date: string
          metric_name: string
          metric_period: string
          metric_value: number
        }
        Insert: {
          additional_data?: Json | null
          created_at?: string | null
          id?: string
          metric_date: string
          metric_name: string
          metric_period: string
          metric_value: number
        }
        Update: {
          additional_data?: Json | null
          created_at?: string | null
          id?: string
          metric_date?: string
          metric_name?: string
          metric_period?: string
          metric_value?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          assessment_results: Json | null
          avatar_url: string | null
          career_goals: string | null
          career_interests: string[] | null
          cbe_subjects: string[] | null
          created_at: string | null
          current_grade: string | null
          curriculum: string | null
          email: string
          full_name: string | null
          id: string
          intasend_transaction_id: string | null
          interests: string[] | null
          is_trial_used: boolean | null
          payment_amount: number | null
          payment_currency: string | null
          payment_date: string | null
          payment_reference: string | null
          payment_status: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          school_id: string | null
          school_level: string | null
          subjects: string[] | null
          subscription_expires_at: string | null
          subscription_type: string | null
          updated_at: string | null
          upi_number: string | null
        }
        Insert: {
          assessment_results?: Json | null
          avatar_url?: string | null
          career_goals?: string | null
          career_interests?: string[] | null
          cbe_subjects?: string[] | null
          created_at?: string | null
          current_grade?: string | null
          curriculum?: string | null
          email: string
          full_name?: string | null
          id: string
          intasend_transaction_id?: string | null
          interests?: string[] | null
          is_trial_used?: boolean | null
          payment_amount?: number | null
          payment_currency?: string | null
          payment_date?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          school_id?: string | null
          school_level?: string | null
          subjects?: string[] | null
          subscription_expires_at?: string | null
          subscription_type?: string | null
          updated_at?: string | null
          upi_number?: string | null
        }
        Update: {
          assessment_results?: Json | null
          avatar_url?: string | null
          career_goals?: string | null
          career_interests?: string[] | null
          cbe_subjects?: string[] | null
          created_at?: string | null
          current_grade?: string | null
          curriculum?: string | null
          email?: string
          full_name?: string | null
          id?: string
          intasend_transaction_id?: string | null
          interests?: string[] | null
          is_trial_used?: boolean | null
          payment_amount?: number | null
          payment_currency?: string | null
          payment_date?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          school_id?: string | null
          school_level?: string | null
          subjects?: string[] | null
          subscription_expires_at?: string | null
          subscription_type?: string | null
          updated_at?: string | null
          upi_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string | null
          role: string
          school_id: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role: string
          school_id: string
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          school_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_members_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_members_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_subscriptions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          payment_reference: string | null
          school_id: string
          started_at: string
          tier: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          payment_reference?: string | null
          school_id: string
          started_at?: string
          tier: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          payment_reference?: string | null
          school_id?: string
          started_at?: string
          tier?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_subscriptions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          code: string | null
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          region: string | null
          settings: Json | null
          status: string | null
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          region?: string | null
          settings?: Json | null
          status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          region?: string | null
          settings?: Json | null
          status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      student_grades: {
        Row: {
          academic_year: string
          created_at: string | null
          exam_type: string | null
          grade_letter: string | null
          grade_value: number
          id: string
          max_marks: number | null
          source: string | null
          student_phone: string | null
          student_upi: string | null
          subject_code: string | null
          subject_name: string
          teacher_comment: string | null
          term: string
          updated_at: string | null
          upload_batch_id: string | null
          user_id: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          academic_year: string
          created_at?: string | null
          exam_type?: string | null
          grade_letter?: string | null
          grade_value: number
          id?: string
          max_marks?: number | null
          source?: string | null
          student_phone?: string | null
          student_upi?: string | null
          subject_code?: string | null
          subject_name: string
          teacher_comment?: string | null
          term: string
          updated_at?: string | null
          upload_batch_id?: string | null
          user_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          academic_year?: string
          created_at?: string | null
          exam_type?: string | null
          grade_letter?: string | null
          grade_value?: number
          id?: string
          max_marks?: number | null
          source?: string | null
          student_phone?: string | null
          student_upi?: string | null
          subject_code?: string | null
          subject_name?: string
          teacher_comment?: string | null
          term?: string
          updated_at?: string | null
          upload_batch_id?: string | null
          user_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_grades_user_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          school_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          school_id: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string
          school_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_invites_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activities: {
        Row: {
          activity_data: Json | null
          activity_description: string | null
          activity_title: string
          activity_type: string
          created_at: string | null
          id: string
          progress_percentage: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          activity_data?: Json | null
          activity_description?: string | null
          activity_title: string
          activity_type: string
          created_at?: string | null
          id?: string
          progress_percentage?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          activity_data?: Json | null
          activity_description?: string | null
          activity_title?: string
          activity_type?: string
          created_at?: string | null
          id?: string
          progress_percentage?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          actions_count: number | null
          browser: string | null
          created_at: string | null
          device_type: string | null
          id: string
          page_views: number | null
          session_duration: number | null
          session_end: string | null
          session_start: string | null
          user_id: string | null
        }
        Insert: {
          actions_count?: number | null
          browser?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          page_views?: number | null
          session_duration?: number | null
          session_end?: string | null
          session_start?: string | null
          user_id?: string | null
        }
        Update: {
          actions_count?: number | null
          browser?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          page_views?: number | null
          session_duration?: number | null
          session_end?: string | null
          session_start?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          calculated_at: string | null
          id: string
          stat_change: string | null
          stat_trend: string | null
          stat_type: string
          stat_value: string
          user_id: string | null
        }
        Insert: {
          calculated_at?: string | null
          id?: string
          stat_change?: string | null
          stat_trend?: string | null
          stat_type: string
          stat_value: string
          user_id?: string | null
        }
        Update: {
          calculated_at?: string | null
          id?: string
          stat_change?: string | null
          stat_trend?: string | null
          stat_type?: string
          stat_value?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_teacher_invite: { Args: { p_token: string }; Returns: undefined }
      get_class_school_id: { Args: { p_class_id: string }; Returns: string }
      get_user_email: { Args: { p_identifier: string }; Returns: string }
      has_no_school_members: { Args: { p_school_id: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_school_admin: { Args: { p_school_id: string }; Returns: boolean }
      is_school_member: { Args: { p_school_id: string }; Returns: boolean }
      is_student_in_class: { Args: { p_class_id: string }; Returns: boolean }
      sync_student_data: {
        Args: { p_upi: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      assessment_type: "personality" | "skills" | "interests" | "comprehensive"
      user_role: "student" | "admin" | "school" | "mentor"
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
      assessment_type: ["personality", "skills", "interests", "comprehensive"],
      user_role: ["student", "admin", "school", "mentor"],
    },
  },
} as const
