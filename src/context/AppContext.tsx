
import React, { createContext, useContext, useState, ReactNode } from "react";
import { addDays, subDays, startOfWeek, format } from "date-fns";
import { mockMeals, mockRuns, mockRecipes } from "../data/mockData";

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

export const AppProvider = ({ children }: AppProviderProps) => {
  const [meals, setMeals] = useState<Meal[]>(mockMeals);
  const [runs, setRuns] = useState<Run[]>(mockRuns);
  const [recipes] = useState<Recipe[]>(mockRecipes);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
