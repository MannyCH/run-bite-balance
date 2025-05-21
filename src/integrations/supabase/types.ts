export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          fat: number
          id: string
          imgurl: string | null
          ingredients: string[] | null
          instructions: string[] | null
          is_ai_generated: boolean | null
          is_blob_url: boolean | null
          main_ingredient: string | null
          protein: number
          servings: string | null
          title: string
          website: string | null
        }
        Insert: {
          calories?: number
          carbs?: number
          categories?: string[] | null
          created_at?: string
          fat?: number
          id?: string
          imgurl?: string | null
          ingredients?: string[] | null
          instructions?: string[] | null
          is_ai_generated?: boolean | null
          is_blob_url?: boolean | null
          main_ingredient?: string | null
          protein?: number
          servings?: string | null
          title: string
          website?: string | null
        }
        Update: {
          calories?: number
          carbs?: number
          categories?: string[] | null
          created_at?: string
          fat?: number
          id?: string
          imgurl?: string | null
          ingredients?: string[] | null
          instructions?: string[] | null
          is_ai_generated?: boolean | null
          is_blob_url?: boolean | null
          main_ingredient?: string | null
          protein?: number
          servings?: string | null
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
