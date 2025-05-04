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
          // Transform the data from database format (imgurl) to our application format (imgUrl)
          const mappedRecipes = data.map(recipe => ({
            id: recipe.id,
            title: recipe.title,
            calories: recipe.calories,
            protein: recipe.protein,
            carbs: recipe.carbs,
            fat: recipe.fat,
            imgUrl: recipe.imgurl, // Map from lowercase database field to camelCase
            ingredients: recipe.ingredients,
            instructions: recipe.instructions,
            categories: recipe.categories,
            website: recipe.website,
            servings: recipe.servings
          }));
          setRecipes(mappedRecipes);
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

  // Updated importRecipes function to fix image handling
  const importRecipes = async (newRecipes: Recipe[]): Promise<void> => {
    setIsLoadingRecipes(true);
    try {
      console.log('Importing recipes to Supabase:', newRecipes.length);
      
      // Verify Supabase connection
      if (!supabase || typeof supabase.from !== 'function') {
        throw new Error('Supabase connection not established. Please check your Supabase integration.');
      }
      
      // Pre-process recipes with proper IDs and ensure image URLs are properly saved
      const recipesForDb = await Promise.all(newRecipes.map(async recipe => {
        // Check if the recipe has a valid UUID, if not generate one
        let recipeId: string;
        
        if (!recipe.id || typeof recipe.id !== 'string' || !isValidUUID(recipe.id)) {
          // Generate a new valid UUID if none exists or the existing one is invalid
          recipeId = crypto.randomUUID();
          console.log(`Generated new UUID ${recipeId} for recipe "${recipe.title}"`);
        } else {
          recipeId = recipe.id;
        }
        
        // Handle image URL - if it's a blob URL, we need to convert it
        let imageUrl = recipe.imgUrl;
        if (imageUrl && imageUrl.startsWith('blob:')) {
          console.log(`Recipe "${recipe.title}" has blob URL image that needs to be processed`);
          try {
            // Leave the blob URL as is - it will be displayed during this session
            // but won't persist after refresh - we log this for debugging
            console.log(`Note: Blob URL ${imageUrl} for recipe "${recipe.title}" will not persist after page refresh`);
          } catch (error) {
            console.error(`Failed to process image for recipe "${recipe.title}":`, error);
            imageUrl = null; // Reset to null if there was an error
          }
        }
        
        return {
          id: recipeId,
          title: recipe.title,
          calories: recipe.calories,
          protein: recipe.protein,
          carbs: recipe.carbs,
          fat: recipe.fat,
          imgurl: imageUrl, // Map from camelCase to lowercase for database
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          categories: recipe.categories,
          website: recipe.website,
          servings: recipe.servings,
          created_at: new Date().toISOString()
        };
      }));
      
      console.log('Prepared recipes for insert:', recipesForDb[0]);
      
      // Insert the data
      const { data, error: insertError } = await supabase
        .from('recipes')
        .insert(recipesForDb);
      
      if (insertError) {
        console.error('Error inserting recipes to Supabase:', insertError);
        throw new Error(`Failed to save recipes: ${insertError.message}`);
      }
      
      console.log('Successfully inserted recipes, now fetching them back');
      
      // Fetch all recipes in a separate query to update state
      const { data: fetchedData, error: selectError } = await supabase
        .from('recipes')
        .select('*');
      
      if (selectError) {
        console.error('Error fetching recipes after insert:', selectError);
        throw new Error(`Failed to fetch recipes: ${selectError.message}`);
      }
      
      if (fetchedData) {
        console.log('Successfully loaded all recipes:', fetchedData.length);
        
        // Map the fetched data back to our Recipe interface format
        const mappedRecipes = fetchedData.map(recipe => ({
          id: recipe.id,
          title: recipe.title,
          calories: recipe.calories,
          protein: recipe.protein,
          carbs: recipe.carbs,
          fat: recipe.fat,
          imgUrl: recipe.imgurl, // Map from lowercase database field to camelCase
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          categories: recipe.categories,
          website: recipe.website,
          servings: recipe.servings
        }));
        
        // Replace the entire recipes state with the fresh data from Supabase
        setRecipes(mappedRecipes);
      }
    } catch (error) {
      console.error('Error in importRecipes:', error);
      throw error;
    } finally {
      setIsLoadingRecipes(false);
    }
  };

  // Helper function to validate UUID format
  const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
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
