
// Shared types used across the application

// Meal type
export interface Meal {
  id: string;
  title: string;
  date: Date;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  isPlanned: boolean;
  recipeId?: string;
  imgUrl?: string;
  main_ingredient?: string; 
}

// Run type
export interface Run {
  id: string;
  title: string;
  date: Date;
  distance: number;
  duration: number;
  pace: number;
  isPlanned: boolean;
  route?: string;
  imgUrl?: string;
  isImported?: boolean; // Flag to identify imported runs
}

// Base recipe type
export interface Recipe {
  id: string;
  title: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imgUrl?: string;
  isBlobUrl?: boolean; // For backward compatibility
  ingredients?: string[];
  instructions?: string[];
  categories?: string[];
  website?: string;
  servings?: string;
  is_ai_generated?: boolean; // Flag for AI-generated recipes
  main_ingredient?: string; // Added to match database schema for variety checks
}

// Extended recipe used during processing or DB work
export interface ExtendedRecipe extends Recipe {
  created_at: string;
  content_hash?: string;
}

// Context type definition
export interface AppContextType {
  meals: Meal[];
  runs: Run[];
  recipes: Recipe[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  addMeal: (meal: Omit<Meal, "id">) => void;
  updateMeal: (meal: Meal) => void;
  removeMeal: (id: string) => void;
  addRun: (run: Omit<Run, "id">) => void;
  updateRun: (run: Run) => void;
  removeRun: (id: string) => void;
  planRecipeAsMeal: (recipe: Recipe, date: Date) => void;
  importRunsFromIcal: (url: string) => Promise<void>;
  isLoadingImportedRuns: boolean;
  importRecipes: (recipes: Recipe[]) => Promise<void>;
  isLoadingRecipes: boolean;
}
