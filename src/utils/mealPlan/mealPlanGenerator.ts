
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
import { validateStatus } from './validators';

// Function to generate a meal plan based on user profile and available recipes
export async function generateMealPlan({
  userId,
  profile,
  recipes,
  startDate,
  endDate,
  runs = []
}: GenerateMealPlanParams): Promise<MealPlanResult | null> {
  try {
    // Check if we have the necessary data
    if (!userId || !profile || recipes.length === 0) {
      console.error('Missing required data for meal plan generation');
      return null;
    }

    console.log(`Generating meal plan with ${runs.length} runs for date range ${startDate} to ${endDate}`);
    console.log('Runs data:', runs.map(r => ({
      title: r.title,
      date: r.date,
      distance: r.distance,
      isPlanned: r.isPlanned,
      isImported: r.isImported || false
    })));

    // Try to use the AI meal planner first (if available)
    try {
      const recipesMap: Record<string, Recipe> = {};
      recipes.forEach(recipe => {
        recipesMap[recipe.id] = recipe;
      });
      
      console.log(`Sending ${runs.length} runs to AI meal planner for date range ${startDate} to ${endDate}`);
      
      // Call the Supabase Edge Function with actual run data
      const { data, error } = await supabase.functions.invoke('generate-meal-plan', {
        body: { userId, startDate, endDate, runs }
      });
      
      if (error) {
        console.error('AI meal planner failed:', error);
        console.log('Falling back to algorithmic meal planning due to AI error');
        // Fall back to algorithm-based meal planning
      } else if (data && data.mealPlan) {
        console.log('✅ AI meal plan generated successfully');
        // Process the AI-generated meal plan with runs data
        const mealPlanItems = await processAIMealPlan(
          userId, 
          data, 
          startDate, 
          endDate,
          recipesMap,
          runs // Pass runs to the processor
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
            const planData = mealPlans[0];
            // Make sure we validate the status to match our expected type
            const mealPlan: MealPlan = {
              id: planData.id,
              user_id: planData.user_id,
              week_start_date: planData.week_start_date,
              week_end_date: planData.week_end_date,
              created_at: planData.created_at,
              status: validateStatus(planData.status)
            };
            
            return {
              mealPlan,
              mealPlanItems
            };
          }
        }
      } else {
        console.log('AI meal planner returned no data, falling back to algorithmic approach');
      }
    } catch (aiError) {
      console.error('⚠️ AI meal planning failed, using algorithmic fallback:', aiError);
      // Continue with algorithm-based approach
    }

    // Fall back to algorithmic meal planning if AI approach fails
    console.log('🔄 Using algorithmic meal planning approach');
    
    // First, create or update a meal plan record
    const mealPlan = await createOrUpdateMealPlan(userId, startDate, endDate);
    if (!mealPlan) {
      console.error('Failed to create meal plan record');
      return null;
    }

    // Delete any existing meal plan items for this plan
    const deleteSuccess = await deleteExistingMealPlanItems(mealPlan.id);
    if (!deleteSuccess) {
      console.error('Failed to delete existing meal plan items');
      return null;
    }

    // Generate the meal plan items using the improved algorithmic approach with runs
    console.log('🍽️ Generating meal plan items algorithmically with runs...');
    const mealPlanItems = generateMealPlanItems(mealPlan.id, profile, recipes, startDate, endDate, runs);

    console.log(`Generated ${mealPlanItems.length} meal plan items:`);
    mealPlanItems.forEach(item => {
      console.log(`- ${item.meal_type}: ${item.custom_title || 'Recipe meal'} (${item.calories} cal)`);
    });

    // Insert the meal plan items
    const savedItems = await insertMealPlanItems(mealPlanItems);
    if (!savedItems) {
      console.error('Failed to save meal plan items');
      return null;
    }

    console.log('✅ Algorithmic meal plan created successfully');
    return {
      mealPlan,
      mealPlanItems: savedItems
    };
  } catch (error) {
    console.error('❌ Error in generateMealPlan:', error);
    return null;
  }
}

// Add a new simplified function that returns a meal plan based on user's profile data
export async function generateMealPlanForUser(
  userId: string,
  runs: any[] = []
): Promise<MealPlanResult | null> {
  try {
    // Get the user's profile
    const profile = await fetchUserProfile(userId);
    if (!profile) {
      console.error('No user profile found');
      return null;
    }

    // Get all available recipes
    const recipes = await fetchRecipes();
    if (!recipes || recipes.length === 0) {
      console.error('No recipes found for meal planning');
      return null;
    }

    // Calculate dates for the meal plan (1 week from today)
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 6); // 7 days total including today
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log(`🎯 Generating meal plan for user ${userId} with ${runs.length} runs`);
    console.log(`📅 Date range: ${startDate} to ${endDateStr}`);
    
    // Log runs data for debugging
    runs.forEach(run => {
      console.log(`📍 Run: ${run.title} on ${run.date}, planned: ${run.isPlanned}, imported: ${run.isImported || false}`);
    });

    // Generate the meal plan using the existing function with runs
    return generateMealPlan({
      userId,
      profile: profile as UserProfile,
      recipes,
      startDate,
      endDate: endDateStr,
      runs
    });
  } catch (error) {
    console.error('❌ Error generating meal plan for user:', error);
    return null;
  }
}
