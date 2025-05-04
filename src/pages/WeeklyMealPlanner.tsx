
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { format, addDays, startOfWeek, endOfWeek, isToday, isSameDay } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MealPlan, MealPlanItem } from '@/types/profile';
import { Recipe } from '@/context/types';
import { CalendarIcon, Utensils, Plus, ArrowRight } from 'lucide-react';
import { generateMealPlan } from '@/utils/mealPlanGenerator';

const WeeklyMealPlanner = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, isOnboardingComplete, isLoading } = useProfile();
  const { toast } = useToast();

  const [activeMealPlan, setActiveMealPlan] = useState<MealPlan | null>(null);
  const [mealPlanItems, setMealPlanItems] = useState<MealPlanItem[]>([]);
  const [isLoadingMealPlan, setIsLoadingMealPlan] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 })); // Week starts on Monday
  const [weekEnd, setWeekEnd] = useState(endOfWeek(new Date(), { weekStartsOn: 1 })); // Week ends on Sunday
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  // Fetch available recipes
  useEffect(() => {
    const fetchRecipes = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('recipes')
          .select('*');

        if (error) {
          console.error('Error fetching recipes:', error);
          return;
        }

        if (data) {
          setRecipes(data.map(recipe => ({
            id: recipe.id,
            title: recipe.title,
            calories: recipe.calories,
            protein: recipe.protein,
            carbs: recipe.carbs,
            fat: recipe.fat,
            imgUrl: recipe.imgurl,
            isBlobUrl: recipe.is_blob_url,
            ingredients: recipe.ingredients,
            instructions: recipe.instructions,
            categories: recipe.categories,
            website: recipe.website,
            servings: recipe.servings,
          })));
        }
      } catch (error) {
        console.error('Error in fetchRecipes:', error);
      }
    };

    fetchRecipes();
  }, [user]);

  // Check if onboarding is complete, if not redirect to profile setup
  useEffect(() => {
    if (!isLoading && !isOnboardingComplete && user) {
      toast({
        title: "Profile Incomplete",
        description: "Please complete your profile setup to use the meal planner.",
      });
      navigate('/profile-setup');
    }
  }, [isLoading, isOnboardingComplete, navigate, user, toast]);

  // Fetch active meal plan for current week
  useEffect(() => {
    const fetchMealPlan = async () => {
      if (!user) return;

      setIsLoadingMealPlan(true);
      try {
        const weekStartStr = format(weekStart, 'yyyy-MM-dd');
        const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

        // Get meal plan for this week
        const { data: mealPlanData, error: mealPlanError } = await supabase
          .from('meal_plans')
          .select('*')
          .eq('user_id', user.id)
          .eq('week_start_date', weekStartStr)
          .eq('week_end_date', weekEndStr)
          .single();

        if (mealPlanError && mealPlanError.code !== 'PGRST116') { // PGRST116 means no rows returned
          console.error('Error fetching meal plan:', mealPlanError);
          return;
        }

        if (mealPlanData) {
          setActiveMealPlan(mealPlanData as MealPlan);

          // Get meal plan items for this plan
          const { data: itemsData, error: itemsError } = await supabase
            .from('meal_plan_items')
            .select('*, recipes(*)')
            .eq('meal_plan_id', mealPlanData.id);

          if (itemsError) {
            console.error('Error fetching meal plan items:', itemsError);
            return;
          }

          setMealPlanItems(itemsData as MealPlanItem[]);
        } else {
          setActiveMealPlan(null);
          setMealPlanItems([]);
        }
      } catch (error) {
        console.error('Error in fetchMealPlan:', error);
      } finally {
        setIsLoadingMealPlan(false);
      }
    };

    if (user) {
      fetchMealPlan();
    }
  }, [user, weekStart, weekEnd]);

  // Generate a new meal plan
  const handleGeneratePlan = async () => {
    if (!user || !profile) {
      toast({
        title: "Account Required",
        description: "Please sign in or complete your profile to generate a meal plan.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGeneratingPlan(true);
      toast({
        title: "Generating Meal Plan",
        description: "We're creating your personalized meal plan...",
      });

      // Format dates
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

      // Generate the meal plan using our utility
      const mealPlanData = await generateMealPlan({
        userId: user.id,
        profile,
        recipes,
        startDate: weekStartStr,
        endDate: weekEndStr,
      });

      if (!mealPlanData) {
        toast({
          title: "Error",
          description: "Failed to generate meal plan. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Refresh the data
      setActiveMealPlan(mealPlanData.mealPlan);
      setMealPlanItems(mealPlanData.mealPlanItems);

      toast({
        title: "Success",
        description: "Your personalized meal plan has been created!",
      });
    } catch (error: any) {
      console.error('Error generating meal plan:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate meal plan",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Generate days of the current week
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Get meal plan items for a specific day
  const getMealsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return mealPlanItems.filter(item => item.date === dateStr);
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Weekly Meal Planner</h1>
            <p className="text-muted-foreground">
              Plan your meals for the week based on your nutrition goals
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/account')}
              className="whitespace-nowrap"
            >
              Edit Profile
            </Button>
            <Button
              onClick={handleGeneratePlan}
              disabled={isGeneratingPlan}
              className="whitespace-nowrap"
            >
              {isGeneratingPlan ? "Generating..." : activeMealPlan ? "Regenerate Plan" : "Generate Plan"}
            </Button>
          </div>
        </div>

        {/* Week selector */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </span>
          </div>
          {/* Week navigation - can be implemented later */}
        </div>

        {/* Nutrition summary card - can show calculated values from profile */}
        {profile?.bmr && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Your Nutrition Summary</CardTitle>
              <CardDescription>Based on your profile and activity level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Daily Calories</div>
                  <div className="text-2xl font-bold">
                    {/* Estimate based on BMR and activity level */}
                    {Math.round(profile.bmr * (profile.activity_level === 'sedentary' ? 1.2 : 
                      profile.activity_level === 'light' ? 1.375 : 
                      profile.activity_level === 'moderate' ? 1.55 : 
                      profile.activity_level === 'active' ? 1.725 : 1.9))}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Protein</div>
                  <div className="text-2xl font-bold">
                    {/* ~30% of calories from protein (4 cal/g) */}
                    {Math.round(profile.bmr * 0.3 / 4)}g
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Carbs</div>
                  <div className="text-2xl font-bold">
                    {/* ~40% of calories from carbs (4 cal/g) */}
                    {Math.round(profile.bmr * 0.4 / 4)}g
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Fat</div>
                  <div className="text-2xl font-bold">
                    {/* ~30% of calories from fat (9 cal/g) */}
                    {Math.round(profile.bmr * 0.3 / 9)}g
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoadingMealPlan ? (
          <div className="text-center py-8">
            <div className="h-8 w-8 mx-auto mb-4 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            <p>Loading your meal plan...</p>
          </div>
        ) : !activeMealPlan ? (
          <Card className="border-dashed text-center">
            <CardContent className="py-12">
              <div className="flex flex-col items-center">
                <Utensils className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Meal Plan Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Generate a personalized meal plan based on your nutrition goals and preferences.
                </p>
                <Button onClick={handleGeneratePlan} disabled={isGeneratingPlan}>
                  {isGeneratingPlan ? "Generating..." : "Generate Meal Plan"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue={format(new Date(), 'yyyy-MM-dd')}>
            <TabsValidation>
              <TabsValidationHeader>
                {weekDays.map((day) => (
                  <TabsTrigger 
                    key={format(day, 'yyyy-MM-dd')} 
                    value={format(day, 'yyyy-MM-dd')}
                    className={`flex flex-col ${isToday(day) ? 'border-primary' : ''}`}
                  >
                    <span className="text-xs text-muted-foreground">{format(day, 'EEE')}</span>
                    <span className={`font-medium ${isToday(day) ? 'text-primary' : ''}`}>{format(day, 'd')}</span>
                  </TabsTrigger>
                ))}
              </TabsValidationHeader>

              <div className="mt-6">
                {weekDays.map((day) => (
                  <TabsContent key={format(day, 'yyyy-MM-dd')} value={format(day, 'yyyy-MM-dd')}>
                    <h2 className="text-xl font-semibold mb-4">
                      {isToday(day) ? 'Today' : format(day, 'EEEE, MMMM d')}
                    </h2>
                    <div className="space-y-6">
                      <MealTimeSection 
                        title="Breakfast" 
                        mealItems={getMealsForDay(day).filter(item => item.meal_type === 'breakfast')}
                        date={format(day, 'yyyy-MM-dd')}
                        mealPlanId={activeMealPlan.id}
                      />
                      <Separator />
                      <MealTimeSection 
                        title="Lunch" 
                        mealItems={getMealsForDay(day).filter(item => item.meal_type === 'lunch')}
                        date={format(day, 'yyyy-MM-dd')}
                        mealPlanId={activeMealPlan.id}
                      />
                      <Separator />
                      <MealTimeSection 
                        title="Dinner" 
                        mealItems={getMealsForDay(day).filter(item => item.meal_type === 'dinner')}
                        date={format(day, 'yyyy-MM-dd')}
                        mealPlanId={activeMealPlan.id}
                      />
                      <Separator />
                      <MealTimeSection 
                        title="Snacks" 
                        mealItems={getMealsForDay(day).filter(item => item.meal_type === 'snack')}
                        date={format(day, 'yyyy-MM-dd')}
                        mealPlanId={activeMealPlan.id}
                      />
                    </div>
                  </TabsContent>
                ))}
              </div>
            </TabsValidation>
          </Tabs>
        )}
      </div>
    </MainLayout>
  );
};

type MealTimeSectionProps = {
  title: string;
  mealItems: MealPlanItem[];
  date: string;
  mealPlanId: string;
};

const MealTimeSection = ({ title, mealItems, date, mealPlanId }: MealTimeSectionProps) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium">{title}</h3>
        {/* Add meal button could be implemented later */}
      </div>
      
      {mealItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mealItems.map((item) => (
            <MealCard key={item.id} mealItem={item} />
          ))}
        </div>
      ) : (
        <div className="bg-muted/30 rounded-lg p-4 text-center">
          <p className="text-muted-foreground">No {title.toLowerCase()} planned for this day</p>
          {/* Add meal button could be implemented later */}
        </div>
      )}
    </div>
  );
};

type MealCardProps = {
  mealItem: MealPlanItem & { recipes?: any };
};

const MealCard = ({ mealItem }: MealCardProps) => {
  const navigate = useNavigate();

  // Handle recipe navigation
  const handleViewRecipe = () => {
    if (mealItem.recipe_id) {
      navigate(`/recipe/${mealItem.recipe_id}`);
    }
  };

  // Get recipe details if available
  const recipe = mealItem.recipes;
  const title = mealItem.custom_title || (recipe ? recipe.title : 'Unnamed Meal');
  
  // Use recipe macros or fall back to meal item macros
  const calories = recipe ? recipe.calories : mealItem.calories || 0;
  const protein = recipe ? recipe.protein : mealItem.protein || 0;
  const carbs = recipe ? recipe.carbs : mealItem.carbs || 0;
  const fat = recipe ? recipe.fat : mealItem.fat || 0;

  return (
    <Card className="overflow-hidden">
      <div className="flex h-full">
        {/* Image or placeholder */}
        <div className="w-1/3 bg-muted">
          {recipe && recipe.imgurl ? (
            <img 
              src={recipe.imgurl} 
              alt={title} 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.classList.add('bg-muted', 'flex', 'items-center', 'justify-center');
                const icon = document.createElement('div');
                icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"></path><line x1="6" y1="17" x2="18" y2="17"></line></svg>';
                (e.target as HTMLImageElement).parentElement!.appendChild(icon);
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Utensils className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="w-2/3 p-4">
          <h4 className="font-medium line-clamp-2">{title}</h4>
          
          {/* Macro summary */}
          <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
            <div className="text-muted-foreground">Calories</div>
            <div className="font-medium">{calories}</div>
            <div className="text-muted-foreground">Protein</div>
            <div className="font-medium">{protein}g</div>
          </div>
          
          {/* Context/reasoning for this meal */}
          {mealItem.nutritional_context && (
            <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
              {mealItem.nutritional_context}
            </p>
          )}
          
          {/* View recipe button for linked recipes */}
          {mealItem.recipe_id && (
            <div className="mt-2">
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 h-auto text-xs"
                onClick={handleViewRecipe}
              >
                View Recipe <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

// TabsValidation components to fix TypeScript issues
const TabsValidation = ({ children }: { children: React.ReactNode }) => <div className="w-full">{children}</div>;

const TabsValidationHeader = ({ children }: { children: React.ReactNode }) => (
  <TabsList className="grid grid-cols-7 h-auto">
    {children}
  </TabsList>
);

export default WeeklyMealPlanner;
