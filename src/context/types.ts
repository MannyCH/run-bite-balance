
export interface Recipe {
  id: string;
  title: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imgUrl?: string;
  ingredients?: string[];
  instructions?: string[];
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  difficulty?: string;
  cuisine?: string;
  tags?: string[];
  season?: 'spring' | 'summer' | 'autumn' | 'winter' | null;
  mealTypes?: Array<'breakfast' | 'lunch' | 'dinner' | 'snack'>;
}

export interface Meal {
  id: string;
  title: string;
  date: Date;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  isPlanned?: boolean;
  recipeId?: string;
  imgUrl?: string;
}

export interface Run {
  id: string;
  title: string;
  date: Date;
  distance: number; // in kilometers
  duration: number; // in seconds
  pace: number; // in minutes per km (as decimal, e.g., 5.5 for 5:30)
  route?: string;
  isPlanned?: boolean;
  imgUrl?: string;
  isImported?: boolean;
}

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
  importRunsFromIcal: (url: string) => Promise<Run[]>; // Changed from Promise<void> to Promise<Run[]>
  isLoadingImportedRuns: boolean;
  importRecipes: (recipes: Recipe[]) => Promise<void>;
  isLoadingRecipes: boolean;
}
