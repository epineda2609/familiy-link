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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      additional_information_reports: {
        Row: {
          anonymity_requested: boolean
          assigned_organization_id: string | null
          created_at: string
          description: string
          event_id: string | null
          id: string
          information_type: string | null
          latitude: number | null
          longitude: number | null
          person_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          sighting_date: string | null
          sighting_location: string | null
          source_type: string | null
          status: Database["public"]["Enums"]["report_status"]
          submitted_by_email: string | null
          submitted_by_name: string | null
          submitted_by_phone: string | null
          submitted_by_user_id: string | null
          updated_at: string
        }
        Insert: {
          anonymity_requested?: boolean
          assigned_organization_id?: string | null
          created_at?: string
          description: string
          event_id?: string | null
          id?: string
          information_type?: string | null
          latitude?: number | null
          longitude?: number | null
          person_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sighting_date?: string | null
          sighting_location?: string | null
          source_type?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          submitted_by_email?: string | null
          submitted_by_name?: string | null
          submitted_by_phone?: string | null
          submitted_by_user_id?: string | null
          updated_at?: string
        }
        Update: {
          anonymity_requested?: boolean
          assigned_organization_id?: string | null
          created_at?: string
          description?: string
          event_id?: string | null
          id?: string
          information_type?: string | null
          latitude?: number | null
          longitude?: number | null
          person_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sighting_date?: string | null
          sighting_location?: string | null
          source_type?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          submitted_by_email?: string | null
          submitted_by_name?: string | null
          submitted_by_phone?: string | null
          submitted_by_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "additional_information_reports_assigned_organization_id_fkey"
            columns: ["assigned_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "additional_information_reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "disaster_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "additional_information_reports_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_sensitive: boolean
          storage_path: string | null
          uploaded_by: string | null
          visibility: Database["public"]["Enums"]["visibility_level"]
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_sensitive?: boolean
          storage_path?: string | null
          uploaded_by?: string | null
          visibility?: Database["public"]["Enums"]["visibility_level"]
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_sensitive?: boolean
          storage_path?: string | null
          uploaded_by?: string | null
          visibility?: Database["public"]["Enums"]["visibility_level"]
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_name: string | null
          actor_org: string | null
          actor_role: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          new_data: Json | null
          organization_id: string | null
          previous_data: Json | null
          target_label: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          actor_name?: string | null
          actor_org?: string | null
          actor_role?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          organization_id?: string | null
          previous_data?: Json | null
          target_label?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          actor_name?: string | null
          actor_org?: string | null
          actor_role?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          organization_id?: string | null
          previous_data?: Json | null
          target_label?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      case_timeline: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          event_date: string
          event_type: string
          id: string
          latitude: number | null
          location: string | null
          longitude: number | null
          person_id: string
          source_entity_id: string | null
          source_entity_type: string | null
          title: string
          visibility: Database["public"]["Enums"]["visibility_level"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string
          event_type: string
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          person_id: string
          source_entity_id?: string | null
          source_entity_type?: string | null
          title: string
          visibility?: Database["public"]["Enums"]["visibility_level"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string
          event_type?: string
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          person_id?: string
          source_entity_id?: string | null
          source_entity_type?: string | null
          title?: string
          visibility?: Database["public"]["Enums"]["visibility_level"]
        }
        Relationships: [
          {
            foreignKeyName: "case_timeline_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      disappearance_details: {
        Row: {
          accompanied_by: string | null
          circumstances: string | null
          clothing_description: string | null
          created_at: string
          id: string
          intended_destination: string | null
          last_seen_date: string | null
          last_seen_location: string | null
          last_seen_time: string | null
          latitude: number | null
          longitude: number | null
          person_id: string
          source_reliability: string | null
          transport_method: string | null
          updated_at: string
        }
        Insert: {
          accompanied_by?: string | null
          circumstances?: string | null
          clothing_description?: string | null
          created_at?: string
          id?: string
          intended_destination?: string | null
          last_seen_date?: string | null
          last_seen_location?: string | null
          last_seen_time?: string | null
          latitude?: number | null
          longitude?: number | null
          person_id: string
          source_reliability?: string | null
          transport_method?: string | null
          updated_at?: string
        }
        Update: {
          accompanied_by?: string | null
          circumstances?: string | null
          clothing_description?: string | null
          created_at?: string
          id?: string
          intended_destination?: string | null
          last_seen_date?: string | null
          last_seen_location?: string | null
          last_seen_time?: string | null
          latitude?: number | null
          longitude?: number | null
          person_id?: string
          source_reliability?: string | null
          transport_method?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disappearance_details_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      disaster_events: {
        Row: {
          affected_estimate: number | null
          archived_at: string | null
          city: string | null
          country: string
          created_at: string
          created_by: string | null
          created_by_org: string | null
          custom_type: string | null
          description: string | null
          end_date: string | null
          event_code: string
          event_type: Database["public"]["Enums"]["disaster_type"]
          fatalities: number | null
          id: string
          is_demo: boolean
          latitude: number | null
          longitude: number | null
          magnitude: string | null
          missing_count: number | null
          name: string
          region: string | null
          severity: string | null
          start_date: string
          status: Database["public"]["Enums"]["disaster_status"]
          updated_at: string
        }
        Insert: {
          affected_estimate?: number | null
          archived_at?: string | null
          city?: string | null
          country: string
          created_at?: string
          created_by?: string | null
          created_by_org?: string | null
          custom_type?: string | null
          description?: string | null
          end_date?: string | null
          event_code?: string
          event_type: Database["public"]["Enums"]["disaster_type"]
          fatalities?: number | null
          id?: string
          is_demo?: boolean
          latitude?: number | null
          longitude?: number | null
          magnitude?: string | null
          missing_count?: number | null
          name: string
          region?: string | null
          severity?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["disaster_status"]
          updated_at?: string
        }
        Update: {
          affected_estimate?: number | null
          archived_at?: string | null
          city?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          created_by_org?: string | null
          custom_type?: string | null
          description?: string | null
          end_date?: string | null
          event_code?: string
          event_type?: Database["public"]["Enums"]["disaster_type"]
          fatalities?: number | null
          id?: string
          is_demo?: boolean
          latitude?: number | null
          longitude?: number | null
          magnitude?: string | null
          missing_count?: number | null
          name?: string
          region?: string | null
          severity?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["disaster_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disaster_events_created_by_org_fkey"
            columns: ["created_by_org"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          notification_type: string
          organization_id: string | null
          read_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          notification_type: string
          organization_id?: string | null
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          notification_type?: string
          organization_id?: string | null
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_memberships: {
        Row: {
          activated_at: string | null
          created_at: string
          id: string
          institutional_role: Database["public"]["Enums"]["membership_role"]
          invite_token: string | null
          invited_at: string
          invited_by: string | null
          is_demo: boolean
          organization_id: string
          profile_id: string | null
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
          user_email: string
          user_name: string | null
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          id?: string
          institutional_role?: Database["public"]["Enums"]["membership_role"]
          invite_token?: string | null
          invited_at?: string
          invited_by?: string | null
          is_demo?: boolean
          organization_id: string
          profile_id?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_email: string
          user_name?: string | null
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          id?: string
          institutional_role?: Database["public"]["Enums"]["membership_role"]
          invite_token?: string | null
          invited_at?: string
          invited_by?: string | null
          is_demo?: boolean
          organization_id?: string
          profile_id?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_email?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          approved_at: string | null
          approved_by: string | null
          archived_at: string | null
          city: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          country: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_demo: boolean
          is_reference: boolean
          name: string
          normalized_name: string
          official_email: string | null
          organization_type: Database["public"]["Enums"]["institution_type"]
          public_visibility: boolean
          region: string | null
          registration_code: string | null
          rejected_at: string | null
          short_name: string | null
          status: Database["public"]["Enums"]["org_status"]
          updated_at: string
          verification_notes: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          archived_at?: string | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_demo?: boolean
          is_reference?: boolean
          name: string
          normalized_name: string
          official_email?: string | null
          organization_type?: Database["public"]["Enums"]["institution_type"]
          public_visibility?: boolean
          region?: string | null
          registration_code?: string | null
          rejected_at?: string | null
          short_name?: string | null
          status?: Database["public"]["Enums"]["org_status"]
          updated_at?: string
          verification_notes?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          archived_at?: string | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_demo?: boolean
          is_reference?: boolean
          name?: string
          normalized_name?: string
          official_email?: string | null
          organization_type?: Database["public"]["Enums"]["institution_type"]
          public_visibility?: boolean
          region?: string | null
          registration_code?: string | null
          rejected_at?: string | null
          short_name?: string | null
          status?: Database["public"]["Enums"]["org_status"]
          updated_at?: string
          verification_notes?: string | null
          website?: string | null
        }
        Relationships: []
      }
      person_contacts: {
        Row: {
          address: string | null
          alternate_phone: string | null
          consent_to_contact: boolean
          country: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_primary: boolean
          person_id: string
          phone: string | null
          preferred_contact_method: string | null
          relationship: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          alternate_phone?: string | null
          consent_to_contact?: boolean
          country?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_primary?: boolean
          person_id: string
          phone?: string | null
          preferred_contact_method?: string | null
          relationship?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          alternate_phone?: string | null
          consent_to_contact?: boolean
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_primary?: boolean
          person_id?: string
          phone?: string | null
          preferred_contact_method?: string | null
          relationship?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_contacts_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      person_status_history: {
        Row: {
          changed_by_organization_id: string | null
          changed_by_user_id: string | null
          created_at: string
          id: string
          new_status: Database["public"]["Enums"]["person_status"]
          notes: string | null
          person_id: string
          previous_status: Database["public"]["Enums"]["person_status"] | null
          reason: string | null
          source_report_id: string | null
        }
        Insert: {
          changed_by_organization_id?: string | null
          changed_by_user_id?: string | null
          created_at?: string
          id?: string
          new_status: Database["public"]["Enums"]["person_status"]
          notes?: string | null
          person_id: string
          previous_status?: Database["public"]["Enums"]["person_status"] | null
          reason?: string | null
          source_report_id?: string | null
        }
        Update: {
          changed_by_organization_id?: string | null
          changed_by_user_id?: string | null
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["person_status"]
          notes?: string | null
          person_id?: string
          previous_status?: Database["public"]["Enums"]["person_status"] | null
          reason?: string | null
          source_report_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "person_status_history_changed_by_organization_id_fkey"
            columns: ["changed_by_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_status_history_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_status_history_source_report_id_fkey"
            columns: ["source_report_id"]
            isOneToOne: false
            referencedRelation: "additional_information_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      persons: {
        Row: {
          approximate_age: number | null
          archived_at: string | null
          blood_type: string | null
          country: string
          country_of_residence: string | null
          created_at: string
          current_status: Database["public"]["Enums"]["person_status"]
          date_of_birth: string | null
          disabilities: string | null
          display_name: string
          distinguishing_features: string | null
          document_number: string | null
          document_type: string | null
          event_id: string | null
          eye_color: string | null
          first_name: string | null
          gender: string | null
          hair_color: string | null
          height_cm: number | null
          id: string
          is_demo: boolean
          languages: string | null
          last_name: string | null
          medical_conditions: string | null
          medications: string | null
          nationality: string | null
          occupation: string | null
          photo_url: string | null
          preferred_name: string | null
          privacy_level: Database["public"]["Enums"]["visibility_level"]
          public_case_code: string
          reported_at: string
          reported_by_organization_id: string | null
          reported_by_user_id: string | null
          reporter_contact: string | null
          reporter_name: string | null
          sex: string | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          approximate_age?: number | null
          archived_at?: string | null
          blood_type?: string | null
          country: string
          country_of_residence?: string | null
          created_at?: string
          current_status?: Database["public"]["Enums"]["person_status"]
          date_of_birth?: string | null
          disabilities?: string | null
          display_name: string
          distinguishing_features?: string | null
          document_number?: string | null
          document_type?: string | null
          event_id?: string | null
          eye_color?: string | null
          first_name?: string | null
          gender?: string | null
          hair_color?: string | null
          height_cm?: number | null
          id?: string
          is_demo?: boolean
          languages?: string | null
          last_name?: string | null
          medical_conditions?: string | null
          medications?: string | null
          nationality?: string | null
          occupation?: string | null
          photo_url?: string | null
          preferred_name?: string | null
          privacy_level?: Database["public"]["Enums"]["visibility_level"]
          public_case_code?: string
          reported_at?: string
          reported_by_organization_id?: string | null
          reported_by_user_id?: string | null
          reporter_contact?: string | null
          reporter_name?: string | null
          sex?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          approximate_age?: number | null
          archived_at?: string | null
          blood_type?: string | null
          country?: string
          country_of_residence?: string | null
          created_at?: string
          current_status?: Database["public"]["Enums"]["person_status"]
          date_of_birth?: string | null
          disabilities?: string | null
          display_name?: string
          distinguishing_features?: string | null
          document_number?: string | null
          document_type?: string | null
          event_id?: string | null
          eye_color?: string | null
          first_name?: string | null
          gender?: string | null
          hair_color?: string | null
          height_cm?: number | null
          id?: string
          is_demo?: boolean
          languages?: string | null
          last_name?: string | null
          medical_conditions?: string | null
          medications?: string | null
          nationality?: string | null
          occupation?: string | null
          photo_url?: string | null
          preferred_name?: string | null
          privacy_level?: Database["public"]["Enums"]["visibility_level"]
          public_case_code?: string
          reported_at?: string
          reported_by_organization_id?: string | null
          reported_by_user_id?: string | null
          reporter_contact?: string | null
          reporter_name?: string | null
          sex?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "persons_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "disaster_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "persons_reported_by_organization_id_fkey"
            columns: ["reported_by_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      potential_matches: {
        Row: {
          created_at: string
          explanation: string | null
          generated_by: string | null
          id: string
          match_score: number
          matched_person_id: string | null
          matching_fields: Json | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_person_id: string
          source_report_id: string | null
          status: Database["public"]["Enums"]["match_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          explanation?: string | null
          generated_by?: string | null
          id?: string
          match_score?: number
          matched_person_id?: string | null
          matching_fields?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_person_id: string
          source_report_id?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          explanation?: string | null
          generated_by?: string | null
          id?: string
          match_score?: number
          matched_person_id?: string | null
          matching_fields?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_person_id?: string
          source_report_id?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "potential_matches_matched_person_id_fkey"
            columns: ["matched_person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "potential_matches_source_person_id_fkey"
            columns: ["source_person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "potential_matches_source_report_id_fkey"
            columns: ["source_report_id"]
            isOneToOne: false
            referencedRelation: "additional_information_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auth_user_id: string
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          last_login_at: string | null
          organization_id: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          organization_id?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          organization_id?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rescue_intakes: {
        Row: {
          chain_events: Json | null
          code: string
          created_at: string
          event_id: string | null
          id: string
          intake_at: string
          intake_location: string | null
          is_demo: boolean
          notes: string | null
          person_id: string | null
          rescuer_name: string | null
          rescuer_organization: string | null
          updated_at: string
        }
        Insert: {
          chain_events?: Json | null
          code: string
          created_at?: string
          event_id?: string | null
          id?: string
          intake_at?: string
          intake_location?: string | null
          is_demo?: boolean
          notes?: string | null
          person_id?: string | null
          rescuer_name?: string | null
          rescuer_organization?: string | null
          updated_at?: string
        }
        Update: {
          chain_events?: Json | null
          code?: string
          created_at?: string
          event_id?: string | null
          id?: string
          intake_at?: string
          intake_location?: string | null
          is_demo?: boolean
          notes?: string | null
          person_id?: string | null
          rescuer_name?: string | null
          rescuer_organization?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rescue_intakes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "disaster_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rescue_intakes_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      safe_ids: {
        Row: {
          audience: Database["public"]["Enums"]["visibility_level"]
          code: string
          created_at: string
          created_by: string | null
          data: Json | null
          id: string
          is_demo: boolean
          person_id: string | null
          updated_at: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["visibility_level"]
          code: string
          created_at?: string
          created_by?: string | null
          data?: Json | null
          id?: string
          is_demo?: boolean
          person_id?: string | null
          updated_at?: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["visibility_level"]
          code?: string
          created_at?: string
          created_by?: string | null
          data?: Json | null
          id?: string
          is_demo?: boolean
          person_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "safe_ids_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      search_logs: {
        Row: {
          created_at: string
          id: string
          organization_id: string | null
          result_count: number | null
          search_parameters: Json | null
          search_type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string | null
          result_count?: number | null
          search_parameters?: Json | null
          search_type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string | null
          result_count?: number | null
          search_parameters?: Json | null
          search_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_reviews: {
        Row: {
          created_at: string
          decision: Database["public"]["Enums"]["verification_decision"]
          id: string
          match_id: string | null
          notes: string | null
          organization_id: string | null
          person_id: string | null
          report_id: string | null
          reviewer_user_id: string | null
          supporting_evidence: string | null
          updated_at: string
          verification_level: string | null
        }
        Insert: {
          created_at?: string
          decision: Database["public"]["Enums"]["verification_decision"]
          id?: string
          match_id?: string | null
          notes?: string | null
          organization_id?: string | null
          person_id?: string | null
          report_id?: string | null
          reviewer_user_id?: string | null
          supporting_evidence?: string | null
          updated_at?: string
          verification_level?: string | null
        }
        Update: {
          created_at?: string
          decision?: Database["public"]["Enums"]["verification_decision"]
          id?: string
          match_id?: string | null
          notes?: string | null
          organization_id?: string | null
          person_id?: string | null
          report_id?: string | null
          reviewer_user_id?: string | null
          supporting_evidence?: string | null
          updated_at?: string
          verification_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_reviews_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "potential_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_reviews_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_reviews_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "additional_information_reports"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_master_admin: { Args: { _code: string }; Returns: boolean }
      compute_person_matches: { Args: { _person_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_master: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      purge_demo_data: { Args: never; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role: "master_admin" | "administrator" | "reviewer" | "viewer"
      disaster_status: "draft" | "active" | "monitoring" | "closed" | "archived"
      disaster_type:
        | "earthquake"
        | "war"
        | "flood"
        | "tsunami"
        | "hurricane"
        | "storm"
        | "landslide"
        | "wildfire"
        | "volcano"
        | "humanitarian"
        | "accident"
        | "other"
      institution_type:
        | "un_agency"
        | "red_cross"
        | "civil_protection"
        | "fire"
        | "usar"
        | "hospital"
        | "forensic"
        | "shelter"
        | "humanitarian"
        | "child_protection"
        | "migration"
        | "government"
        | "other"
      match_status:
        | "suggested"
        | "pending_review"
        | "confirmed"
        | "rejected"
        | "merged"
      membership_role: "reviewer" | "viewer"
      membership_status: "invited" | "active" | "suspended" | "revoked"
      org_status:
        | "pending"
        | "approved"
        | "rejected"
        | "suspended"
        | "archived"
        | "reference"
      person_status:
        | "reported"
        | "missing"
        | "searching"
        | "possible_match"
        | "information_received"
        | "located"
        | "identified"
        | "contacted"
        | "found"
        | "reunited"
        | "deceased"
        | "case_closed"
        | "archived"
      report_status:
        | "received"
        | "pending_review"
        | "under_verification"
        | "verified"
        | "rejected"
        | "incorporated"
        | "archived"
      verification_decision:
        | "approved"
        | "rejected"
        | "needs_more_info"
        | "escalated"
      visibility_level: "public" | "institutional" | "restricted" | "internal"
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
      app_role: ["master_admin", "administrator", "reviewer", "viewer"],
      disaster_status: ["draft", "active", "monitoring", "closed", "archived"],
      disaster_type: [
        "earthquake",
        "war",
        "flood",
        "tsunami",
        "hurricane",
        "storm",
        "landslide",
        "wildfire",
        "volcano",
        "humanitarian",
        "accident",
        "other",
      ],
      institution_type: [
        "un_agency",
        "red_cross",
        "civil_protection",
        "fire",
        "usar",
        "hospital",
        "forensic",
        "shelter",
        "humanitarian",
        "child_protection",
        "migration",
        "government",
        "other",
      ],
      match_status: [
        "suggested",
        "pending_review",
        "confirmed",
        "rejected",
        "merged",
      ],
      membership_role: ["reviewer", "viewer"],
      membership_status: ["invited", "active", "suspended", "revoked"],
      org_status: [
        "pending",
        "approved",
        "rejected",
        "suspended",
        "archived",
        "reference",
      ],
      person_status: [
        "reported",
        "missing",
        "searching",
        "possible_match",
        "information_received",
        "located",
        "identified",
        "contacted",
        "found",
        "reunited",
        "deceased",
        "case_closed",
        "archived",
      ],
      report_status: [
        "received",
        "pending_review",
        "under_verification",
        "verified",
        "rejected",
        "incorporated",
        "archived",
      ],
      verification_decision: [
        "approved",
        "rejected",
        "needs_more_info",
        "escalated",
      ],
      visibility_level: ["public", "institutional", "restricted", "internal"],
    },
  },
} as const
