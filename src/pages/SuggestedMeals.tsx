
import React, { useEffect } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, addDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import RecipeImporter from "@/components/Recipe/RecipeImporter";
import { Archive } from "lucide-react";

const SuggestedMeals: React.FC = () => {
  const { recipes, selectedDate, planRecipeAsMeal } = useApp();
  const { toast } = useToast();

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

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

      <RecipeImporter />

      {recipes.length > 0 ? (
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
                  {recipe.calories > 0 ? `${recipe.calories} calories | ` : ''}
                  {recipe.protein > 0 ? `P: ${recipe.protein}g | ` : ''}
                  {recipe.carbs > 0 ? `C: ${recipe.carbs}g | ` : ''}
                  {recipe.fat > 0 ? `F: ${recipe.fat}g` : ''}
                  {recipe.servings && <div className="mt-1">Serves: {recipe.servings}</div>}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                {recipe.categories && recipe.categories.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {recipe.categories.map((category, index) => (
                      <span key={index} className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-700">
                        {category}
                      </span>
                    ))}
                  </div>
                )}
                
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
                
                {recipe.website && (
                  <a 
                    href={recipe.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline block truncate"
                  >
                    View original recipe
                  </a>
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
      ) : (
        <div className="text-center py-10 border border-dashed rounded-lg bg-gray-50">
          <Archive className="w-10 h-10 mx-auto text-gray-400 mb-2" />
          <h3 className="text-lg font-medium text-gray-700 mb-1">No recipes found</h3>
          <p className="text-gray-500 mb-4">Import recipes using the ZIP uploader above</p>
        </div>
      )}
    </MainLayout>
  );
};

export default SuggestedMeals;
