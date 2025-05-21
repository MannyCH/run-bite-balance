
export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: string;
  isBought: boolean;
}

export type ShoppingList = ShoppingListItem[];
