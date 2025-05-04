
import React, { useEffect, useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay, addDays, parseISO } from "date-fns";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { generateMealPlanForUser } from "@/utils/mealPlanGenerator";
import { MealPlan, MealPlanItem } from "@/types/profile";

const WeeklyMealPlanner: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [mealPlanItems, setMealPlanItems] = useState<MealPlanItem[]>([]);
  const [recipes, setRecipes] = useState<Record<string, any>>({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [daysOfWeek, setDaysOfWeek] = useState<Date[]>([]);

  // Initialize the days of the week based on the meal plan start date
  useEffect(() => {
    if (mealPlan) {
      const startDate = parseISO(mealPlan.week_start_date);
      const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
      setDaysOfWeek(days);
      setSelectedDate(days[0]);
    } else {
      // If no meal plan, use current date
      const today = new Date();
      const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
      setDaysOfWeek(days);
      setSelectedDate(today);
    }
  }, [mealPlan]);

  // Fetch the latest meal plan
  const fetchLatestMealPlan = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      // Get the latest meal plan
      const { data: planData, error: planError } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (planError) {
        console.error('Error fetching meal plan:', planError);
        return;
      }

      if (!planData || planData.length === 0) {
        setIsLoading(false);
        return;
      }

      const plan = planData[0];
      setMealPlan(plan);

      // Get the meal plan items
      const { data: itemsData, error: itemsError } = await supabase
        .from('meal_plan_items')
        .select('*')
        .eq('meal_plan_id', plan.id);

      if (itemsError) {
        console.error('Error fetching meal plan items:', itemsError);
        return;
      }

      setMealPlanItems(itemsData || []);

      // Get all recipe IDs from the meal plan items
      const recipeIds = itemsData
        ?.filter(item => item.recipe_id)
        .map(item => item.recipe_id) || [];

      if (recipeIds.length > 0) {
        // Fetch all recipes at once
        const { data: recipesData, error: recipesError } = await supabase
          .from('recipes')
          .select('*')
          .in('id', recipeIds);

        if (recipesError) {
          console.error('Error fetching recipes:', recipesError);
          return;
        }

        // Create a map of recipe ID to recipe
        const recipesMap = (recipesData || []).reduce((acc, recipe) => {
          if (recipe.id) {
            acc[recipe.id] = recipe;
          }
          return acc;
        }, {} as Record<string, any>);

        setRecipes(recipesMap);
      }

    } catch (error) {
      console.error('Error in fetchLatestMealPlan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate a new meal plan
  const handleGenerateMealPlan = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You need to be signed in to generate a meal plan.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateMealPlanForUser(user.id);

      if (result) {
        toast({
          title: "Success",
          description: "Your meal plan has been generated successfully!",
        });
        // Refresh data
        await fetchLatestMealPlan();
      } else {
        toast({
          title: "Error",
          description: "Failed to generate a meal plan. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating meal plan:', error);
      toast({
        title: "Error",
        description: "Something went wrong while generating your meal plan.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Get meals for the selected date
  const getSelectedDateMeals = () => {
    if (!mealPlanItems.length) return [];

    return mealPlanItems.filter(item => {
      const itemDate = parseISO(item.date);
      return isSameDay(itemDate, selectedDate);
    }).sort((a, b) => {
      // Sort by meal type: breakfast, lunch, dinner, snack
      const order = { breakfast: 1, lunch: 2, dinner: 3, snack: 4 };
      return order[a.meal_type as keyof typeof order] - order[b.meal_type as keyof typeof order];
    });
  };

  // Load data when component mounts
  useEffect(() => {
    fetchLatestMealPlan();
  }, [user?.id]);

  // Format meal type for display
  const formatMealType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Weekly Meal Planner</h1>
        <p className="text-gray-600">
          View your personalized meal plan based on your profile
        </p>
      </div>

      {/* Generate Meal Plan Button */}
      <Card className="mb-6">
        <CardContent className="pt-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Need a new meal plan?</h3>
            <p className="text-muted-foreground">
              Generate a personalized plan based on your profile and dietary preferences
            </p>
          </div>
          <Button 
            onClick={handleGenerateMealPlan}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate New Plan'}
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      ) : mealPlan ? (
        <>
          {/* Calendar Days */}
          <div className="flex overflow-x-auto space-x-2 py-2 mb-6">
            {daysOfWeek.map((date, i) => (
              <Button
                key={i}
                onClick={() => setSelectedDate(date)}
                variant={isSameDay(date, selectedDate) ? "default" : "outline"}
                className={`min-w-[100px] ${isSameDay(date, selectedDate) ? "" : "bg-white"}`}
              >
                <div>
                  <div className="text-xs">{format(date, "EEE")}</div>
                  <div className="font-bold">{format(date, "MMM d")}</div>
                </div>
              </Button>
            ))}
          </div>

          {/* Selected Day Meals */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Meals for {format(selectedDate, "EEEE, MMMM d")}
                  </CardTitle>
                  <CardDescription>
                    Your personalized meal plan for this day
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {getSelectedDateMeals().length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No meals planned for this day</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {getSelectedDateMeals().map((item) => {
                    const recipe = item.recipe_id ? recipes[item.recipe_id] : null;
                    return (
                      <div key={item.id} className="border rounded-lg overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                          <div className="flex items-center">
                            <Badge variant="outline" className="font-medium">
                              {formatMealType(item.meal_type)}
                            </Badge>
                          </div>
                          {item.nutritional_context && (
                            <span className="text-sm text-muted-foreground">
                              {item.nutritional_context}
                            </span>
                          )}
                        </div>
                        <div className="p-4">
                          {recipe ? (
                            <div className="flex flex-col md:flex-row gap-4">
                              {recipe.imgurl && (
                                <div className="md:w-1/4 h-40 overflow-hidden rounded-md">
                                  <img 
                                    src={recipe.imgurl} 
                                    alt={recipe.title} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}
                              <div className="flex-1">
                                <h3 className="text-lg font-medium">{recipe.title}</h3>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {item.calories && (
                                    <Badge variant="secondary">{item.calories} cal</Badge>
                                  )}
                                  {item.protein && (
                                    <Badge variant="secondary">P: {item.protein}g</Badge>
                                  )}
                                  {item.carbs && (
                                    <Badge variant="secondary">C: {item.carbs}g</Badge>
                                  )}
                                  {item.fat && (
                                    <Badge variant="secondary">F: {item.fat}g</Badge>
                                  )}
                                </div>
                                {recipe.ingredients && recipe.ingredients.length > 0 && (
                                  <div className="mt-3">
                                    <p className="text-sm font-medium">Ingredients:</p>
                                    <ul className="text-sm mt-1 list-disc pl-5">
                                      {recipe.ingredients.slice(0, 3).map((ing: string, i: number) => (
                                        <li key={i} className="text-muted-foreground">{ing}</li>
                                      ))}
                                      {recipe.ingredients.length > 3 && (
                                        <li className="text-muted-foreground">+ {recipe.ingredients.length - 3} more</li>
                                      )}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p>Recipe information not available</p>
                          )}
                        </div>
                        <CardFooter className="bg-gray-50 border-t">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => recipe && navigate(`/recipe/${recipe.id}`)}
                            disabled={!recipe}
                          >
                            View Recipe Details
                          </Button>
                        </CardFooter>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        // No meal plan exists
        <Card>
          <CardHeader>
            <CardTitle>No Meal Plan Found</CardTitle>
            <CardDescription>
              You don't have any meal plans generated yet. Create one to get started!
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pt-4 pb-8">
            <Button
              onClick={handleGenerateMealPlan}
              disabled={isGenerating}
              size="lg"
            >
              {isGenerating ? 'Generating...' : 'Generate Meal Plan'}
            </Button>
          </CardContent>
        </Card>
      )}
    </MainLayout>
  );
};

export default WeeklyMealPlanner;
