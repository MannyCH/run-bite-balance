
import React from "react";
import { format } from "date-fns";
import { MapPin, UtensilsCrossed, Route } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Run } from "@/context/types";
import { MealPlanItem } from "@/types/profile";

interface ActivityTimelineProps {
  runs: Run[];
  mealPlanItems: MealPlanItem[];
  recipes: Record<string, any>;
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ 
  runs, 
  mealPlanItems, 
  recipes 
}) => {
  // Create activity objects for runs and meals
  type RunActivity = {
    type: "run";
    id: string;
    title: string;
    date: Date;
    distance: number;
    duration: number;
    pace: number;
    isImported: boolean;
  };

  type MealActivity = {
    type: "meal";
    id: string;
    title: string;
    date: Date;
    meal_type: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    recipe_id?: string;
  };

  type Activity = RunActivity | MealActivity;

  // Convert runs to activities
  const runActivities: RunActivity[] = runs.map((run) => ({
    type: "run",
    id: run.id,
    title: run.title,
    date: new Date(run.date),
    distance: run.distance,
    duration: run.duration,
    pace: run.pace,
    isImported: run.isImported || false,
  }));

  // Convert meal plan items to activities
  const mealActivities: MealActivity[] = mealPlanItems.map((item) => {
    const recipe = item.recipe_id ? recipes[item.recipe_id] : null;
    return {
      type: "meal",
      id: item.id,
      title: item.custom_title || recipe?.title || "Planned Meal",
      date: new Date(item.date),
      meal_type: item.meal_type,
      calories: item.calories || recipe?.calories || 0,
      protein: item.protein || recipe?.protein || 0,
      carbs: item.carbs || recipe?.carbs || 0,
      fat: item.fat || recipe?.fat || 0,
      recipe_id: item.recipe_id,
    };
  });

  // Combine all activities
  const activities: Activity[] = [...runActivities, ...mealActivities];

  // Sort by date
  const sortedActivities = activities.sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  // Group by date
  const groupedActivities: Record<string, Activity[]> = {};
  
  sortedActivities.forEach((activity) => {
    const dateKey = format(activity.date, "yyyy-MM-dd");
    if (!groupedActivities[dateKey]) {
      groupedActivities[dateKey] = [];
    }
    groupedActivities[dateKey].push(activity);
  });

  // Convert to array and sort by date
  const timelineData = Object.entries(groupedActivities)
    .map(([dateKey, activities]) => ({ dateKey, activities }))
    .sort(
      (a, b) => 
        new Date(a.dateKey).getTime() - new Date(b.dateKey).getTime()
    );

  if (timelineData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <CardDescription>Your imported runs and planned meals</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No activities to display</p>
        </CardContent>
      </Card>
    );
  }

  const formatMealType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
        <CardDescription>Your imported runs and planned meals</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {timelineData.map(({ dateKey, activities }) => (
            <div key={dateKey} className="space-y-2">
              <div className="font-medium text-lg">
                {format(new Date(dateKey), "EEEE, MMMM d")}
              </div>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={`${activity.type}-${activity.id}`}
                    className="flex items-start space-x-4"
                  >
                    <div className="flex-shrink-0">
                      <div className={`p-2 rounded-full ${
                        activity.type === "meal" 
                          ? "bg-teal-100 text-teal-600" 
                          : "bg-blue-100 text-blue-600"
                      }`}>
                        {activity.type === "meal" ? (
                          <UtensilsCrossed className="h-5 w-5" />
                        ) : (
                          <Route className="h-5 w-5" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 bg-white rounded-lg shadow p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{activity.title}</h3>
                          {activity.type === "run" && (
                            <span className="text-xs text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded-full">
                              Imported
                            </span>
                          )}
                          {activity.type === "meal" && (
                            <Badge variant="outline" className="text-xs">
                              {formatMealType((activity as MealActivity).meal_type)}
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {format(activity.date, "h:mm a")}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        {activity.type === "meal" ? (
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="bg-teal-50 text-teal-700 text-xs px-2 py-1 rounded">
                              {(activity as MealActivity).calories} cal
                            </span>
                            <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">
                              P: {(activity as MealActivity).protein}g
                            </span>
                            <span className="bg-yellow-50 text-yellow-700 text-xs px-2 py-1 rounded">
                              C: {(activity as MealActivity).carbs}g
                            </span>
                            <span className="bg-red-50 text-red-700 text-xs px-2 py-1 rounded">
                              F: {(activity as MealActivity).fat}g
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">
                              {(activity as RunActivity).distance} km
                            </span>
                            <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded">
                              {Math.floor((activity as RunActivity).duration / 60)} min
                            </span>
                            <span className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded">
                              {(activity as RunActivity).pace}/km
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityTimeline;
