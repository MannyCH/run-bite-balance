
import { ShoppingList } from "@/types/shoppingList";

/**
 * API functions for shopping list operations
 */

export interface ShoppingListExportItem {
  id: string;
  name: string;
  quantity: string;
  category?: string;
}

/**
 * Convert shopping list to export format
 */
export function formatShoppingListForExport(shoppingList: ShoppingList): ShoppingListExportItem[] {
  return shoppingList
    .filter(item => !item.isBought) // Only export items that haven't been bought
    .map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      category: item.category
    }));
}

/**
 * Get shopping list in a format suitable for browser extension
 */
export function getShoppingListForAutomation(): ShoppingListExportItem[] {
  // Get shopping list from localStorage (same as ShoppingListContext)
  const STORAGE_KEY = "runbitefit-shopping-list";
  const savedList = localStorage.getItem(STORAGE_KEY);
  
  if (!savedList) return [];
  
  try {
    const shoppingList: ShoppingList = JSON.parse(savedList);
    return formatShoppingListForExport(shoppingList);
  } catch (error) {
    console.error("Failed to parse shopping list:", error);
    return [];
  }
}
