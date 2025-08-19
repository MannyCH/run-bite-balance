
import React, { createContext, useContext, useState, useEffect } from "react";
import { ShoppingList, ShoppingListItem, RecipeGroup } from "@/types/shoppingList";
import { Recipe } from "@/context/types";
import { MealPlanItem } from "@/types/profile";
import { summarizeWithAI } from "@/utils/shoppingList/summarizeIngredients";
import { extractRawIngredientsWithFrequency } from "@/utils/shoppingList/extractIngredients";
import { parseRecipeServings } from "@/utils/shoppingList/servingsParser";
import { multiplyIngredientQuantity } from "@/utils/shoppingList/quantityMultiplier";

interface ShoppingListContextType {
  shoppingList: ShoppingList;
  groupedByRecipe: RecipeGroup[];
  setShoppingList: React.Dispatch<React.SetStateAction<ShoppingList>>;
  generateShoppingList: (recipes: Recipe[], mealPlanItems: MealPlanItem[], batchCookingPeople?: number) => void;
  removeRecipeFromList: (recipeId: string) => void;
  toggleItemBought: (id: string) => void;
  clearShoppingList: () => void;
}

const ShoppingListContext = createContext<ShoppingListContextType | undefined>(undefined);

export const useShoppingList = () => {
  const context = useContext(ShoppingListContext);
  if (!context) {
    throw new Error("useShoppingList must be used within ShoppingListProvider");
  }
  return context;
};

const STORAGE_KEY = "runbitefit-shopping-list";

export const ShoppingListProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shoppingList, setShoppingList] = useState<ShoppingList>([]);
  const [groupedByRecipe, setGroupedByRecipe] = useState<RecipeGroup[]>([]);
  const [lastGenerationInput, setLastGenerationInput] = useState<{
    recipes: Recipe[];
    mealPlanItems: MealPlanItem[];
    batchCookingPeople: number;
  } | null>(null);

  // Load shopping list from localStorage on mount
  useEffect(() => {
    const savedList = localStorage.getItem(STORAGE_KEY);
    if (savedList) {
      try {
        setShoppingList(JSON.parse(savedList));
      } catch (error) {
        console.error("Failed to parse shopping list from localStorage:", error);
      }
    }
  }, []);

  // Save shopping list to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shoppingList));
  }, [shoppingList]);

  const generateShoppingList = async (recipes: Recipe[], mealPlanItems: MealPlanItem[], batchCookingPeople: number = 1) => {
    console.log("Generating shopping list from recipes:", recipes.length, "with meal plan items:", mealPlanItems.length, "for", batchCookingPeople, "people");
    
    // Store input for potential recipe removal
    setLastGenerationInput({ recipes, mealPlanItems, batchCookingPeople });
    
    // Generate aggregated list
    const newList = await summarizeWithAI(recipes, mealPlanItems, batchCookingPeople);
    console.log("Generated shopping list:", newList);
    setShoppingList(newList);
    
    // Generate grouped by recipe list
    const grouped = generateGroupedByRecipe(recipes, mealPlanItems, batchCookingPeople);
    setGroupedByRecipe(grouped);
  };

  const generateGroupedByRecipe = (recipes: Recipe[], mealPlanItems: MealPlanItem[], batchCookingPeople: number): RecipeGroup[] => {
    // Count recipe frequency in meal plan
    const recipeFrequency = new Map<string, number>();
    mealPlanItems.forEach(item => {
      if (item.recipe_id) {
        const currentCount = recipeFrequency.get(item.recipe_id) || 0;
        recipeFrequency.set(item.recipe_id, currentCount + 1);
      }
    });

    return recipes.map(recipe => {
      if (!recipe.ingredients || !recipe.id) {
        return { recipeId: recipe.id, recipeTitle: recipe.title, items: [] };
      }

      const frequency = recipeFrequency.get(recipe.id) || 1;
      const recipeServings = parseRecipeServings(recipe);
      const scalingFactor = (batchCookingPeople / recipeServings) * frequency;

      const items: ShoppingListItem[] = recipe.ingredients.map((ingredient, index) => {
        const scaledIngredient = scalingFactor !== 1 
          ? multiplyIngredientQuantity(ingredient.trim(), scalingFactor)
          : ingredient.trim();
        
        return {
          id: `${recipe.id}-${index}`,
          name: scaledIngredient,
          quantity: "",
          isBought: false
        };
      });

      return {
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        items
      };
    });
  };

  const removeRecipeFromList = async (recipeId: string) => {
    if (!lastGenerationInput) return;
    
    const filteredRecipes = lastGenerationInput.recipes.filter(recipe => recipe.id !== recipeId);
    const filteredMealPlanItems = lastGenerationInput.mealPlanItems.filter(item => item.recipe_id !== recipeId);
    
    // Regenerate shopping list without the removed recipe
    await generateShoppingList(filteredRecipes, filteredMealPlanItems, lastGenerationInput.batchCookingPeople);
  };

  const toggleItemBought = (id: string) => {
    setShoppingList(currentList =>
      currentList.map(item =>
        item.id === id ? { ...item, isBought: !item.isBought } : item
      )
    );
  };

  const clearShoppingList = () => {
    setShoppingList([]);
    setGroupedByRecipe([]);
    setLastGenerationInput(null);
  };

  return (
    <ShoppingListContext.Provider
      value={{
        shoppingList,
        groupedByRecipe,
        setShoppingList,
        generateShoppingList,
        removeRecipeFromList,
        toggleItemBought,
        clearShoppingList,
      }}
    >
      {children}
    </ShoppingListContext.Provider>
  );
};
