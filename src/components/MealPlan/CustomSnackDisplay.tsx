
import React from "react";
import { Utensils } from "lucide-react";
import { NutritionBadges } from "./NutritionBadges";

interface CustomSnackDisplayProps {
  displayTitle: string;
  displayValues: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export const CustomSnackDisplay: React.FC<CustomSnackDisplayProps> = ({
  displayTitle,
  displayValues
}) => {
  return (
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 bg-blue-100 rounded-md flex items-center justify-center">
        <Utensils className="h-8 w-8 text-blue-600" />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-medium">{displayTitle}</h3>
        <div className="mt-2">
          <NutritionBadges displayValues={displayValues} />
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Quick and convenient nutrition for your run
        </p>
      </div>
    </div>
  );
};
