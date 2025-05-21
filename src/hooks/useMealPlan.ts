
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { MealPlan, MealPlanItem } from "@/types/profile";
import { format, addDays, parseISO } from "date-fns";
import { validateMealType, validateStatus } from "@/utils/mealPlan";

export const useMealPlan = () => {
  const { user } = useAuth();
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

  // Fetch the latest meal plan
  const fetchLatestMealPlan = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      // Get the latest meal plan
      const { data: planData, error: planError } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (planError) {
        console.error("Error fetching meal plan:", planError);
        return;
      }

      if (!planData || planData.length === 0) {
        setIsLoading(false);
        return;
      }

      const plan = planData[0];

      const typedPlan: MealPlan = {
        id: plan.id,
        user_id: plan.user_id,
        week_start_date: plan.week_start_date,
        week_end_date: plan.week_end_date,
        created_at: plan.created_at,
        status: validateStatus(plan.status),
      };

      setMealPlan(typedPlan);

      // Get the meal plan items
      const { data: itemsData, error: itemsError } = await supabase
        .from("meal_plan_items")
        .select("*")
        .eq("meal_plan_id", plan.id);

      if (itemsError) {
        console.error("Error fetching meal plan items:", itemsError);
        return;
      }

      // Properly type items and include main_ingredient
      const typedItems: MealPlanItem[] = (itemsData || []).map((item): MealPlanItem => ({
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
        fat: item.fat,
        is_ai_generated: item.is_ai_generated || false,
        main_ingredient: item.main_ingredient || null,
      }));

      setMealPlanItems(typedItems);

      // Get all recipe IDs from the meal plan items
      const recipeIds = typedItems
        .filter((item) => item.recipe_id)
        .map((item) => item.recipe_id as string);

      if (recipeIds.length > 0) {
        const { data: recipesData, error: recipesError } = await supabase
          .from("recipes")
          .select("*")
          .in("id", recipeIds);

        if (recipesError) {
          console.error("Error fetching recipes:", recipesError);
          return;
        }

        const recipesMap = (recipesData || []).reduce((acc, recipe) => {
          if (recipe.id) {
            acc[recipe.id] = recipe;
          }
          return acc;
        }, {} as Record<string, any>);

        setRecipes(recipesMap);
      }
    } catch (error) {
      console.error("Error in fetchLatestMealPlan:", error);
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
  };
};
