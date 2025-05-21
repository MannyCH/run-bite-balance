
import React from "react";

export interface RecipeStatsFooterProps {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export const RecipeStatsFooter: React.FC<RecipeStatsFooterProps> = ({
  calories,
  protein,
  carbs,
  fat
}) => {
  // Only render if we have at least one stat
  if (!calories && !protein && !carbs && !fat) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {calories !== undefined && calories > 0 && (
        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
          {calories} kcal
        </span>
      )}
      {protein !== undefined && protein > 0 && (
        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
          {protein}g protein
        </span>
      )}
      {carbs !== undefined && carbs > 0 && (
        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
          {carbs}g carbs
        </span>
      )}
      {fat !== undefined && fat > 0 && (
        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
          {fat}g fat
        </span>
      )}
    </div>
  );
};
