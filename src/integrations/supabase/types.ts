export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      meal_plan_items: {
        Row: {
          calories: number | null
          carbs: number | null
          custom_title: string | null
          date: string
          fat: number | null
          id: string
          is_ai_generated: boolean | null
          main_ingredient: string | null
          meal_plan_id: string
          meal_type: string
          nutritional_context: string | null
          protein: number | null
          recipe_id: string | null
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          custom_title?: string | null
          date: string
          fat?: number | null
          id?: string
          is_ai_generated?: boolean | null
          main_ingredient?: string | null
          meal_plan_id: string
          meal_type: string
          nutritional_context?: string | null
          protein?: number | null
          recipe_id?: string | null
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          custom_title?: string | null
          date?: string
          fat?: number | null
          id?: string
          is_ai_generated?: boolean | null
          main_ingredient?: string | null
          meal_plan_id?: string
          meal_type?: string
          nutritional_context?: string | null
          protein?: number | null
          recipe_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_items_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plan_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          created_at: string
          id: string
          status: string
          user_id: string
          week_end_date: string
          week_start_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          user_id: string
          week_end_date: string
          week_start_date: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          user_id?: string
          week_end_date?: string
          week_start_date?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          ai_recipe_ratio: number | null
          avatar_url: string | null
          batch_cooking_enabled: boolean | null
          batch_cooking_intensity: string | null
          batch_cooking_people: number | null
          bmr: number | null
          created_at: string
          dietary_preferences: string[] | null
          fitness_goal: string | null
          food_allergies: string[] | null
          foods_to_avoid: string[] | null
          gender: string | null
          height: number | null
          ical_feed_url: string | null
          id: string
          meal_complexity: string | null
          nutritional_theory: string | null
          preferred_cuisines: string[] | null
          target_weight: number | null
          updated_at: string
          username: string | null
          weight: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          ai_recipe_ratio?: number | null
          avatar_url?: string | null
          batch_cooking_enabled?: boolean | null
          batch_cooking_intensity?: string | null
          batch_cooking_people?: number | null
          bmr?: number | null
          created_at?: string
          dietary_preferences?: string[] | null
          fitness_goal?: string | null
          food_allergies?: string[] | null
          foods_to_avoid?: string[] | null
          gender?: string | null
          height?: number | null
          ical_feed_url?: string | null
          id: string
          meal_complexity?: string | null
          nutritional_theory?: string | null
          preferred_cuisines?: string[] | null
          target_weight?: number | null
          updated_at?: string
          username?: string | null
          weight?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          ai_recipe_ratio?: number | null
          avatar_url?: string | null
          batch_cooking_enabled?: boolean | null
          batch_cooking_intensity?: string | null
          batch_cooking_people?: number | null
          bmr?: number | null
          created_at?: string
          dietary_preferences?: string[] | null
          fitness_goal?: string | null
          food_allergies?: string[] | null
          foods_to_avoid?: string[] | null
          gender?: string | null
          height?: number | null
          ical_feed_url?: string | null
          id?: string
          meal_complexity?: string | null
          nutritional_theory?: string | null
          preferred_cuisines?: string[] | null
          target_weight?: number | null
          updated_at?: string
          username?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      recipes: {
        Row: {
          calories: number
          carbs: number
          categories: string[] | null
          created_at: string
          dish_type: string | null
          fat: number
          id: string
          imgurl: string | null
          ingredients: string[] | null
          instructions: string[] | null
          is_ai_generated: boolean | null
          is_blob_url: boolean | null
          main_ingredient: string | null
          meal_type: string[] | null
          protein: number
          seasonal_suitability: string[] | null
          servings: string | null
          temperature_preference: string | null
          title: string
          website: string | null
        }
        Insert: {
          calories?: number
          carbs?: number
          categories?: string[] | null
          created_at?: string
          dish_type?: string | null
          fat?: number
          id?: string
          imgurl?: string | null
          ingredients?: string[] | null
          instructions?: string[] | null
          is_ai_generated?: boolean | null
          is_blob_url?: boolean | null
          main_ingredient?: string | null
          meal_type?: string[] | null
          protein?: number
          seasonal_suitability?: string[] | null
          servings?: string | null
          temperature_preference?: string | null
          title: string
          website?: string | null
        }
        Update: {
          calories?: number
          carbs?: number
          categories?: string[] | null
          created_at?: string
          dish_type?: string | null
          fat?: number
          id?: string
          imgurl?: string | null
          ingredients?: string[] | null
          instructions?: string[] | null
          is_ai_generated?: boolean | null
          is_blob_url?: boolean | null
          main_ingredient?: string | null
          meal_type?: string[] | null
          protein?: number
          seasonal_suitability?: string[] | null
          servings?: string | null
          temperature_preference?: string | null
          title?: string
          website?: string | null
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
    Enums: {},
  },
} as const
