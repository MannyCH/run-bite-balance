
import React from "react";
import MainLayout from "../components/Layout/MainLayout";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, addDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const SuggestedMeals: React.FC = () => {
  const { recipes, selectedDate, planRecipeAsMeal } = useApp();
  const { toast } = useToast();

  const handlePlanMeal = (recipe: any, daysToAdd: number) => {
    const planDate = addDays(selectedDate, daysToAdd);
    planRecipeAsMeal(recipe, planDate);
    
    toast({
      title: "Meal planned",
      description: `${recipe.title} added to your meal plan for ${format(planDate, "MMM d")}`,
    });
  };

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Suggested Meals</h1>
        <p className="text-gray-600">
          Discover recipes from your RecipeChef collection
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {recipes.map((recipe) => (
          <Card key={recipe.id} className="overflow-hidden flex flex-col">
            {recipe.imgUrl && (
              <div className="h-48 overflow-hidden">
                <img
                  src={recipe.imgUrl}
                  alt={recipe.title}
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                />
              </div>
            )}
            <CardHeader>
              <CardTitle>{recipe.title}</CardTitle>
              <CardDescription>
                {recipe.calories} calories | P: {recipe.protein}g | C: {recipe.carbs}g | F: {recipe.fat}g
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              {recipe.ingredients && (
                <div className="mb-4">
                  <h4 className="font-medium mb-1">Ingredients:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {recipe.ingredients.slice(0, 4).map((ingredient, index) => (
                      <li key={index}>{ingredient}</li>
                    ))}
                    {recipe.ingredients.length > 4 && (
                      <li>+{recipe.ingredients.length - 4} more...</li>
                    )}
                  </ul>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button 
                onClick={() => handlePlanMeal(recipe, 0)}
                className="w-full"
              >
                Add to today
              </Button>
              <div className="flex gap-2 w-full">
                <Button 
                  onClick={() => handlePlanMeal(recipe, 1)} 
                  variant="outline"
                  className="flex-1"
                >
                  Tomorrow
                </Button>
                <Button 
                  onClick={() => handlePlanMeal(recipe, 2)} 
                  variant="outline"
                  className="flex-1"
                >
                  In 2 days
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
};

export default SuggestedMeals;
