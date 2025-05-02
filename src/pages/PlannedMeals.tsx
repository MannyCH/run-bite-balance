
import React from "react";
import MainLayout from "../components/Layout/MainLayout";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";

const PlannedMeals: React.FC = () => {
  const { meals, selectedDate, setSelectedDate } = useApp();

  // Filter for planned meals only
  const plannedMeals = meals.filter((meal) => meal.isPlanned);

  // Get meals for the selected date
  const selectedDateMeals = plannedMeals.filter((meal) => {
    const mealDate = new Date(meal.date);
    return (
      mealDate.getDate() === selectedDate.getDate() &&
      mealDate.getMonth() === selectedDate.getMonth() &&
      mealDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Planned Meals</h1>
        <p className="text-gray-600">
          Schedule and organize your upcoming meals
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>Select a date to view planned meals</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border pointer-events-auto"
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Meals for {format(selectedDate, "MMMM d, yyyy")}
              </CardTitle>
              <CardDescription>
                {selectedDateMeals.length} meals planned
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDateMeals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No meals planned for this date</p>
                  <button className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition">
                    Plan a Meal
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDateMeals.map((meal) => (
                    <div
                      key={meal.id}
                      className="flex flex-col md:flex-row bg-white rounded-lg shadow overflow-hidden"
                    >
                      {meal.imgUrl && (
                        <div className="md:w-1/4">
                          <img
                            src={meal.imgUrl}
                            alt={meal.title}
                            className="h-40 w-full md:h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4 flex-1">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold">{meal.title}</h3>
                          <span className="text-gray-500">
                            {format(new Date(meal.date), "h:mm a")}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="bg-teal-50 text-teal-700 text-xs px-2 py-1 rounded">
                            {meal.calories} cal
                          </span>
                          <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">
                            P: {meal.protein}g
                          </span>
                          <span className="bg-yellow-50 text-yellow-700 text-xs px-2 py-1 rounded">
                            C: {meal.carbs}g
                          </span>
                          <span className="bg-red-50 text-red-700 text-xs px-2 py-1 rounded">
                            F: {meal.fat}g
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default PlannedMeals;
