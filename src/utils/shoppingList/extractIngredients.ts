
import { Recipe } from "@/context/types";
import { ShoppingListItem } from "@/types/shoppingList";

/**
 * Extract and normalize ingredients from a string
 */
export function parseIngredient(ingredient: string): { name: string; quantity: string } {
  // Simple regex to separate quantity from ingredient name
  // This handles common formats like "2 cups flour", "500g rice", "1 tbsp olive oil"
  const match = ingredient.match(/^([\d\/\.\s]+\s*(?:g|kg|ml|l|cup|cups|tbsp|tsp|oz|lb|pack|can|bottle|bunch|piece|pieces|slice|slices|clove|cloves)?)?\s*(.+)$/i);
  
  if (match && match[2]) {
    const quantity = (match[1] || "").trim();
    const name = match[2].trim().toLowerCase();
    return { name, quantity };
  }
  
  return { name: ingredient.toLowerCase(), quantity: "" };
}

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
    // Combine quantities or use default
    let quantity = quantities.length > 0 
      ? quantities.join(" + ") 
      : "";
    
    return {
      id: `${name}-${Date.now()}`, // Simple unique ID
      name,
      quantity,
      isBought
    };
  });
}
