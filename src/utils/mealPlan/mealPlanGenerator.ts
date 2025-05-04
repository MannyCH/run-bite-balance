
// Core meal plan generation logic
import { UserProfile, MealPlan, MealPlanItem } from '@/types/profile';
import { Recipe } from '@/context/types';
import { generateMealPlanItems } from './mealPlanItems';
import { processAIMealPlan } from './aiMealPlanProcessor';
import { 
  createOrUpdateMealPlan, 
  deleteExistingMealPlanItems, 
  insertMealPlanItems,
  fetchUserProfile,
  fetchRecipes
} from './mealPlanDb';
import { GenerateMealPlanParams, MealPlanResult } from './types';
import { supabase } from '@/integrations/supabase/client';

// Function to generate a meal plan based on user profile and available recipes
export async function generateMealPlan({
  userId,
  profile,
  recipes,
  startDate,
  endDate
}: GenerateMealPlanParams): Promise<MealPlanResult | null> {
  try {
    // Check if we have the necessary data
    if (!userId || !profile || recipes.length === 0) {
      console.error('Missing required data for meal plan generation');
      return null;
    }

    // Try to use the AI meal planner first (if available)
    try {
      const recipesMap: Record<string, Recipe> = {};
      recipes.forEach(recipe => {
        recipesMap[recipe.id] = recipe;
      });
      
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('generate-meal-plan', {
        body: { userId, startDate, endDate }
      });
      
      if (error) {
        console.error('Error calling AI meal planner:', error);
        // Fall back to algorithm-based meal planning
      } else if (data && data.mealPlan) {
        console.log('Using AI-generated meal plan');
        // Process the AI-generated meal plan
        const mealPlanItems = await processAIMealPlan(
          userId, 
          data, 
          startDate, 
          endDate,
          recipesMap
        );
        
        if (mealPlanItems) {
          // Get the meal plan record
          const { data: mealPlans } = await supabase
            .from('meal_plans')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (mealPlans && mealPlans.length > 0) {
            return {
              mealPlan: mealPlans[0],
              mealPlanItems
            };
          }
        }
      }
    } catch (aiError) {
      console.error('Error with AI meal planning, falling back to algorithmic approach:', aiError);
      // Continue with algorithm-based approach
    }

    // Fall back to algorithmic meal planning if AI approach fails
    console.log('Using algorithm-based meal planning');
    
    // First, create or update a meal plan record
    const mealPlan = await createOrUpdateMealPlan(userId, startDate, endDate);
    if (!mealPlan) {
      return null;
    }

    // Delete any existing meal plan items for this plan
    const deleteSuccess = await deleteExistingMealPlanItems(mealPlan.id);
    if (!deleteSuccess) {
      return null;
    }

    // Generate the meal plan items
    const mealPlanItems = generateMealPlanItems(mealPlan.id, profile, recipes, startDate, endDate);

    // Insert the meal plan items
    const savedItems = await insertMealPlanItems(mealPlanItems);
    if (!savedItems) {
      return null;
    }

    return {
      mealPlan,
      mealPlanItems: savedItems
    };
  } catch (error) {
    console.error('Error in generateMealPlan:', error);
    return null;
  }
}

// Add a new simplified function that returns a meal plan based on user's profile data
export async function generateMealPlanForUser(
  userId: string
): Promise<MealPlanResult | null> {
  try {
    // Get the user's profile
    const profile = await fetchUserProfile(userId);
    if (!profile) {
      return null;
    }

    // Get all available recipes
    const recipes = await fetchRecipes();
    if (!recipes || recipes.length === 0) {
      return null;
    }

    // Calculate dates for the meal plan (1 week from today)
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 6); // 7 days total including today
    const endDateStr = endDate.toISOString().split('T')[0];

    // Generate the meal plan using the existing function
    return generateMealPlan({
      userId,
      profile: profile as UserProfile,
      recipes,
      startDate,
      endDate: endDateStr
    });
  } catch (error) {
    console.error('Error generating meal plan:', error);
    return null;
  }
}
