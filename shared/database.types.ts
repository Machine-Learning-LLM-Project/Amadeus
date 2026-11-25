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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      class_meetings: {
        Row: {
          created_at: string
          days: string[]
          end_time: string
          id: string
          location: string | null
          name: string
          start_time: string
          term_end: string
          term_start: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days: string[]
          end_time: string
          id?: string
          location?: string | null
          name: string
          start_time: string
          term_end: string
          term_start: string
          user_id?: string
        }
        Update: {
          created_at?: string
          days?: string[]
          end_time?: string
          id?: string
          location?: string | null
          name?: string
          start_time?: string
          term_end?: string
          term_start?: string
          user_id?: string
        }
        Relationships: []
      }
      commitments: {
        Row: {
          created_at: string
          end_at: string
          id: string
          kind: string
          start_at: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_at: string
          id?: string
          kind: string
          start_at: string
          title: string
          user_id?: string
        }
        Update: {
          created_at?: string
          end_at?: string
          id?: string
          kind?: string
          start_at?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      schedule_blocks: {
        Row: {
          ai_generated: boolean
          created_at: string
          end_at: string
          id: string
          session_count: number
          session_index: number
          start_at: string
          status: string
          task_id: string
          user_id: string
        }
        Insert: {
          ai_generated?: boolean
          created_at?: string
          end_at: string
          id?: string
          session_count: number
          session_index: number
          start_at: string
          status?: string
          task_id: string
          user_id?: string
        }
        Update: {
          ai_generated?: boolean
          created_at?: string
          end_at?: string
          id?: string
          session_count?: number
          session_index?: number
          start_at?: string
          status?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_blocks_task_id_user_id_fkey"
            columns: ["task_id", "user_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      tasks: {
        Row: {
          course: string | null
          created_at: string
          description: string | null
          due_at: string
          estimated_minutes: number | null
          id: string
          min_session_minutes: number | null
          priority: number | null
          source: string
          splittable: boolean
          status: string
          title: string
          user_id: string
        }
        Insert: {
          course?: string | null
          created_at?: string
          description?: string | null
          due_at: string
          estimated_minutes?: number | null
          id?: string
          min_session_minutes?: number | null
          priority?: number | null
          source?: string
          splittable?: boolean
          status?: string
          title: string
          user_id?: string
        }
        Update: {
          course?: string | null
          created_at?: string
          description?: string | null
          due_at?: string
          estimated_minutes?: number | null
          id?: string
          min_session_minutes?: number | null
          priority?: number | null
          source?: string
          splittable?: boolean
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      usage_log: {
        Row: {
          attempt: number
          cost_usd: number
          created_at: string
          error: string | null
          feature: string
          id: string
          input_tokens: number
          latency_ms: number
          mode: string
          model: string
          ok: boolean
          output_tokens: number
          user_id: string | null
        }
        Insert: {
          attempt?: number
          cost_usd: number
          created_at?: string
          error?: string | null
          feature: string
          id?: string
          input_tokens: number
          latency_ms: number
          mode: string
          model: string
          ok: boolean
          output_tokens: number
          user_id?: string | null
        }
        Update: {
          attempt?: number
          cost_usd?: number
          created_at?: string
          error?: string | null
          feature?: string
          id?: string
          input_tokens?: number
          latency_ms?: number
          mode?: string
          model?: string
          ok?: boolean
          output_tokens?: number
          user_id?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          buffer_minutes: number
          created_at: string
          day_end: string
          day_start: string
          max_session_minutes: number
          timezone: string
          user_id: string
        }
        Insert: {
          buffer_minutes?: number
          created_at?: string
          day_end?: string
          day_start?: string
          max_session_minutes?: number
          timezone: string
          user_id?: string
        }
        Update: {
          buffer_minutes?: number
          created_at?: string
          day_end?: string
          day_start?: string
          max_session_minutes?: number
          timezone?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
