
import React from "react";
import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CardFooter } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RecipeStatsFooterProps {
  uniqueRecipeStats: {
    uniqueContent: number;
    totalAiMeals: number;
    uniqueIngredients: number;
    duplicateIngredientGroups: { ingredient: string; recipeIds: string[]; titles: string }[];
    selectedDayUniqueIngredients: number;
    selectedDayAiMeals: number;
    allIngredientsUnique: boolean;
  };
}

export const RecipeStatsFooter: React.FC<RecipeStatsFooterProps> = ({ uniqueRecipeStats }) => {
  return (
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
              <p className="text-sm font-medium mt-1">Ingredient Diversity:</p>
              <p className="text-sm">
                {uniqueRecipeStats.uniqueIngredients} unique main ingredients out of {uniqueRecipeStats.totalAiMeals} AI meals
              </p>
              {uniqueRecipeStats.duplicateIngredientGroups.length > 0 && (
                <p className="text-sm text-amber-500 mt-1">
                  {uniqueRecipeStats.duplicateIngredientGroups.length} recipes share main ingredients
                </p>
              )}
              <p className="text-sm mt-1">
                Today: {uniqueRecipeStats.selectedDayUniqueIngredients} unique main ingredients in today's {uniqueRecipeStats.selectedDayAiMeals} AI meals
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div>
        {uniqueRecipeStats.allIngredientsUnique ? (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            All unique ingredients
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            Some shared ingredients
          </Badge>
        )}
      </div>
    </CardFooter>
  );
};
