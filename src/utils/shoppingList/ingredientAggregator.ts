
import { Recipe } from "@/context/types";
import { ShoppingListItem } from "@/types/shoppingList";
import { parseIngredient } from "./ingredientParser";
import { consolidateQuantities } from "./quantityConsolidator";

/**
 * Aggregate ingredients from all recipes
 */
export function aggregateIngredients(recipes: Recipe[]): ShoppingListItem[] {
  const ingredientMap = new Map<string, { quantities: string[]; isBought: boolean }>();
  
  // Extract all ingredients from all recipes
  recipes.forEach(recipe => {
    if (!recipe.ingredients) return;
    
    recipe.ingredients.forEach(ingredient => {
      const { name, quantity } = parseIngredient(ingredient);
      
      if (!name) return;
      
      // Use normalized name as the key
      if (!ingredientMap.has(name)) {
        ingredientMap.set(name, { quantities: [], isBought: false });
      }
      
      if (quantity) {
        ingredientMap.get(name)!.quantities.push(quantity);
      }
    });
  });
  
  // Convert map to array of shopping list items
  return Array.from(ingredientMap.entries()).map(([name, { quantities, isBought }]) => {
    // Consolidate quantities
    const quantity = consolidateQuantities(quantities);
    
    return {
      id: `${name}-${Date.now()}`, // Simple unique ID
      name,
      quantity,
      isBought
    };
  });
}
