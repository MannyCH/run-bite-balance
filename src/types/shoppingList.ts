
export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: string;
  isBought: boolean;
  category?: string;
}

export type ShoppingList = ShoppingListItem[];
