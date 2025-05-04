
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
          imgurl?: string // Note the lowercase 'url' to match our database
          ingredients?: string[]
          instructions?: string[]
          categories?: string[]
          website?: string
          servings?: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          calories: number
          protein: number
          carbs: number
          fat: number
          imgurl?: string // Note the lowercase 'url' to match our database
          ingredients?: string[]
          instructions?: string[]
          categories?: string[]
          website?: string
          servings?: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          calories?: number
          protein?: number
          carbs?: number
          fat?: number
          imgurl?: string // Note the lowercase 'url' to match our database
          ingredients?: string[]
          instructions?: string[]
          categories?: string[]
          website?: string
          servings?: string
          created_at?: string
        }
      }
    }
  }
}
