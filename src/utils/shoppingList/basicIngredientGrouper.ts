
import { ShoppingListItem } from "@/types/shoppingList";
import { BASIC_INGREDIENTS, QUANTITY_SUMMARIZE_ITEMS } from "./constants";
import { normalizeBasicIngredient, normalizeItemName, cleanQuantity, extractNumericQuantity } from "./ingredientNormalizer";

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
 * Convert recipes to basic shopping list items for fallback processing
 */
export function convertRecipesToItems(recipes: any[], mealPlanItems: any[]): ShoppingListItem[] {
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
