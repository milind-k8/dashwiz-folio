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
      email_monitors: {
        Row: {
          bank_patterns: Json
          created_at: string
          gmail_history_id: string | null
          id: string
          last_processed_timestamp: string | null
          monitoring_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          bank_patterns?: Json
          created_at?: string
          gmail_history_id?: string | null
          id?: string
          last_processed_timestamp?: string | null
          monitoring_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          bank_patterns?: Json
          created_at?: string
          gmail_history_id?: string | null
          id?: string
          last_processed_timestamp?: string | null
          monitoring_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_processing_queue: {
        Row: {
          created_at: string
          email_id: string
          error_message: string | null
          gmail_message_id: string
          id: string
          max_retries: number
          processed_at: string | null
          retry_count: number
          scheduled_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_id: string
          error_message?: string | null
          gmail_message_id: string
          id?: string
          max_retries?: number
          processed_at?: string | null
          retry_count?: number
          scheduled_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_id?: string
          error_message?: string | null
          gmail_message_id?: string
          id?: string
          max_retries?: number
          processed_at?: string | null
          retry_count?: number
          scheduled_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      merchants: {
        Row: {
          category: string | null
          created_at: string
          merchant_name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          merchant_name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          merchant_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      processing_logs: {
        Row: {
          created_at: string
          details: Json | null
          id: string
          log_level: string
          message: string
          queue_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          id?: string
          log_level?: string
          message: string
          queue_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          id?: string
          log_level?: string
          message?: string
          queue_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          bank_id: string
          created_at: string
          id: string
          mail_id: string
          mail_time: string
          merchant: string | null
          snippet: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          bank_id: string
          created_at?: string
          id?: string
          mail_id: string
          mail_time: string
          merchant?: string | null
          snippet?: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_id?: string
          created_at?: string
          id?: string
          mail_id?: string
          mail_time?: string
          merchant?: string | null
          snippet?: string | null
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_transactions_bank"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "user_banks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_banks: {
        Row: {
          bank_account_no: string
          bank_name: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bank_account_no: string
          bank_name: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bank_account_no?: string
          bank_name?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_transactions_with_details: {
        Args: { months_back?: number; user_uuid: string }
        Returns: {
          amount: number
          bank_account_no: string
          bank_id: string
          bank_name: string
          category: string
          created_at: string
          mail_id: string
          mail_time: string
          merchant: string
          snippet: string
          transaction_id: string
          transaction_type: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      transaction_type: "debit" | "credit" | "balance"
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
      transaction_type: ["debit", "credit", "balance"],
    },
  },
} as const
