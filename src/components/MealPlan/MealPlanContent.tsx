
import React from "react";
import { Calendar, ShoppingCart } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MealPlanItem } from "./MealPlanItem";
import { MealPlanItem as MealPlanItemType } from "@/types/profile";
import { useShoppingList } from "@/context/ShoppingListContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface MealPlanContentProps {
  selectedDate: Date;
  mealPlanItems: MealPlanItemType[];
  recipes: Record<string, any>;
}

export const MealPlanContent: React.FC<MealPlanContentProps> = ({
  selectedDate,
  mealPlanItems,
  recipes
}) => {
  const { generateShoppingList } = useShoppingList();
  const navigate = useNavigate();

  // Get meals for the selected date
  const getSelectedDateMeals = () => {
    if (!mealPlanItems.length) return [];

    return mealPlanItems.filter(item => {
      const itemDate = parseISO(item.date);
      return isSameDay(itemDate, selectedDate);
    }).sort((a, b) => {
      // Sort by meal type: breakfast, lunch, dinner, snack
      const order = { breakfast: 1, lunch: 2, dinner: 3, snack: 4 };
      return order[a.meal_type] - order[b.meal_type];
    });
  };

  const handleGenerateShoppingList = () => {
    // Collect all recipes used in the meal plan
    const recipesInPlan = Object.values(recipes).filter(recipe => recipe && recipe.ingredients);
    
    if (recipesInPlan.length === 0) {
      toast.error("No recipes with ingredients found in the meal plan");
      return;
    }
    
    generateShoppingList(recipesInPlan);
    toast.success("Shopping list generated successfully");
    navigate("/shopping-list");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Meals for {format(selectedDate, "EEEE, MMMM d")}
            </CardTitle>
            <CardDescription>
              Your personalized meal plan for this day
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {getSelectedDateMeals().length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No meals planned for this day</p>
          </div>
        ) : (
          <div className="space-y-6">
            {getSelectedDateMeals().map((item) => {
              const recipe = item.recipe_id ? recipes[item.recipe_id] : null;
              return <MealPlanItem key={item.id} item={item} recipe={recipe} />;
            })}
          </div>
        )}
      </CardContent>
      {Object.keys(recipes).length > 0 && (
        <CardFooter className="border-t pt-4 flex justify-end">
          <Button 
            onClick={handleGenerateShoppingList}
            className="flex items-center"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Generate Shopping List
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
