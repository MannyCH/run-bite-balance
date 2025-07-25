
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { MealPlan, MealPlanItem } from "@/types/profile";
import { format, addDays, parseISO, isWithinInterval } from "date-fns";
import { validateMealType, validateStatus } from "@/utils/mealPlan";

export const useMealPlan = () => {
  const { user } = useAuth();
  const { runs } = useApp();
  const [isLoading, setIsLoading] = useState(true);
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

  // Get runs for the current meal plan date range
  const getRunsForMealPlan = () => {
    if (!mealPlan) return [];
    
    const startDate = parseISO(mealPlan.week_start_date);
    const endDate = parseISO(mealPlan.week_end_date);
    
    return runs.filter(run => {
      const runDate = new Date(run.date);
      return isWithinInterval(runDate, { start: startDate, end: endDate }) && run.isPlanned;
    });
  };

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
      
      // Ensure the plan status is properly typed
      const typedPlan: MealPlan = {
        id: plan.id,
        user_id: plan.user_id,
        week_start_date: plan.week_start_date,
        week_end_date: plan.week_end_date,
        created_at: plan.created_at,
        status: validateStatus(plan.status)
      };
      
      setMealPlan(typedPlan);

      // Get the meal plan items
      const { data: itemsData, error: itemsError } = await supabase
        .from('meal_plan_items')
        .select('*')
        .eq('meal_plan_id', plan.id);

      if (itemsError) {
        console.error('Error fetching meal plan items:', itemsError);
        return;
      }

      // Ensure meal plan items are properly typed
      const typedItems: MealPlanItem[] = (itemsData || []).map(item => ({
        id: item.id,
        meal_plan_id: item.meal_plan_id,
        recipe_id: item.recipe_id,
        date: item.date,
        meal_type: validateMealType(item.meal_type),
        nutritional_context: item.nutritional_context,
        custom_title: item.custom_title,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat
      }));
      
      setMealPlanItems(typedItems);

      // Get all recipe IDs from the meal plan items
      const recipeIds = typedItems
        .filter(item => item.recipe_id)
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

  // Load data when component mounts
  useEffect(() => {
    fetchLatestMealPlan();
  }, [user?.id]);

  return {
    isLoading,
    mealPlan,
    mealPlanItems,
    recipes,
    selectedDate,
    setSelectedDate,
    daysOfWeek,
    fetchLatestMealPlan,
    runsForMealPlan: getRunsForMealPlan(),
  };
};
