
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
  "olive oil", "vegetable oil", "sunflower oil", "canola oil", "coconut oil",
  "salt", "pepper", "black pepper", "white pepper", 
  "sugar", "brown sugar", "powdered sugar",
  "flour", "all-purpose flour", "wheat flour",
  "water", "milk",
  "butter", "margarine",
  "vinegar", "balsamic vinegar", "white vinegar",
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
    let categorized = false;
    
    for (const basic of BASIC_INGREDIENTS) {
      if (item.name.toLowerCase().includes(basic.toLowerCase())) {
        if (!basicIngredientGroups[basic]) {
          basicIngredientGroups[basic] = [];
        }
        basicIngredientGroups[basic].push(item);
        categorized = true;
        break;
      }
    }
    
    if (!categorized) {
      result.push(item);
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
