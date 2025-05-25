
import React, { createContext, useContext, useState, useEffect } from "react";
import { ShoppingList, ShoppingListItem } from "@/types/shoppingList";
import { Recipe } from "@/context/types";
import { MealPlanItem } from "@/types/profile";
import { summarizeWithAI } from "@/utils/shoppingList/summarizeIngredients";

interface ShoppingListContextType {
  shoppingList: ShoppingList;
  setShoppingList: React.Dispatch<React.SetStateAction<ShoppingList>>;
  generateShoppingList: (recipes: Recipe[], mealPlanItems: MealPlanItem[]) => void;
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

  const generateShoppingList = async (recipes: Recipe[], mealPlanItems: MealPlanItem[]) => {
    console.log("Generating shopping list from recipes:", recipes.length, "with meal plan items:", mealPlanItems.length);
    const newList = await summarizeWithAI(recipes, mealPlanItems);
    console.log("Generated shopping list:", newList);
    setShoppingList(newList);
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
  };

  return (
    <ShoppingListContext.Provider
      value={{
        shoppingList,
        setShoppingList,
        generateShoppingList,
        toggleItemBought,
        clearShoppingList,
      }}
    >
      {children}
    </ShoppingListContext.Provider>
  );
};
