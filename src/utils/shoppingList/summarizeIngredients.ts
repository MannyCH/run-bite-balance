import { ShoppingListItem } from "@/types/shoppingList";
import { supabase } from "@/integrations/supabase/client";
import { extractRawIngredientsWithFrequency, convertCategorizedToShoppingList } from "./extractIngredients";
import { Recipe } from "@/context/types";
import { MealPlanItem } from "@/types/profile";

/**
 * Use OpenAI via Supabase Edge Function to create a categorized shopping list
 */
export async function summarizeWithAI(recipes: Recipe[], mealPlanItems: MealPlanItem[]): Promise<ShoppingListItem[]> {
  if (recipes.length === 0) return [];
  
  try {
    // Extract raw ingredients from all recipes with frequency multipliers
    const rawIngredients = extractRawIngredientsWithFrequency(recipes, mealPlanItems);
    
    if (rawIngredients.length === 0) {
      console.log("No ingredients found in recipes");
      return [];
    }
    
    console.log("Sending raw ingredients to AI:", rawIngredients);
    
    const { data, error } = await supabase.functions.invoke('summarize-shopping-list', {
      body: { ingredients: rawIngredients }
    });
    
    if (error) {
      console.error("Error calling summarize-shopping-list function:", error);
      // Fall back to simple aggregation if the edge function fails
      return groupBasicIngredients(convertRecipesToItems(recipes, mealPlanItems));
    }
    
    if (data && data.categories) {
      console.log("Received categorized data from AI:", data);
      return convertCategorizedToShoppingList(data);
    }
    
    throw new Error("Invalid response from summarize-shopping-list function");
  } catch (err) {
    console.error("Error summarizing shopping list with AI:", err);
    // Fall back to simple aggregation
    return groupBasicIngredients(convertRecipesToItems(recipes, mealPlanItems));
  }
}

/**
 * Convert recipes to basic shopping list items for fallback processing
 */
function convertRecipesToItems(recipes: Recipe[], mealPlanItems: MealPlanItem[]): ShoppingListItem[] {
  const items: ShoppingListItem[] = [];
  
  // Count recipe frequency
  const recipeFrequency = new Map<string, number>();
  mealPlanItems.forEach(item => {
    if (item.recipe_id) {
      const currentCount = recipeFrequency.get(item.recipe_id) || 0;
      recipeFrequency.set(item.recipe_id, currentCount + 1);
    }
  });
  
  recipes.forEach(recipe => {
    if (!recipe.ingredients || !recipe.id) return;
    
    const frequency = recipeFrequency.get(recipe.id) || 1;
    
    recipe.ingredients.forEach(ingredient => {
      if (ingredient && ingredient.trim()) {
        items.push({
          id: `${ingredient.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
          name: ingredient.trim(),
          quantity: frequency > 1 ? `x${frequency}` : "",
          isBought: false
        });
      }
    });
  });
  
  return items;
}

// Basic ingredients that should be treated as single items without quantities and marked as bought
const BASIC_INGREDIENTS = [
  "olive oil", "olivenöl", "olivenoel", "vegetable oil", "sunflower oil", "canola oil", "coconut oil",
  "salt", "salz", "pepper", "pfeffer", "black pepper", "white pepper", 
  "sugar", "zucker", "brown sugar", "powdered sugar",
  "flour", "mehl", "all-purpose flour", "wheat flour",
  "water", "wasser",
  "butter", "margarine",
  "vinegar", "essig", "balsamic vinegar", "white vinegar",
  "spices", "herbs", "gewürze", "kräuter",
  "garlic", "knoblauch", "knoblauchzehe",
  "cinnamon", "zimt",
];

// Items that should be summarized with quantities
const QUANTITY_SUMMARIZE_ITEMS = [
  "eggplant", "aubergine", 
  "tomato", "tomate",
  "potato", "kartoffel",
  "onion", "zwiebel",
  "apple", "apfel",
  "banana", "banane",
  "carrot", "rüebli", "karotte",
  "egg", "ei", "eier",
  "cheese", "käse",
  "milk", "milch",
  "yogurt", "joghurt",
  "bread", "brot",
  "rice", "reis",
  "pasta", "nudeln",
  "meat", "fleisch",
  "chicken", "huhn", "poulet",
];

// Words to remove from quantities
const MEASUREMENT_ABBREVIATIONS = [
  "EL", "TL", "TSP", "TBSP", "esslöffel", "teelöffel", "teaspoon", "tablespoon"
];

/**
 * Groups basic ingredients together and formats them for display
 * This is used as a fallback if the AI summarization fails
 */
export function groupBasicIngredients(items: ShoppingListItem[]): ShoppingListItem[] {
  const result: ShoppingListItem[] = [];
  const basicIngredientGroups: Record<string, ShoppingListItem[]> = {};
  const quantitySummarizeGroups: Record<string, ShoppingListItem[]> = {};
  
  // First pass: separate ingredients into categories
  items.forEach(item => {
    // Clean the item name and quantity
    const cleanedItem = {
      ...item,
      name: item.name.toLowerCase(),
      quantity: cleanQuantity(item.quantity)
    };
    
    // Check if it's a basic ingredient (no quantity needed and mark as bought)
    const isBasic = BASIC_INGREDIENTS.some(basic => cleanedItem.name.includes(basic.toLowerCase()));
    if (isBasic) {
      const basicKey = normalizeBasicIngredient(cleanedItem.name);
      if (!basicIngredientGroups[basicKey]) {
        basicIngredientGroups[basicKey] = [];
      }
      basicIngredientGroups[basicKey].push(cleanedItem);
      return;
    }
    
    // Check if it's an item that needs quantity summarization
    const needsSummarizing = QUANTITY_SUMMARIZE_ITEMS.some(sumItem => 
      cleanedItem.name.includes(sumItem.toLowerCase())
    );
    
    if (needsSummarizing) {
      const normalizedName = normalizeItemName(cleanedItem.name);
      if (!quantitySummarizeGroups[normalizedName]) {
        quantitySummarizeGroups[normalizedName] = [];
      }
      quantitySummarizeGroups[normalizedName].push(cleanedItem);
      return;
    }
    
    // Regular item
    result.push(cleanedItem);
  });
  
  // Process basic ingredients (without quantities and mark as bought)
  Object.entries(basicIngredientGroups).forEach(([basicName, groupItems]) => {
    result.push({
      id: groupItems[0].id,
      name: basicName.charAt(0).toUpperCase() + basicName.slice(1),
      quantity: "", // No quantity for basic ingredients
      isBought: true, // Mark basic ingredients as already bought
      category: "Spices & Condiments"
    });
  });
  
  // Process items that need quantity summarization
  Object.entries(quantitySummarizeGroups).forEach(([itemName, groupItems]) => {
    // Try to extract and sum numeric quantities
    const quantities = groupItems.map(i => extractNumericQuantity(i.quantity));
    let summarizedQuantity = "";
    
    if (quantities.some(q => q.value !== null)) {
      // If we have numerical quantities, try to sum them
      const validQuantities = quantities.filter(q => q.value !== null) as { value: number; unit: string }[];
      
      if (validQuantities.length > 0) {
        // Group by unit
        const unitGroups: Record<string, number> = {};
        validQuantities.forEach(q => {
          const unit = q.unit || '';
          if (!unitGroups[unit]) unitGroups[unit] = 0;
          unitGroups[unit] += q.value;
        });
        
        summarizedQuantity = Object.entries(unitGroups)
          .map(([unit, value]) => `${value}${unit}`)
          .join(", ");
      } else {
        summarizedQuantity = groupItems.length.toString();
      }
    } else {
      // If we don't have numerical quantities, just use the count
      summarizedQuantity = groupItems.length.toString();
    }
    
    result.push({
      id: groupItems[0].id,
      name: itemName.charAt(0).toUpperCase() + itemName.slice(1),
      quantity: summarizedQuantity,
      isBought: groupItems.every(i => i.isBought)
    });
  });
  
  return result;
}

/**
 * Extract numeric quantity from a string
 */
function extractNumericQuantity(quantity: string): { value: number | null; unit: string } {
  if (!quantity) return { value: null, unit: '' };
  
  // Match patterns like "2", "2.5", "2,5", "500g", "2 kg", etc.
  const match = quantity.match(/^(\d+(?:[.,]\d+)?)\s*([a-zA-Z]*)$/);
  
  if (match) {
    const value = parseFloat(match[1].replace(',', '.'));
    const unit = match[2] || '';
    return { value, unit };
  }
  
  return { value: null, unit: '' };
}

/**
 * Normalize basic ingredient names to consistent forms
 */
function normalizeBasicIngredient(name: string): string {
  const lowerName = name.toLowerCase();
  
  // Map of normalized names
  const normalizationMap: Record<string, string[]> = {
    "olive oil": ["olivenöl", "olivenoel", "extra virgin olive oil", "virgin olive oil"],
    "sugar": ["zucker", "brown sugar", "powdered sugar"],
    "salt": ["salz", "sea salt", "kosher salt"],
    "pepper": ["pfeffer", "black pepper", "white pepper"],
    "flour": ["mehl", "all-purpose flour", "wheat flour"],
    "water": ["wasser"],
    "butter": ["margarine", "butter"],
    "garlic": ["knoblauch", "knoblauchzehe"],
    "cinnamon": ["zimt"],
  };
  
  // Check if the name matches any normalized form
  for (const [normalName, variations] of Object.entries(normalizationMap)) {
    if (normalName === lowerName || variations.some(v => lowerName.includes(v))) {
      return normalName;
    }
  }
  
  return lowerName;
}

/**
 * Normalize item names for quantity summarization
 */
function normalizeItemName(name: string): string {
  const lowerName = name.toLowerCase();
  
  // Map of normalized names
  const normalizationMap: Record<string, string[]> = {
    "eggplant": ["aubergine"],
    "tomato": ["tomate", "tomaten", "pomodoro"],
    "potato": ["kartoffel", "kartoffeln"],
    "onion": ["zwiebel", "zwiebeln"],
    "apple": ["apfel", "äpfel"],
    "banana": ["banane", "bananen"],
    "carrot": ["rüebli", "karotte", "möhre"],
    "egg": ["ei", "eier"],
    "chicken": ["huhn", "poulet", "hähnchen"],
  };
  
  // Check if the name matches any normalized form
  for (const [normalName, variations] of Object.entries(normalizationMap)) {
    if (normalName === lowerName || variations.some(v => lowerName.includes(v))) {
      return normalName;
    }
  }
  
  return lowerName;
}

/**
 * Clean quantity by removing measurement abbreviations
 */
function cleanQuantity(quantity: string): string {
  if (!quantity) return "";
  
  let cleanedQuantity = quantity;
  
  // Remove measurement abbreviations
  MEASUREMENT_ABBREVIATIONS.forEach(abbr => {
    const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
    cleanedQuantity = cleanedQuantity.replace(regex, '');
  });
  
  // Clean up extra spaces and trim
  cleanedQuantity = cleanedQuantity.replace(/\s+/g, ' ').trim();
  
  return cleanedQuantity;
}
