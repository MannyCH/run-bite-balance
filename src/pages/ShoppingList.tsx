import React, { useState, useEffect } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { useShoppingList } from "@/context/ShoppingListContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ListChecks, Search, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { ShoppingListItem } from "@/types/shoppingList";
import { AutomationButtons } from "@/components/ShoppingList/AutomationButtons";

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

  // Group items by category
  const groupedItems = filteredItems.reduce((groups, item) => {
    const category = item.category || "Other";
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<string, ShoppingListItem[]>);

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <ShoppingCart className="mr-2" />
          Shopping List
        </h1>
        <p className="text-gray-600">
          Items from your meal plan recipes, organized by category
        </p>
      </div>

      {/* Add automation buttons before the main card */}
      <div className="mb-6">
        <AutomationButtons shoppingList={shoppingList} />
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <CardTitle className="flex items-center">
            <ListChecks className="h-5 w-5 mr-2" />
            Ingredients ({purchasedItems}/{totalItems})
          </CardTitle>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ingredients..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={handleClearList} disabled={shoppingList.length === 0} className="w-full sm:w-auto">
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
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-lg font-medium mb-3 text-gray-700 border-b pb-1">
                    {category}
                  </h3>
                  <ul className="space-y-2 ml-4">
                    {items.map((item) => (
                      <li 
                        key={item.id} 
                        className="flex items-center p-3 sm:p-2 border-b last:border-0 hover:bg-gray-50 rounded-md"
                      >
                        <Checkbox 
                          id={item.id} 
                          checked={item.isBought}
                          onCheckedChange={() => handleCheckboxChange(item.id)}
                          className="mr-3 flex-shrink-0"
                        />
                        
                        <div className="flex flex-col sm:flex-row sm:items-center flex-1 space-y-1 sm:space-y-0">
                          {item.quantity && (
                            <Badge variant="secondary" className="mr-0 sm:mr-3 text-xs px-2 py-0.5 w-fit">
                              {item.quantity}
                            </Badge>
                          )}
                          
                          <label 
                            htmlFor={item.id} 
                            className={`cursor-pointer ${item.isBought ? 'line-through text-gray-400' : ''}`}
                          >
                            <span className="font-medium capitalize text-sm sm:text-base">{item.name}</span>
                          </label>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default ShoppingList;
