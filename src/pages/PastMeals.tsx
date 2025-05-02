
import React from "react";
import MainLayout from "../components/Layout/MainLayout";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const PastMeals: React.FC = () => {
  const { meals } = useApp();

  // Filter for past meals only (not planned)
  const pastMeals = meals
    .filter((meal) => !meal.isPlanned)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate nutrition totals
  const totalCalories = pastMeals.reduce((acc, meal) => acc + meal.calories, 0);
  const totalProtein = pastMeals.reduce((acc, meal) => acc + meal.protein, 0);
  const totalCarbs = pastMeals.reduce((acc, meal) => acc + meal.carbs, 0);
  const totalFat = pastMeals.reduce((acc, meal) => acc + meal.fat, 0);

  // Average per meal
  const avgCalories = Math.round(totalCalories / (pastMeals.length || 1));
  const avgProtein = Math.round(totalProtein / (pastMeals.length || 1));
  const avgCarbs = Math.round(totalCarbs / (pastMeals.length || 1));
  const avgFat = Math.round(totalFat / (pastMeals.length || 1));

  // Data for the macro distribution chart
  const macroData = [
    { name: "Protein", value: totalProtein * 4, color: "#3b82f6" }, // 4 calories per gram
    { name: "Carbs", value: totalCarbs * 4, color: "#eab308" },     // 4 calories per gram
    { name: "Fat", value: totalFat * 9, color: "#ef4444" },         // 9 calories per gram
  ];

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Past Meals</h1>
        <p className="text-gray-600">
          Review your meal history and nutritional data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Nutrition Summary</CardTitle>
              <CardDescription>Average per meal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-gray-500 text-sm">Calories</div>
                    <div className="text-2xl font-semibold">{avgCalories}</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg shadow">
                    <div className="text-blue-600 text-sm">Protein</div>
                    <div className="text-2xl font-semibold">{avgProtein}g</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg shadow">
                    <div className="text-yellow-600 text-sm">Carbs</div>
                    <div className="text-2xl font-semibold">{avgCarbs}g</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg shadow">
                    <div className="text-red-600 text-sm">Fat</div>
                    <div className="text-2xl font-semibold">{avgFat}g</div>
                  </div>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={macroData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {macroData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [`${Math.round(value)} cal`, name]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Meal History</CardTitle>
              <CardDescription>Your past logged meals</CardDescription>
            </CardHeader>
            <CardContent>
              {pastMeals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No past meals logged</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pastMeals.map((meal) => (
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
                            {format(new Date(meal.date), "MMM d, h:mm a")}
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

export default PastMeals;
