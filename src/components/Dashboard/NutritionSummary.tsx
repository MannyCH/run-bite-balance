
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useApp } from "@/context/AppContext";
import { format, startOfDay, endOfDay } from "date-fns";

const NutritionSummary: React.FC = () => {
  const { meals, selectedDate } = useApp();

  // Get today's meals
  const todayMeals = meals.filter(meal => {
    const mealDate = new Date(meal.date);
    return mealDate >= startOfDay(selectedDate) && mealDate <= endOfDay(selectedDate);
  });

  // Calculate totals
  const totalCalories = todayMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const totalProtein = todayMeals.reduce((sum, meal) => sum + meal.protein, 0);
  const totalCarbs = todayMeals.reduce((sum, meal) => sum + meal.carbs, 0);
  const totalFat = todayMeals.reduce((sum, meal) => sum + meal.fat, 0);

  // Data for the macro pie chart
  const macroData = [
    { name: "Protein", value: totalProtein * 4, color: "#3b82f6" }, // 4 calories per gram
    { name: "Carbs", value: totalCarbs * 4, color: "#eab308" },     // 4 calories per gram
    { name: "Fat", value: totalFat * 9, color: "#ef4444" },         // 9 calories per gram
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nutrition Summary</CardTitle>
        <CardDescription>
          {format(selectedDate, "MMMM d, yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-500 text-sm">Calories</div>
            <div className="text-2xl font-semibold">{totalCalories}</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg shadow">
            <div className="text-blue-600 text-sm">Protein</div>
            <div className="text-2xl font-semibold">{totalProtein}g</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg shadow">
            <div className="text-yellow-600 text-sm">Carbs</div>
            <div className="text-2xl font-semibold">{totalCarbs}g</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg shadow">
            <div className="text-red-600 text-sm">Fat</div>
            <div className="text-2xl font-semibold">{totalFat}g</div>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={macroData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {macroData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [`${value} cal`, name]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {todayMeals.length === 0 && (
          <div className="text-center text-gray-500 mt-4">
            No meals logged for today
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NutritionSummary;
