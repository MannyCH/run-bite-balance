
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { addDays, subDays, startOfWeek, format } from "date-fns";
import { mockMeals, mockRuns, mockRecipes } from "../data/mockData";
import { fetchICalRuns } from "@/utils/icalUtils";
import { supabase } from "@/lib/supabase";

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
  importRecipes: (recipes: Recipe[]) => Promise<void>;
  isLoadingRecipes: boolean;
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

const ICAL_URL = "https://runningcoach.me/calendar/ical/e735d0722a98c308a459f60216f9cd5adc29d107/basic.ics?morning_at=09:00&evening_at=20:00";

export const AppProvider = ({ children }: AppProviderProps) => {
  const [meals, setMeals] = useState<Meal[]>(mockMeals);
  const [runs, setRuns] = useState<Run[]>(mockRuns);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoadingImportedRuns, setIsLoadingImportedRuns] = useState<boolean>(false);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState<boolean>(false);

  // Load recipes from Supabase when component mounts
  useEffect(() => {
    const fetchRecipes = async () => {
      setIsLoadingRecipes(true);
      try {
        const { data, error } = await supabase
          .from('recipes')
          .select('*');

        if (error) {
          console.error('Error fetching recipes:', error);
          return;
        }

        if (data) {
          console.log('Loaded recipes from Supabase:', data.length);
          setRecipes(data as Recipe[]);
        }
      } catch (error) {
        console.error('Failed to fetch recipes:', error);
      } finally {
        setIsLoadingRecipes(false);
      }
    };

    fetchRecipes();
  }, []);

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
      // Don't return anything to match the Promise<void> type
    } catch (error) {
      console.error('Error importing runs:', error);
      throw error;
    } finally {
      setIsLoadingImportedRuns(false);
    }
  };

  const importRecipes = async (newRecipes: Recipe[]): Promise<void> => {
    setIsLoadingRecipes(true);
    try {
      console.log('Importing recipes to Supabase:', newRecipes.length);
      
      // Verify Supabase connection
      if (!supabase || typeof supabase.from !== 'function') {
        throw new Error('Supabase connection not established. Please check your Supabase integration.');
      }
      
      // Add IDs if not present and prepare for Supabase
      const recipesWithIds = newRecipes.map(recipe => ({
        ...recipe,
        id: recipe.id || Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString()
      }));
      
      // First insert the data
      const { error: insertError } = await supabase
        .from('recipes')
        .insert(recipesWithIds);
      
      if (insertError) {
        console.error('Error inserting recipes to Supabase:', insertError);
        throw new Error(`Failed to save recipes: ${insertError.message}`);
      }
      
      console.log('Successfully inserted recipes, now fetching them back');
      
      // Then fetch all recipes in a separate query to update state
      const { data, error: selectError } = await supabase
        .from('recipes')
        .select('*');
      
      if (selectError) {
        console.error('Error fetching recipes after insert:', selectError);
      }
      
      if (data) {
        console.log('Successfully loaded all recipes:', data.length);
        // Replace the entire recipes state with the fresh data from Supabase
        setRecipes(data as Recipe[]);
      }
    } catch (error) {
      console.error('Error in importRecipes:', error);
      throw error;
    } finally {
      setIsLoadingRecipes(false);
    }
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
        isLoadingRecipes,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
