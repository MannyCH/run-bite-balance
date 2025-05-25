
import { ShoppingListItem } from "@/types/shoppingList";

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
