
import React from "react";
import { format } from "date-fns";
import { useApp } from "@/context/AppContext";
import { MapPin, UtensilsCrossed } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ActivityTimeline: React.FC = () => {
  const { meals, runs, selectedDate } = useApp();

  // Combine meals and runs for the timeline with proper typing
  type MealActivity = {
    type: "meal";
  } & Omit<typeof meals[0], "type">;

  type RunActivity = {
    type: "run";
  } & Omit<typeof runs[0], "type">;

  type Activity = MealActivity | RunActivity;

  // Create properly typed activities array
  const activities: Activity[] = [
    ...meals.map((meal) => ({
      ...meal,
      type: "meal" as const,
    })),
    ...runs.map((run) => ({
      ...run,
      type: "run" as const,
    })),
  ];

  // Sort by date
  const sortedActivities = activities.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Group by date
  const groupedActivities: Record<string, typeof sortedActivities> = {};
  
  sortedActivities.forEach((activity) => {
    const dateKey = format(new Date(activity.date), "yyyy-MM-dd");
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
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No activities to display</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
        <CardDescription>Your upcoming and past activities</CardDescription>
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
                      <div className={`p-2 rounded-full ${activity.type === "meal" ? "bg-teal-100 text-teal-600" : "bg-blue-100 text-blue-600"}`}>
                        {activity.type === "meal" ? (
                          <UtensilsCrossed className="h-5 w-5" />
                        ) : (
                          <MapPin className="h-5 w-5" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 bg-white rounded-lg shadow p-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">{activity.title}</h3>
                        <span className="text-sm text-gray-500">
                          {format(new Date(activity.date), "h:mm a")}
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
