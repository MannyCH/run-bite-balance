
import React from "react";
import { NutritionBadges } from "./NutritionBadges";

interface RegularRecipeDisplayProps {
  recipe: any;
  displayValues: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  isPostRunLunch: boolean;
  isAnalyzing: boolean;
  needsNutritionAnalysis: boolean;
}

export const RegularRecipeDisplay: React.FC<RegularRecipeDisplayProps> = ({
  recipe,
  displayValues,
  isPostRunLunch,
  isAnalyzing,
  needsNutritionAnalysis
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      {recipe.imgurl && (
        <div className="md:w-1/4 h-40 overflow-hidden rounded-md">
          <img 
            src={recipe.imgurl} 
            alt={recipe.title} 
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="flex-1">
        <h3 className="text-lg font-medium">{recipe.title}</h3>
        {isPostRunLunch && (
          <p className="text-sm text-orange-600 font-medium mt-1">
            Optimized for post-run recovery
          </p>
        )}
        <div className="mt-2">
          <NutritionBadges 
            displayValues={displayValues}
            isAnalyzing={isAnalyzing}
            needsNutritionAnalysis={needsNutritionAnalysis}
          />
        </div>
        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-medium">Ingredients:</p>
            <ul className="text-sm mt-1 list-disc pl-5">
              {recipe.ingredients.slice(0, 3).map((ing: string, i: number) => (
                <li key={i} className="text-muted-foreground">{ing}</li>
              ))}
              {recipe.ingredients.length > 3 && (
                <li className="text-muted-foreground">+ {recipe.ingredients.length - 3} more</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
