import { Recipe } from "@/context/types";
import { ShoppingListItem } from "@/types/shoppingList";

/**
 * Extract raw ingredients from all recipes for OpenAI processing
 */
export function extractRawIngredients(recipes: Recipe[]): string[] {
  const allIngredients: string[] = [];
  
  recipes.forEach(recipe => {
    if (!recipe.ingredients) return;
    
    recipe.ingredients.forEach(ingredient => {
      if (ingredient && ingredient.trim()) {
        allIngredients.push(ingredient.trim());
      }
    });
  });
  
  return allIngredients;
}

/**
 * Convert categorized ingredients from OpenAI back to flat shopping list format
 */
export function convertCategorizedToShoppingList(categorizedData: any): ShoppingListItem[] {
  const shoppingList: ShoppingListItem[] = [];
  
  if (!categorizedData || !categorizedData.categories) {
    return shoppingList;
  }
  
  // Iterate through all categories
  Object.entries(categorizedData.categories).forEach(([category, items]) => {
    if (Array.isArray(items)) {
      items.forEach((item: any) => {
        if (item && item.name) {
          shoppingList.push({
            id: item.id || `${item.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
            name: item.name,
            quantity: item.quantity || "",
            isBought: item.isBought || false,
            category: category
          });
        }
      });
    }
  });
  
  return shoppingList;
}

/**
 * Clean ingredient name by removing preparation instructions and irrelevant words
 */
function cleanIngredientName(name: string): string {
  // Convert to lowercase for consistency
  name = name.toLowerCase();
  
  // Remove preparation instructions and irrelevant words
  const wordsToRemove = [
    // German preparation words
    "geviertelt", "geschnitten", "gehackt", "gerieben", "gewürfelt", "ganz", "fein",
    // English preparation words
    "sliced", "diced", "chopped", "minced", "grated", "whole", "fine", "fresh",
    // Irrelevant words
    "guss", "quality", "premium", "organic", "free-range", "for serving", "for garnish",
    "to taste", "as needed", "optional", "approximately", "about", "roughly", "packed"
  ];
  
  // Regular expression to match any word in the array with word boundaries
  const regex = new RegExp(`\\b(${wordsToRemove.join("|")})\\b`, "gi");
  name = name.replace(regex, "");
  
  // Remove extra spaces and trim
  name = name.replace(/\s+/g, " ").trim();
  
  return name;
}

/**
 * Normalize ingredient names to group similar ingredients
 */
function normalizeIngredientName(name: string): string {
  // Common ingredient variations to consolidate
  const normalizations: Record<string, string[]> = {
    "olive oil": ["oliveoil", "extra virgin olive oil", "evoo", "virgin olive oil"],
    "garlic": ["garlic clove", "garlic cloves", "garlic bulb", "fresh garlic"],
    "onion": ["brown onion", "red onion", "yellow onion", "white onion", "shallot"],
    "salt": ["sea salt", "kosher salt", "table salt", "flaked salt", "himalayan salt"],
    "pepper": ["black pepper", "white pepper", "ground pepper", "peppercorn"],
    "sugar": ["white sugar", "granulated sugar", "caster sugar"],
    "flour": ["all-purpose flour", "plain flour", "wheat flour"],
  };
  
  // Check if the ingredient name matches any known variations
  for (const [normalized, variations] of Object.entries(normalizations)) {
    if (variations.some(variation => name.includes(variation))) {
      return normalized;
    }
  }
  
  return name;
}

/**
 * Extract and normalize ingredients from a string
 */
export function parseIngredient(ingredient: string): { name: string; quantity: string } {
  // Simple regex to separate quantity from ingredient name
  // This handles common formats like "2 cups flour", "500g rice", "1 tbsp olive oil"
  const match = ingredient.match(/^([\d\/\.\s]+\s*(?:g|kg|ml|l|cup|cups|tbsp|tsp|oz|lb|pack|can|bottle|bunch|piece|pieces|slice|slices|clove|cloves)?)?\s*(.+)$/i);
  
  if (match && match[2]) {
    const quantity = (match[1] || "").trim();
    let name = match[2].trim();
    
    // Clean and normalize the ingredient name
    name = cleanIngredientName(name);
    name = normalizeIngredientName(name);
    
    return { name, quantity };
  }
  
  return { name: cleanIngredientName(ingredient.toLowerCase()), quantity: "" };
}

/**
 * Consolidate similar quantities for better readability
 */
function consolidateQuantities(quantities: string[]): string {
  if (quantities.length === 0) return "";
  if (quantities.length === 1) return quantities[0];
  
  // Group similar units
  const numericValues: number[] = [];
  const units = new Set<string>();
  
  // Extract numeric values and units
  quantities.forEach(qty => {
    const match = qty.match(/^([\d\/\.]+)\s*(.*)$/);
    if (match) {
      // Convert fractions to decimals
      let value = match[1];
      if (value.includes('/')) {
        const [numerator, denominator] = value.split('/');
        value = (parseFloat(numerator) / parseFloat(denominator)).toString();
      }
      numericValues.push(parseFloat(value));
      if (match[2]) units.add(match[2]);
    }
  });
  
  // If we have numeric values and consistent units
  if (numericValues.length > 0 && units.size === 1) {
    const totalValue = numericValues.reduce((sum, val) => sum + val, 0);
    return `${totalValue} ${Array.from(units)[0]}`;
  }
  
  // If consolidation isn't possible, join with plus signs
  return quantities.join(" + ");
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
