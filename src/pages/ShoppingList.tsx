
import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { useShoppingList } from "@/context/ShoppingListContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ListChecks, Search, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

const ShoppingList: React.FC = () => {
  const { shoppingList, toggleItemBought, clearShoppingList } = useShoppingList();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = searchTerm
    ? shoppingList.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : shoppingList;

  const handleCheckboxChange = (id: string) => {
    toggleItemBought(id);
  };

  const handleClearList = () => {
    if (window.confirm("Are you sure you want to clear the shopping list?")) {
      clearShoppingList();
      toast.success("Shopping list cleared");
    }
  };

  const purchasedItems = shoppingList.filter(item => item.isBought).length;
  const totalItems = shoppingList.length;

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <ShoppingCart className="mr-2" />
          Shopping List
        </h1>
        <p className="text-gray-600">
          Items from your meal plan recipes
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <ListChecks className="h-5 w-5 mr-2" />
            Ingredients ({purchasedItems}/{totalItems})
          </CardTitle>
          <div className="flex space-x-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ingredients..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={handleClearList} disabled={shoppingList.length === 0}>
              Clear List
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-10">
              {shoppingList.length === 0 ? (
                <p className="text-muted-foreground">
                  Your shopping list is empty. Generate a meal plan to create your shopping list.
                </p>
              ) : (
                <p className="text-muted-foreground">No ingredients match your search.</p>
              )}
            </div>
          ) : (
            <ul className="space-y-2">
              {filteredItems.map((item) => (
                <li 
                  key={item.id} 
                  className="flex items-start p-2 border-b last:border-0 hover:bg-gray-50 rounded-md"
                >
                  <Checkbox 
                    id={item.id} 
                    checked={item.isBought}
                    onCheckedChange={() => handleCheckboxChange(item.id)}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <label 
                      htmlFor={item.id} 
                      className={`flex items-center cursor-pointer ${item.isBought ? 'line-through text-gray-400' : ''}`}
                    >
                      <span className="font-medium capitalize">{item.name}</span>
                      {item.quantity && (
                        <span className="ml-2 text-sm bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                          {item.quantity}
                        </span>
                      )}
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default ShoppingList;
