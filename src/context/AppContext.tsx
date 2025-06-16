
import React, { createContext, useContext, useState } from 'react';
import { Meal, Run, Recipe, AppContextType } from './types';

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoadingImportedRuns, setIsLoadingImportedRuns] = useState(false);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);

  const addMeal = (meal: Omit<Meal, "id">) => {
    const newMeal: Meal = {
      ...meal,
      id: Date.now().toString(),
    };
    setMeals(prev => [...prev, newMeal]);
  };

  const updateMeal = (meal: Meal) => {
    setMeals(prev => prev.map(m => m.id === meal.id ? meal : m));
  };

  const removeMeal = (id: string) => {
    setMeals(prev => prev.filter(m => m.id !== id));
  };

  const addRun = (run: Omit<Run, "id">) => {
    const newRun: Run = {
      ...run,
      id: Date.now().toString(),
    };
    setRuns(prev => [...prev, newRun]);
  };

  const updateRun = (run: Run) => {
    setRuns(prev => prev.map(r => r.id === run.id ? run : r));
  };

  const removeRun = (id: string) => {
    setRuns(prev => prev.filter(r => r.id !== id));
  };

  const planRecipeAsMeal = (recipe: Recipe, date: Date) => {
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

  const importRunsFromIcal = async (url: string) => {
    setIsLoadingImportedRuns(true);
    try {
      // Import logic would go here
      console.log('Importing runs from:', url);
    } catch (error) {
      console.error('Error importing runs:', error);
    } finally {
      setIsLoadingImportedRuns(false);
    }
  };

  const importRecipes = async (newRecipes: Recipe[]) => {
    setIsLoadingRecipes(true);
    try {
      setRecipes(prev => [...prev, ...newRecipes]);
    } catch (error) {
      console.error('Error importing recipes:', error);
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
