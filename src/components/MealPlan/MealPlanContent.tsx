
import React from "react";
import { Calendar, ShoppingCart, Flame, Clock, MapPin, Loader } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MealPlanItem } from "./MealPlanItem";
import { MealPlanItem as MealPlanItemType } from "@/types/profile";
import { useShoppingList } from "@/context/ShoppingListContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import { useRunCalories } from "@/hooks/useRunCalories";
import { useProfile } from "@/context/ProfileContext";

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
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { runs } = useApp();

  // Find planned imported runs for the selected date
  const plannedRunsForDate = runs.filter(run => 
    run.isImported && 
    run.isPlanned && 
    isSameDay(new Date(run.date), selectedDate)
  );

  const primaryRun = plannedRunsForDate.length > 0 ? plannedRunsForDate[0] : null;
  
  console.log('Displaying run for meal plan:', primaryRun ? {
    title: primaryRun.title,
    distance: primaryRun.distance + 'km (from iCal import)',
    isImported: primaryRun.isImported
  } : 'No run found for this date');
  const { calorieEstimate, isLoading: isLoadingCalories } = useRunCalories(primaryRun);

  // Get meals for the selected date with proper sorting
  const getSelectedDateMeals = () => {
    if (!mealPlanItems.length) return [];

    const mealsForDay = mealPlanItems.filter(item => {
      const itemDate = parseISO(item.date);
      return isSameDay(itemDate, selectedDate);
    });

    console.log(`Meals for ${format(selectedDate, 'yyyy-MM-dd')}:`, mealsForDay.map(m => `${m.meal_type}: ${m.custom_title || 'Recipe meal'}`));

    return mealsForDay.sort((a, b) => {
      // Sort by meal type: breakfast, pre_run_snack, lunch, dinner, post_run_snack
      const order = { 
        breakfast: 1, 
        pre_run_snack: 2, 
        lunch: 3, 
        dinner: 4, 
        post_run_snack: 5 
      };
      return (order[a.meal_type] || 6) - (order[b.meal_type] || 6);
    });
  };

  const handleGenerateShoppingList = async () => {
    // Collect all recipes used in the meal plan
    const recipesInPlan = Object.values(recipes).filter(recipe => 
      recipe && recipe.ingredients && Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0
    );
    
    if (recipesInPlan.length === 0) {
      toast.error("No recipes with ingredients found in the meal plan");
      return;
    }
    
    // Get batch cooking people setting from profile, default to 1
    const batchCookingPeople = profile?.batch_cooking_people || 1;
    
    console.log("Generating shopping list from recipes:", recipesInPlan);
    console.log("Using meal plan items:", mealPlanItems);
    console.log("Batch cooking for:", batchCookingPeople, "people");
    
    await generateShoppingList(recipesInPlan, mealPlanItems, batchCookingPeople);
    toast.success(`Shopping list generated for ${batchCookingPeople} people`);
    navigate("/shopping-list");
  };

  const selectedDateMeals = getSelectedDateMeals();

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
              <span className="truncate">Meals for {format(selectedDate, "EEEE, MMM d")}</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Your personalized meal plan for this day
              {primaryRun && ` • Run day: ${primaryRun.title}`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Run Calorie Information */}
        {primaryRun && (
          <div className="mb-6">
            <Alert className="border-orange-200 bg-orange-50">
              <Flame className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">{primaryRun.title}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {calorieEstimate && (
                        <span className="font-medium">
                          {calorieEstimate.recommendedIntake} calories recommended
                        </span>
                      )}
                    </div>
                  </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {selectedDateMeals.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No meals planned for this day</p>
          </div>
        ) : (
          <div className="space-y-6">
            {selectedDateMeals.map((item) => {
              const recipe = item.recipe_id ? recipes[item.recipe_id] : null;
              return <MealPlanItem key={item.id} item={item} recipe={recipe} />;
            })}
          </div>
        )}
      </CardContent>
      {Object.keys(recipes).length > 0 && (
        <CardFooter className="border-t pt-4 flex flex-col sm:flex-row sm:justify-end gap-2">
          <Button 
            onClick={handleGenerateShoppingList}
            className="flex items-center w-full sm:w-auto"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Generate Shopping List</span>
            <span className="sm:hidden">Shopping List</span>
            {profile?.batch_cooking_people && profile.batch_cooking_people > 1 && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                {profile.batch_cooking_people} people
              </span>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
