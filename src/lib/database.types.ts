
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      recipes: {
        Row: {
          id: string
          title: string
          calories: number
          protein: number
          carbs: number
          fat: number
          imgurl: string | null // Lowercase column name as in the database
          ingredients: string[] | null
          instructions: string[] | null
          categories: string[] | null
          website: string | null
          servings: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          calories: number
          protein: number
          carbs: number
          fat: number
          imgurl?: string | null // Lowercase column name as in the database
          ingredients?: string[] | null
          instructions?: string[] | null
          categories?: string[] | null
          website?: string | null
          servings?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          calories?: number
          protein?: number
          carbs?: number
          fat?: number
          imgurl?: string | null // Lowercase column name as in the database
          ingredients?: string[] | null
          instructions?: string[] | null
          categories?: string[] | null
          website?: string | null
          servings?: string | null
          created_at?: string
        }
      }
    }
  }
}
