
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MealPlanItem as MealPlanItemType } from "@/types/profile";
import { AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MealPlanItemProps {
  item: MealPlanItemType;
  recipe: any | null;
}

export const MealPlanItem: React.FC<MealPlanItemProps> = ({ item, recipe }) => {
  // Determine what title to display
  const title = item.custom_title || (recipe ? recipe.title : "Recipe removed");
  
  // If recipe exists, use its data; otherwise fall back to item data
  const calories = recipe ? recipe.calories : item.calories || 0;
  const protein = recipe ? recipe.protein : item.protein || 0;
  const carbs = recipe ? recipe.carbs : item.carbs || 0;
  const fat = recipe ? recipe.fat : item.fat || 0;
  
  // Get the image URL if available
  const imageUrl = recipe?.imgurl || "/placeholder.svg";

  // Format meal type for display
  const formatMealType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-5 h-full">
        {/* Left side: Image */}
        <div className="col-span-1 bg-gray-100">
          <div
            className="h-full w-full bg-cover bg-center"
            style={{
              backgroundImage: `url(${imageUrl})`,
              minHeight: "120px",
            }}
          />
        </div>

        {/* Right side: Info */}
        <CardContent className="col-span-4 p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {formatMealType(item.meal_type)}
                </p>
                <h3 className="text-lg font-semibold flex items-center">
                  {title}
                  {!recipe && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <AlertCircle className="h-4 w-4 ml-2 text-amber-500" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Recipe has been removed from database</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </h3>
              </div>
              {item.is_ai_generated && (
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                  AI-generated
                </span>
              )}
            </div>

            {item.nutritional_context && (
              <p className="text-sm text-gray-600 mb-2">{item.nutritional_context}</p>
            )}
          </div>

          <div className="flex space-x-4 text-sm text-gray-500 mt-2">
            <span>{calories} cal</span>
            <span>{protein}g protein</span>
            <span>{carbs}g carbs</span>
            <span>{fat}g fat</span>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};
