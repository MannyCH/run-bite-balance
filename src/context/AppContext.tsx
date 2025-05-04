import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { addDays, subDays, startOfWeek, format } from "date-fns";
import { mockMeals, mockRuns, mockRecipes } from "../data/mockData";
import { fetchICalRuns } from "@/utils/icalUtils";

// Types
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
}

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
  isImported?: boolean; // New flag to identify imported runs
}

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
  categories?: string[];
  website?: string;
  servings?: string;
}

interface AppContextType {
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
  importRecipes: (recipes: Recipe[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

// Helper functions for localStorage
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
      // Parse dates correctly for meals and runs
      const parsedValue = JSON.parse(storedValue, (key, value) => {
        if (key === 'date' && typeof value === 'string') {
          return new Date(value);
        }
        return value;
      });
      return parsedValue;
    }
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
  }
  return defaultValue;
};

const saveToStorage = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    console.log(`Saved ${key} to localStorage`, value);
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

const ICAL_URL = "https://runningcoach.me/calendar/ical/e735d0722a98c308a459f60216f9cd5adc29d107/basic.ics?morning_at=09:00&evening_at=20:00";

export const AppProvider = ({ children }: AppProviderProps) => {
  // Load initial values from localStorage, falling back to mock data if not available
  const [meals, setMeals] = useState<Meal[]>(() => loadFromStorage('meals', mockMeals));
  const [runs, setRuns] = useState<Run[]>(() => loadFromStorage('runs', mockRuns));
  const [recipes, setRecipes] = useState<Recipe[]>(() => loadFromStorage('recipes', mockRecipes));
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoadingImportedRuns, setIsLoadingImportedRuns] = useState<boolean>(false);

  // Save to localStorage whenever state changes
  useEffect(() => {
    saveToStorage('meals', meals);
  }, [meals]);

  useEffect(() => {
    saveToStorage('runs', runs);
  }, [runs]);

  useEffect(() => {
    saveToStorage('recipes', recipes);
    console.log("Recipes updated in state:", recipes.length);
  }, [recipes]);

  // Automatically import runs when the component mounts
  useEffect(() => {
    const loadImportedRuns = async () => {
      try {
        await importRunsFromIcal(ICAL_URL);
        console.log("Initial iCal runs imported successfully");
      } catch (error) {
        console.error("Failed to import initial iCal runs:", error);
      }
    };
    
    loadImportedRuns();
  }, []);

  const addMeal = (meal: Omit<Meal, "id">) => {
    const newMeal = {
      ...meal,
      id: Math.random().toString(36).substr(2, 9),
    };
    setMeals([...meals, newMeal]);
  };

  const updateMeal = (updatedMeal: Meal) => {
    setMeals(meals.map((meal) => (meal.id === updatedMeal.id ? updatedMeal : meal)));
  };

  const removeMeal = (id: string) => {
    setMeals(meals.filter((meal) => meal.id !== id));
  };

  const addRun = (run: Omit<Run, "id">) => {
    const newRun = {
      ...run,
      id: Math.random().toString(36).substr(2, 9),
    };
    setRuns([...runs, newRun]);
  };

  const updateRun = (updatedRun: Run) => {
    setRuns(runs.map((run) => (run.id === updatedRun.id ? updatedRun : run)));
  };

  const removeRun = (id: string) => {
    setRuns(runs.filter((run) => run.id !== id));
  };

  const planRecipeAsMeal = (recipe: Recipe, date: Date) => {
    addMeal({
      title: recipe.title,
      date,
      calories: recipe.calories,
      protein: recipe.protein,
      carbs: recipe.carbs,
      fat: recipe.fat,
      isPlanned: true,
      recipeId: recipe.id,
      imgUrl: recipe.imgUrl,
    });
  };

  const importRunsFromIcal = async (url: string): Promise<void> => {
    setIsLoadingImportedRuns(true);
    try {
      console.log("Fetching iCal runs from:", url);
      
      // Remove existing imported runs
      const filteredRuns = runs.filter(run => !run.isImported);
      
      // Fetch new runs from iCal
      const importedRuns = await fetchICalRuns(url);
      console.log("Imported runs:", importedRuns.length);
      
      // Add IDs to imported runs and add to state
      const newRuns = importedRuns.map(run => ({
        ...run,
        id: `imported-${Math.random().toString(36).substr(2, 9)}`,
      })) as Run[];
      
      setRuns([...filteredRuns, ...newRuns]);
    } catch (error) {
      console.error('Error importing runs:', error);
      throw error;
    } finally {
      setIsLoadingImportedRuns(false);
    }
  };

  const importRecipes = (newRecipes: Recipe[]) => {
    // Add IDs to recipes if they don't have them
    const recipesWithIds = newRecipes.map(recipe => ({
      ...recipe,
      id: recipe.id || `recipe-${Math.random().toString(36).substr(2, 9)}`,
    }));
    console.log("Importing recipes:", recipesWithIds.length);
    setRecipes(prevRecipes => {
      const updatedRecipes = [...prevRecipes, ...recipesWithIds];
      console.log("Updated recipes count:", updatedRecipes.length);
      return updatedRecipes;
    });
  };

  return (
    <AppContext.Provider
      value={{
        meals,
        runs,
        recipes,
        selectedDate,
        setSelectedDate,
        addMeal,
        updateMeal,
        removeMeal,
        addRun,
        updateRun,
        removeRun,
        planRecipeAsMeal,
        importRunsFromIcal,
        isLoadingImportedRuns,
        importRecipes,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
