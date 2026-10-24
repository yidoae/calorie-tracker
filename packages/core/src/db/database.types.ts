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
      ai_requests: {
        Row: {
          created_at: string
          error: string | null
          finished_at: string | null
          id: string
          input_tokens: number | null
          kind: string
          latency_ms: number | null
          local_date: string
          model: string | null
          output_tokens: number | null
          request_key: string
          result: Json | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          input_tokens?: number | null
          kind: string
          latency_ms?: number | null
          local_date: string
          model?: string | null
          output_tokens?: number | null
          request_key: string
          result?: Json | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          input_tokens?: number | null
          kind?: string
          latency_ms?: number | null
          local_date?: string
          model?: string | null
          output_tokens?: number | null
          request_key?: string
          result?: Json | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      food_aliases: {
        Row: {
          alias: string
          alias_normalized: string | null
          food_id: string
        }
        Insert: {
          alias: string
          alias_normalized?: string | null
          food_id: string
        }
        Update: {
          alias?: string
          alias_normalized?: string | null
          food_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_aliases_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      food_portions: {
        Row: {
          food_id: string
          grams: number
          position: number
          unit: string
        }
        Insert: {
          food_id: string
          grams: number
          position?: number
          unit: string
        }
        Update: {
          food_id?: string
          grams?: number
          position?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_portions_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      foods: {
        Row: {
          alcohol_per_100g: number
          carbs_per_100g: number
          category: string
          fat_per_100g: number
          id: string
          kcal_per_100g: number
          name_tr: string
          protein_per_100g: number
          searchable: boolean
          source_kind: string
          source_ref: string
          typical_portion_g: number
        }
        Insert: {
          alcohol_per_100g?: number
          carbs_per_100g: number
          category: string
          fat_per_100g: number
          id: string
          kcal_per_100g: number
          name_tr: string
          protein_per_100g: number
          searchable?: boolean
          source_kind: string
          source_ref: string
          typical_portion_g: number
        }
        Update: {
          alcohol_per_100g?: number
          carbs_per_100g?: number
          category?: string
          fat_per_100g?: number
          id?: string
          kcal_per_100g?: number
          name_tr?: string
          protein_per_100g?: number
          searchable?: boolean
          source_kind?: string
          source_ref?: string
          typical_portion_g?: number
        }
        Relationships: []
      }
      meal_items: {
        Row: {
          carbs_per_100g: number
          created_at: string
          fat_per_100g: number
          food_id: string
          grams: number
          id: string
          kcal_per_100g: number
          meal_id: string
          position: number
          protein_per_100g: number
          user_id: string
        }
        Insert: {
          carbs_per_100g?: number
          created_at?: string
          fat_per_100g?: number
          food_id: string
          grams: number
          id?: string
          kcal_per_100g?: number
          meal_id: string
          position?: number
          protein_per_100g?: number
          user_id: string
        }
        Update: {
          carbs_per_100g?: number
          created_at?: string
          fat_per_100g?: number
          food_id?: string
          grams?: number
          id?: string
          kcal_per_100g?: number
          meal_id?: string
          position?: number
          protein_per_100g?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_items_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          created_at: string
          id: string
          local_date: string
          logged_at: string
          name: string
          slot: Database["public"]["Enums"]["meal_slot"]
          time_zone: string
          total_carbs_g: number
          total_fat_g: number
          total_kcal: number
          total_protein_g: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          local_date: string
          logged_at?: string
          name: string
          slot: Database["public"]["Enums"]["meal_slot"]
          time_zone: string
          total_carbs_g?: number
          total_fat_g?: number
          total_kcal?: number
          total_protein_g?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          local_date?: string
          logged_at?: string
          name?: string
          slot?: Database["public"]["Enums"]["meal_slot"]
          time_zone?: string
          total_carbs_g?: number
          total_fat_g?: number
          total_kcal?: number
          total_protein_g?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_plans: {
        Row: {
          base_carbs_g: number
          base_fat_g: number
          base_kcal: number
          base_protein_g: number
          bmr: number
          created_at: string
          id: string
          inputs: Json
          is_active: boolean
          rest_carbs_g: number | null
          rest_fat_g: number | null
          rest_kcal: number | null
          rest_protein_g: number | null
          summary: string
          tdee: number
          training_carbs_g: number | null
          training_days: number[]
          training_fat_g: number | null
          training_kcal: number | null
          training_protein_g: number | null
          user_id: string
        }
        Insert: {
          base_carbs_g: number
          base_fat_g: number
          base_kcal: number
          base_protein_g: number
          bmr: number
          created_at?: string
          id?: string
          inputs: Json
          is_active?: boolean
          rest_carbs_g?: number | null
          rest_fat_g?: number | null
          rest_kcal?: number | null
          rest_protein_g?: number | null
          summary?: string
          tdee: number
          training_carbs_g?: number | null
          training_days?: number[]
          training_fat_g?: number | null
          training_kcal?: number | null
          training_protein_g?: number | null
          user_id: string
        }
        Update: {
          base_carbs_g?: number
          base_fat_g?: number
          base_kcal?: number
          base_protein_g?: number
          bmr?: number
          created_at?: string
          id?: string
          inputs?: Json
          is_active?: boolean
          rest_carbs_g?: number | null
          rest_fat_g?: number | null
          rest_kcal?: number | null
          rest_protein_g?: number | null
          summary?: string
          tdee?: number
          training_carbs_g?: number | null
          training_days?: number[]
          training_fat_g?: number | null
          training_kcal?: number | null
          training_protein_g?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activity_level: Database["public"]["Enums"]["activity_level"] | null
          birth_year: number | null
          created_at: string
          diet_style: Database["public"]["Enums"]["diet_style"] | null
          fat_per_kg: number
          goal_weight_kg: number | null
          height_cm: number | null
          id: string
          onboarding_completed: boolean
          sensitive_warning_ack: boolean
          sex: Database["public"]["Enums"]["sex"] | null
          time_zone: string | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          birth_year?: number | null
          created_at?: string
          diet_style?: Database["public"]["Enums"]["diet_style"] | null
          fat_per_kg?: number
          goal_weight_kg?: number | null
          height_cm?: number | null
          id: string
          onboarding_completed?: boolean
          sensitive_warning_ack?: boolean
          sex?: Database["public"]["Enums"]["sex"] | null
          time_zone?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          birth_year?: number | null
          created_at?: string
          diet_style?: Database["public"]["Enums"]["diet_style"] | null
          fat_per_kg?: number
          goal_weight_kg?: number | null
          height_cm?: number | null
          id?: string
          onboarding_completed?: boolean
          sensitive_warning_ack?: boolean
          sex?: Database["public"]["Enums"]["sex"] | null
          time_zone?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      workout_programs: {
        Row: {
          days: Json
          name: string
          split: string
          user_id: string
        }
        Insert: {
          days: Json
          name: string
          split: string
          user_id?: string
        }
        Update: {
          days?: Json
          name?: string
          split?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_programs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          created_at: string
          day_name: string
          exercises: Json
          id: string
          performed_on: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_name: string
          exercises: Json
          id?: string
          performed_on: string
          user_id?: string
        }
        Update: {
          created_at?: string
          day_name?: string
          exercises?: Json
          id?: string
          performed_on?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ai_allowance: {
        Args: never
        Returns: {
          limit: number
          resets_at: string
          used: number
        }[]
      }
      ai_claim: {
        Args: { kind: string; request_key: string; user_id: string }
        Returns: Json
      }
      ai_finish: {
        Args: {
          error: string
          id: string
          input_tokens: number
          latency_ms: number
          model: string
          output_tokens: number
          result: Json
          status: string
        }
        Returns: undefined
      }
      check_plan_day: {
        Args: {
          carbs: number
          fat: number
          kcal: number
          protein: number
          sex: string
        }
        Returns: undefined
      }
      complete_onboarding: {
        Args: { answers: Json; plan: Json }
        Returns: {
          activity_level: Database["public"]["Enums"]["activity_level"] | null
          birth_year: number | null
          created_at: string
          diet_style: Database["public"]["Enums"]["diet_style"] | null
          fat_per_kg: number
          goal_weight_kg: number | null
          height_cm: number | null
          id: string
          onboarding_completed: boolean
          sensitive_warning_ack: boolean
          sex: Database["public"]["Enums"]["sex"] | null
          time_zone: string | null
          updated_at: string
          weight_kg: number | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      log_meal: {
        Args: {
          items: Json
          local_date: string
          name: string
          slot: Database["public"]["Enums"]["meal_slot"]
          time_zone: string
        }
        Returns: {
          created_at: string
          id: string
          local_date: string
          logged_at: string
          name: string
          slot: Database["public"]["Enums"]["meal_slot"]
          time_zone: string
          total_carbs_g: number
          total_fat_g: number
          total_kcal: number
          total_protein_g: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "meals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      normalize_tr: { Args: { t: string }; Returns: string }
      recompute_meal_totals: { Args: { target: string }; Returns: undefined }
      save_plan: {
        Args: { plan: Json }
        Returns: {
          base_carbs_g: number
          base_fat_g: number
          base_kcal: number
          base_protein_g: number
          bmr: number
          created_at: string
          id: string
          inputs: Json
          is_active: boolean
          rest_carbs_g: number | null
          rest_fat_g: number | null
          rest_kcal: number | null
          rest_protein_g: number | null
          summary: string
          tdee: number
          training_carbs_g: number | null
          training_days: number[]
          training_fat_g: number | null
          training_kcal: number | null
          training_protein_g: number | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "nutrition_plans"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      search_foods: {
        Args: { max_results?: number; q: string }
        Returns: {
          carbs_per_100g: number
          fat_per_100g: number
          food_id: string
          kcal_per_100g: number
          matched_alias: string
          name_tr: string
          portions: Json
          protein_per_100g: number
          score: number
          typical_portion_g: number
        }[]
      }
    }
    Enums: {
      activity_level:
        | "sedentary"
        | "light"
        | "moderate"
        | "active"
        | "veryActive"
      diet_style: "highProtein" | "lowCarb" | "keto" | "iifym"
      meal_slot: "breakfast" | "lunch" | "dinner" | "snack"
      sex: "male" | "female"
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
    Enums: {
      activity_level: [
        "sedentary",
        "light",
        "moderate",
        "active",
        "veryActive",
      ],
      diet_style: ["highProtein", "lowCarb", "keto", "iifym"],
      meal_slot: ["breakfast", "lunch", "dinner", "snack"],
      sex: ["male", "female"],
    },
  },
} as const
