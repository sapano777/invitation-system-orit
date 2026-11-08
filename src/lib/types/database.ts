// Mirrors supabase/migrations. Keep in sync when the schema changes, or
// regenerate with: npx supabase gen types typescript --project-id <id>

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type EventType = "private" | "business";
export type RegistrationStatus = "confirmed" | "cancelled";
export type RegistrationSource = "self" | "manual";

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
          reminder_offset_hours: number;
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
          reminder_offset_hours?: number;
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
    };
    Views: { [_ in never]: never };
    Functions: {
      is_staff: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type EventRow = Database["public"]["Tables"]["events"]["Row"];
export type RegistrationRow = Database["public"]["Tables"]["registrations"]["Row"];
