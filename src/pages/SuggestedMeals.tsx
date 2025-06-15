
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../components/Layout/MainLayout";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, addDays, isSameDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import RecipeImporter from "@/components/Recipe/RecipeImporter";
import { Archive, Loader, Flame, Clock, MapPin } from "lucide-react";
import { useRunCalories } from "@/hooks/useRunCalories";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SuggestedMeals: React.FC = () => {
  const { recipes, selectedDate, planRecipeAsMeal, isLoadingRecipes, runs } = useApp();
  const { toast } = useToast();

  // Find planned imported runs for the selected date
  const plannedRunsForDate = runs.filter(run => 
    run.isImported && 
    run.isPlanned && 
    isSameDay(new Date(run.date), selectedDate)
  );

  const primaryRun = plannedRunsForDate.length > 0 ? plannedRunsForDate[0] : null;
  const { calorieEstimate, isLoading: isLoadingCalories } = useRunCalories(primaryRun);

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

  // Helper function for rendering recipe image with fallback
  const renderRecipeImage = (recipe: any) => {
    // If there's no image, don't render the image container
    if (!recipe.imgUrl) {
      return (
        <div className="h-48 overflow-hidden relative bg-gray-100 flex items-center justify-center">
          <div className="text-4xl font-bold text-gray-500">
            {recipe.title.charAt(0).toUpperCase()}
          </div>
        </div>
      );
    }
    
    // Regular image with error handling
    return (
      <div className="h-48 overflow-hidden relative bg-gray-100">
        <img
          src={recipe.imgUrl}
          alt={recipe.title}
          className="w-full h-full object-cover transition-transform hover:scale-105"
          onError={(e) => {
            // If image fails to load, show recipe title as placeholder
            (e.target as HTMLImageElement).style.display = 'none';
            // Add a fallback display of the first letter of the recipe title
            const parent = (e.target as HTMLImageElement).parentNode as HTMLElement;
            if (parent) {
              const placeholderDiv = document.createElement('div');
              placeholderDiv.className = 'w-full h-full flex items-center justify-center bg-gray-200 text-4xl font-bold text-gray-500';
              placeholderDiv.textContent = recipe.title.charAt(0).toUpperCase();
              parent.appendChild(placeholderDiv);
            }
          }}
        />
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Suggested Meals</h1>
        <p className="text-gray-600">
          Discover recipes from your Supabase database for {format(selectedDate, "MMMM d, yyyy")}
        </p>
      </div>

      {/* Run Calorie Information */}
      {primaryRun && (
        <div className="mb-6">
          <Alert className="border-orange-200 bg-orange-50">
            <Flame className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">{primaryRun.title}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {Math.round(primaryRun.duration / 60)} min
                  </span>
                  <span>{primaryRun.distance} km</span>
                  {isLoadingCalories ? (
                    <span className="flex items-center gap-1">
                      <Loader className="h-3 w-3 animate-spin" />
                      Calculating calories...
                    </span>
                  ) : calorieEstimate ? (
                    <span className="font-medium">
                      ~{calorieEstimate.recommendedIntake} calories recommended for fueling & recovery
                    </span>
                  ) : null}
                </div>
              </div>
              {calorieEstimate && !isLoadingCalories && (
                <div className="mt-2 text-sm text-orange-700">
                  {calorieEstimate.explanation}
                </div>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}

      <RecipeImporter />

      {isLoadingRecipes ? (
        <div className="flex justify-center items-center py-20">
          <Loader className="h-8 w-8 animate-spin text-blue-500 mr-2" />
          <div className="text-lg text-gray-600">Loading recipes from Supabase...</div>
        </div>
      ) : recipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <Card key={recipe.id} className="overflow-hidden flex flex-col">
              <Link to={`/recipe/${recipe.id}`} className="cursor-pointer">
                {renderRecipeImage(recipe)}
              </Link>
              <CardHeader>
                <Link to={`/recipe/${recipe.id}`} className="cursor-pointer">
                  <CardTitle>{recipe.title}</CardTitle>
                </Link>
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
                <Link to={`/recipe/${recipe.id}`} className="w-full">
                  <Button 
                    variant="ghost"
                    className="w-full mt-1"
                  >
                    View details
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border border-dashed rounded-lg bg-gray-50">
          <Archive className="w-10 h-10 mx-auto text-gray-400 mb-2" />
          <h3 className="text-lg font-medium text-gray-700 mb-1">No recipes found</h3>
          <p className="text-gray-500 mb-4">Import recipes using the ZIP uploader above or add recipes manually</p>
        </div>
      )}
    </MainLayout>
  );
};

export default SuggestedMeals;
