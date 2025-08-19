
export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: string;
  isBought: boolean;
  category?: string;
}

export interface RecipeGroup {
  recipeId: string;
  recipeTitle: string;
  items: ShoppingListItem[];
}

export type ShoppingList = ShoppingListItem[];
