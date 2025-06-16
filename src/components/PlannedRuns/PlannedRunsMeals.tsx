
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Meal } from "@/context/types";

interface PlannedRunsMealsProps {
  selectedDate: Date;
  selectedDateMeals: Meal[];
}

export const PlannedRunsMeals: React.FC<PlannedRunsMealsProps> = ({
  selectedDate,
  selectedDateMeals
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CalendarIcon className="h-5 w-5 mr-2" />
          Meals for this day
        </CardTitle>
      </CardHeader>
      <CardContent>
        {selectedDateMeals.length === 0 ? (
          <p className="text-gray-500">No meals planned for this date</p>
        ) : (
          <div className="space-y-4">
            {selectedDateMeals.map((meal) => (
              <div key={meal.id} className="flex items-center bg-white p-3 rounded-lg shadow">
                <div className="flex-shrink-0 mr-3">
                  {meal.imgUrl ? (
                    <img 
                      src={meal.imgUrl} 
                      alt={meal.title} 
                      className="h-12 w-12 rounded-md object-cover" 
                    />
                  ) : (
                    <div className="h-12 w-12 bg-teal-100 rounded-md flex items-center justify-center">
                      <span className="text-teal-600 font-bold">M</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="font-medium">{meal.title}</p>
                    <span className="text-sm text-gray-500">
                      {format(new Date(meal.date), "h:mm a")}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {meal.calories} cal · P: {meal.protein}g · C: {meal.carbs}g · F: {meal.fat}g
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
