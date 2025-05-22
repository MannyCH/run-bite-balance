
import { ShoppingListItem } from "@/types/shoppingList";
import { supabase } from "@/integrations/supabase/client";

/**
 * Use OpenAI via Supabase Edge Function to summarize and clean up the shopping list
 */
export async function summarizeWithAI(items: ShoppingListItem[]): Promise<ShoppingListItem[]> {
  if (items.length === 0) return [];
  
  try {
    const { data, error } = await supabase.functions.invoke('summarize-shopping-list', {
      body: { items }
    });
    
    if (error) {
      console.error("Error calling summarize-shopping-list function:", error);
      // Fall back to local processing if the edge function fails
      return groupBasicIngredients(items);
    }
    
    if (data && data.items && Array.isArray(data.items)) {
      return data.items;
    }
    
    throw new Error("Invalid response from summarize-shopping-list function");
  } catch (err) {
    console.error("Error summarizing shopping list with AI:", err);
    // Fall back to local processing
    return groupBasicIngredients(items);
  }
}

// Basic ingredients that should be treated as single items
const BASIC_INGREDIENTS = [
  "olive oil", "olivenöl", "olivenoel", "vegetable oil", "sunflower oil", "canola oil", "coconut oil",
  "salt", "salz", "pepper", "pfeffer", "black pepper", "white pepper", 
  "sugar", "zucker", "brown sugar", "powdered sugar",
  "flour", "mehl", "all-purpose flour", "wheat flour",
  "water", "wasser", "milk", "milch",
  "butter", "margarine",
  "vinegar", "essig", "balsamic vinegar", "white vinegar",
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
  
  // First pass: separate basic ingredients from regular ones
  items.forEach(item => {
    // Clean the item name and quantity
    const cleanedItem = {
      ...item,
      name: item.name.toLowerCase(),
      quantity: cleanQuantity(item.quantity)
    };
    
    let categorized = false;
    
    for (const basic of BASIC_INGREDIENTS) {
      if (cleanedItem.name.includes(basic.toLowerCase())) {
        const basicKey = normalizeBasicIngredient(basic);
        if (!basicIngredientGroups[basicKey]) {
          basicIngredientGroups[basicKey] = [];
        }
        basicIngredientGroups[basicKey].push(cleanedItem);
        categorized = true;
        break;
      }
    }
    
    if (!categorized) {
      result.push(cleanedItem);
    }
  });
  
  // Second pass: consolidate basic ingredients
  Object.entries(basicIngredientGroups).forEach(([basicName, items]) => {
    // Use the first item's ID for the consolidated item
    const id = items[0].id;
    const quantities = items.map(i => i.quantity).filter(q => q).join(", ");
    
    result.push({
      id,
      name: basicName.charAt(0).toUpperCase() + basicName.slice(1), // Capitalize first letter
      quantity: quantities || "As needed", // Default text if no quantities
      isBought: items.every(i => i.isBought) // Only mark as bought if all related items are bought
    });
  });
  
  return result;
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
    "milk": ["milch"],
  };
  
  // Check if the name matches any normalized form
  for (const [normalName, variations] of Object.entries(normalizationMap)) {
    if (normalName === lowerName || variations.some(v => v === lowerName)) {
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
