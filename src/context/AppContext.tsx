
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Meal, Run, Recipe, AppContextType } from './types';
import { loadRecipes, importRecipes as importRecipesToDb } from './recipeService';
import { importRunsFromIcal } from './runService';

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoadingImportedRuns, setIsLoadingImportedRuns] = useState(false);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);

  // Load recipes from Supabase when the component mounts
  useEffect(() => {
    const loadInitialRecipes = async () => {
      setIsLoadingRecipes(true);
      try {
        console.log('AppContext: Starting to load recipes from Supabase...');
        const loadedRecipes = await loadRecipes();
        console.log('AppContext: Successfully loaded recipes:', loadedRecipes.length);
        console.log('AppContext: Sample recipe data:', loadedRecipes[0] || 'No recipes found');
        setRecipes(loadedRecipes);
      } catch (error) {
        console.error('AppContext: Error loading recipes:', error);
        // Set empty array on error to prevent undefined state
        setRecipes([]);
      } finally {
        setIsLoadingRecipes(false);
        console.log('AppContext: Recipe loading completed');
      }
    };

    loadInitialRecipes();
  }, []);

  const addMeal = (meal: Omit<Meal, "id">) => {
    const newMeal: Meal = {
      ...meal,
      id: Date.now().toString(),
    };
    console.log('AppContext: Adding meal:', newMeal);
    setMeals(prev => [...prev, newMeal]);
  };

  const updateMeal = (meal: Meal) => {
    console.log('AppContext: Updating meal:', meal.id);
    setMeals(prev => prev.map(m => m.id === meal.id ? meal : m));
  };

  const removeMeal = (id: string) => {
    console.log('AppContext: Removing meal:', id);
    setMeals(prev => prev.filter(m => m.id !== id));
  };

  const addRun = (run: Omit<Run, "id">) => {
    const newRun: Run = {
      ...run,
      id: Date.now().toString(),
    };
    console.log('AppContext: Adding run:', newRun);
    setRuns(prev => [...prev, newRun]);
  };

  const updateRun = (run: Run) => {
    console.log('AppContext: Updating run:', run.id);
    setRuns(prev => prev.map(r => r.id === run.id ? run : r));
  };

  const removeRun = (id: string) => {
    console.log('AppContext: Removing run:', id);
    setRuns(prev => prev.filter(r => r.id !== id));
  };

  const planRecipeAsMeal = (recipe: Recipe, date: Date) => {
    console.log('AppContext: Planning recipe as meal:', recipe.title, 'for date:', date);
    const meal: Omit<Meal, "id"> = {
      title: recipe.title,
      date,
      calories: recipe.calories,
      protein: recipe.protein,
      carbs: recipe.carbs,
      fat: recipe.fat,
      isPlanned: true,
      recipeId: recipe.id,
      imgUrl: recipe.imgUrl,
    };
    addMeal(meal);
  };

  const importRunsFromIcalUrl = async (url: string) => {
    setIsLoadingImportedRuns(true);
    try {
      console.log('AppContext: Importing runs from:', url);
      const importedRuns = await importRunsFromIcal(url);
      console.log('AppContext: Successfully imported', importedRuns.length, 'runs');
      
      // Add imported runs to the state, replacing any existing imported runs
      setRuns(prev => {
        // Remove existing imported runs first
        const nonImportedRuns = prev.filter(run => !run.isImported);
        // Add new imported runs
        return [...nonImportedRuns, ...importedRuns];
      });
      
      return importedRuns;
    } catch (error) {
      console.error('AppContext: Error importing runs:', error);
      throw error;
    } finally {
      setIsLoadingImportedRuns(false);
    }
  };

  const importRecipes = async (newRecipes: Recipe[]) => {
    setIsLoadingRecipes(true);
    try {
      console.log('AppContext: Importing', newRecipes.length, 'recipes to database...');
      const updatedRecipes = await importRecipesToDb(newRecipes);
      console.log('AppContext: Import completed, updating state with:', updatedRecipes.length, 'recipes');
      setRecipes(updatedRecipes);
    } catch (error) {
      console.error('AppContext: Error importing recipes:', error);
      // Don't clear existing recipes on import error
    } finally {
      setIsLoadingRecipes(false);
    }
  };

  console.log('AppContext: Current state - recipes:', recipes.length, 'runs:', runs.length, 'isLoadingRuns:', isLoadingImportedRuns);

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
        importRunsFromIcal: importRunsFromIcalUrl,
        isLoadingImportedRuns,
        importRecipes,
        isLoadingRecipes,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Export useApp as an alias for useAppContext (for backward compatibility)
export const useApp = useAppContext;

// Export types for other files to use
export type { Meal, Run, Recipe, AppContextType };
