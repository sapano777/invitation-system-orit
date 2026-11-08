// Mirrors supabase/migrations. Keep in sync when the schema changes, or
// regenerate with: npx supabase gen types typescript --project-id <id>

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type EventType = "private" | "business";
export type RegistrationStatus = "confirmed" | "cancelled";
export type RegistrationSource = "self" | "manual";
export type EmailKind = "reminder_auto" | "reminder_manual" | "test";
export type EmailStatus = "sent" | "failed" | "dry_run";

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      staff: {
        Row: {
          user_id: string;
          display_name: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          display_name?: string | null;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          display_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          slug: string;
          title: string;
          event_type: EventType;
          description: string | null;
          date_time: string;
          venue_name: string | null;
          address: string | null;
          lat: number | null;
          lng: number | null;
          template_id: string;
          media_url: string | null;
          primary_color: string | null;
          gift_link_url: string | null;
          reminder_offset_hours: number | null;
          reminder_sent_at: string | null;
          rsvp_deadline: string | null;
          max_guests: number | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          event_type?: EventType;
          description?: string | null;
          date_time: string;
          venue_name?: string | null;
          address?: string | null;
          lat?: number | null;
          lng?: number | null;
          template_id?: string;
          media_url?: string | null;
          primary_color?: string | null;
          gift_link_url?: string | null;
          reminder_offset_hours?: number | null;
          reminder_sent_at?: string | null;
          rsvp_deadline?: string | null;
          max_guests?: number | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [];
      };
      registrations: {
        Row: {
          id: string;
          event_id: string;
          full_name: string;
          phone: string;
          email: string | null;
          guest_count: number;
          guest_names: Json;
          notes: string | null;
          status: RegistrationStatus;
          source: RegistrationSource;
          locale: "he" | "en";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          full_name: string;
          phone: string;
          email?: string | null;
          guest_count?: number;
          guest_names?: Json;
          notes?: string | null;
          status?: RegistrationStatus;
          source?: RegistrationSource;
          locale?: "he" | "en";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["registrations"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "registrations_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      email_log: {
        Row: {
          id: string;
          event_id: string | null;
          registration_id: string | null;
          kind: EmailKind;
          to_email: string;
          status: EmailStatus;
          provider: string | null;
          provider_id: string | null;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id?: string | null;
          registration_id?: string | null;
          kind: EmailKind;
          to_email: string;
          status: EmailStatus;
          provider?: string | null;
          provider_id?: string | null;
          error?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["email_log"]["Insert"]>;
        Relationships: [];
      };
      event_tables: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          capacity: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          capacity: number;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["event_tables"]["Insert"]>;
        Relationships: [];
      };
      registration_tables: {
        Row: {
          registration_id: string;
          event_id: string;
          table_id: string;
          assigned_at: string;
        };
        Insert: {
          registration_id: string;
          event_id: string;
          table_id: string;
          assigned_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["registration_tables"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_staff: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      get_public_event: {
        Args: { p_slug: string };
        Returns: Array<
          Pick<
            Database["public"]["Tables"]["events"]["Row"],
            | "id"
            | "slug"
            | "title"
            | "event_type"
            | "description"
            | "date_time"
            | "venue_name"
            | "address"
            | "lat"
            | "lng"
            | "template_id"
            | "media_url"
            | "primary_color"
            | "gift_link_url"
            | "rsvp_deadline"
            | "max_guests"
            | "is_active"
            | "updated_at"
          > & { guests_taken: number }
        >;
      };
      register_guest: {
        Args: {
          p_slug: string;
          p_full_name: string;
          p_phone: string;
          p_email: string | null;
          p_guest_count: number;
          p_guest_names: Json;
          p_notes: string | null;
          p_locale: string;
        };
        Returns: Json;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type EventRow = Database["public"]["Tables"]["events"]["Row"];
export type RegistrationRow = Database["public"]["Tables"]["registrations"]["Row"];
export type EmailLogRow = Database["public"]["Tables"]["email_log"]["Row"];
export type EventTableRow = Database["public"]["Tables"]["event_tables"]["Row"];
