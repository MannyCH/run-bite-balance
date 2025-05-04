
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { mockMeals, mockRuns, mockRecipes } from "../data/mockData";
import { 
  AppContextType, 
  Meal, 
  Run, 
  Recipe 
} from "./types";
import { importRunsFromIcal } from "./runService";
import { importRecipes as importRecipesToDb, loadRecipes } from "./recipeService";
import { generateId } from "./utils";

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
        const loadedRecipes = await loadRecipes();
        setRecipes(loadedRecipes);
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
        await importRunsFromIcalHandler(ICAL_URL);
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
      id: generateId(),
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
      id: generateId(),
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

  const importRunsFromIcalHandler = async (url: string): Promise<void> => {
    setIsLoadingImportedRuns(true);
    try {
      // Remove existing imported runs
      const filteredRuns = runs.filter(run => !run.isImported);
      
      // Fetch new runs from iCal
      const newRuns = await importRunsFromIcal(url);
      
      setRuns([...filteredRuns, ...newRuns]);
    } catch (error) {
      console.error('Error importing runs:', error);
      throw error;
    } finally {
      setIsLoadingImportedRuns(false);
    }
  };

  const importRecipesHandler = async (newRecipes: Recipe[]): Promise<void> => {
    setIsLoadingRecipes(true);
    try {
      const updatedRecipes = await importRecipesToDb(newRecipes);
      setRecipes(updatedRecipes);
    } catch (error) {
      console.error('Error in importRecipesHandler:', error);
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
        importRunsFromIcal: importRunsFromIcalHandler,
        isLoadingImportedRuns,
        importRecipes: importRecipesHandler,
        isLoadingRecipes,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Re-export types from types.ts for convenience
export type { Meal, Run, Recipe, AppContextType };
