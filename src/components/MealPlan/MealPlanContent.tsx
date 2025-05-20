
import React, { useMemo } from "react";
import { Calendar, Info } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { MealPlanItem } from "./MealPlanItem";
import { MealPlanItem as MealPlanItemType } from "@/types/profile";
import { Toaster } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { generateRecipeContentHash } from "@/utils/mealPlan/recipe/getRandomRecipe";

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

  // Check if there are any AI-generated meals for the selected date
  const selectedDateMeals = getSelectedDateMeals();
  const hasAiGeneratedMeals = selectedDateMeals.some(item => item.is_ai_generated);
  
  // Calculate uniqueness stats - both by ID and by content
  const uniqueRecipeStats = useMemo(() => {
    // Get all AI-generated recipes for the entire week
    const aiMeals = mealPlanItems.filter(item => item.is_ai_generated);
    
    // Count unique recipe IDs
    const uniqueIds = new Set(aiMeals.map(item => item.recipe_id));
    
    // Count unique content signatures (true uniqueness)
    const uniqueContentHashes = new Set();
    const contentToRecipeMap = new Map();
    
    aiMeals.forEach(item => {
      if (item.recipe_id && recipes[item.recipe_id]) {
        const recipe = recipes[item.recipe_id];
        const contentHash = generateRecipeContentHash(recipe);
        uniqueContentHashes.add(contentHash);
        
        // Store the mapping for debugging
        if (!contentToRecipeMap.has(contentHash)) {
          contentToRecipeMap.set(contentHash, []);
        }
        contentToRecipeMap.get(contentHash).push(item.recipe_id);
      }
    });
    
    // Identify any duplicate content recipes
    const duplicateContentGroups = Array.from(contentToRecipeMap.entries())
      .filter(([_, recipeIds]) => recipeIds.length > 1)
      .map(([contentHash, recipeIds]) => ({
        contentHash,
        recipeIds,
        titles: recipeIds.map(id => recipes[id]?.title || 'Unknown').join(', ')
      }));
    
    // Check if all AI recipes across the entire week are truly unique by content
    const allAiRecipesContentUnique = duplicateContentGroups.length === 0;
    
    // For the selected day specifically
    const selectedDayAiMeals = selectedDateMeals.filter(item => item.is_ai_generated);
    const selectedDayContentHashes = new Set();
    selectedDayAiMeals.forEach(item => {
      if (item.recipe_id && recipes[item.recipe_id]) {
        const recipe = recipes[item.recipe_id];
        const contentHash = generateRecipeContentHash(recipe);
        selectedDayContentHashes.add(contentHash);
      }
    });
    
    return {
      totalAiMeals: aiMeals.length,
      uniqueIds: uniqueIds.size,
      uniqueContent: uniqueContentHashes.size,
      allUnique: allAiRecipesContentUnique,
      duplicateContentGroups,
      selectedDayAiMeals: selectedDayAiMeals.length,
      selectedDayUniqueContent: selectedDayContentHashes.size
    };
  }, [mealPlanItems, recipes, selectedDateMeals]);
  
  // Check if the selected date's meals have unique recipes
  const uniqueRecipeCount = new Set(selectedDateMeals.map(item => item.recipe_id)).size;
  const allRecipesUnique = uniqueRecipeCount === selectedDateMeals.length;

  return (
    <>
      <Toaster position="top-right" />
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Meals for {format(selectedDate, "EEEE, MMMM d")}
              </CardTitle>
              <CardDescription className="flex items-center space-x-2">
                <span>Your personalized meal plan for this day</span>
                {hasAiGeneratedMeals && (
                  <Badge className="ml-2 bg-purple-500 hover:bg-purple-600">
                    AI-generated
                  </Badge>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
        {hasAiGeneratedMeals && (
          <CardFooter className="flex justify-between items-center border-t pt-4">
            <div className="flex items-center space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center text-sm text-muted-foreground cursor-help">
                      <Info className="h-4 w-4 mr-1" />
                      <span>AI Recipe Stats</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm font-medium">Content-Based Uniqueness:</p>
                    <p className="text-sm">
                      {uniqueRecipeStats.uniqueContent} unique recipe contents out of {uniqueRecipeStats.totalAiMeals} AI meals
                    </p>
                    {uniqueRecipeStats.duplicateContentGroups.length > 0 && (
                      <p className="text-sm text-amber-500 mt-1">
                        Found {uniqueRecipeStats.duplicateContentGroups.length} recipes with duplicate content
                      </p>
                    )}
                    <p className="text-sm mt-1">
                      Today: {uniqueRecipeStats.selectedDayUniqueContent} unique recipes out of {uniqueRecipeStats.selectedDayAiMeals} AI meals
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div>
              {uniqueRecipeStats.allUnique ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  All unique AI recipes
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  Some similar AI recipes
                </Badge>
              )}
            </div>
          </CardFooter>
        )}
      </Card>
    </>
  );
};
