
// Let's update this file to handle the is_ai_generated flag
import { supabase } from '@/integrations/supabase/client';
import { MealPlanItem } from '@/types/profile';
import { Recipe } from '@/context/types';
import { validateMealType } from './validators';

/**
 * Process an AI-generated meal plan into MealPlanItem objects
 */
export async function processAIMealPlan(
  userId: string,
  aiResponse: any,
  startDate: string,
  endDate: string,
  recipesMap: Record<string, Recipe>
): Promise<MealPlanItem[] | null> {
  try {
    // First, get or create the meal plan record
    const { data: mealPlans, error: mealPlanError } = await supabase
      .from('meal_plans')
      .upsert({
        user_id: userId,
        week_start_date: startDate,
        week_end_date: endDate,
        status: 'active',
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id, week_start_date',
        ignoreDuplicates: false
      })
      .select();

    if (mealPlanError || !mealPlans || mealPlans.length === 0) {
      console.error('Error creating or retrieving meal plan:', mealPlanError);
      return null;
    }

    const mealPlanId = mealPlans[0].id;
    
    // Delete any existing meal plan items for this meal plan
    const { error: deleteError } = await supabase
      .from('meal_plan_items')
      .delete()
      .eq('meal_plan_id', mealPlanId);

    if (deleteError) {
      console.error('Error deleting existing meal plan items:', deleteError);
      return null;
    }

    // Extract and validate the meal plan items from the AI response
    // Use a properly typed array with required fields
    const mealPlanItems: {
      meal_plan_id: string;
      date: string;
      meal_type: string;
      recipe_id?: string | null;
      custom_title?: string | null;
      calories?: number | null;
      protein?: number | null;
      carbs?: number | null;
      fat?: number | null;
      nutritional_context?: string | null;
      is_ai_generated?: boolean | null;
    }[] = [];
    
    // Check if we have a valid mealPlan object with days
    if (aiResponse && aiResponse.mealPlan && aiResponse.mealPlan.days) {
      for (const day of aiResponse.mealPlan.days) {
        if (day.date && Array.isArray(day.meals)) {
          for (const meal of day.meals) {
            // Skip invalid meal items
            if (!meal.meal_type || !meal.recipe_id) continue;
            
            // Ensure meal_type is valid
            const validMealType = validateMealType(meal.meal_type);
            if (!validMealType) continue;
            
            // Get recipe details from the map
            const recipe = recipesMap[meal.recipe_id];
            if (!recipe) continue;

            // Create a meal plan item with all required fields explicitly defined
            mealPlanItems.push({
              meal_plan_id: mealPlanId,
              date: day.date,
              meal_type: validMealType,
              recipe_id: meal.recipe_id,
              custom_title: recipe.title,
              calories: recipe.calories,
              protein: recipe.protein,
              carbs: recipe.carbs,
              fat: recipe.fat,
              nutritional_context: meal.explanation || null,
              is_ai_generated: meal.is_ai_generated || false
            });
          }
        }
      }
    }

    if (mealPlanItems.length === 0) {
      console.error('No valid meal plan items found in AI response');
      return null;
    }

    // Insert the meal plan items into the database
    const { data: insertedItems, error: insertError } = await supabase
      .from('meal_plan_items')
      .insert(mealPlanItems)
      .select();

    if (insertError || !insertedItems) {
      console.error('Error inserting meal plan items:', insertError);
      return null;
    }

    // Convert the inserted items to the expected type
    return insertedItems.map(item => ({
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
      is_ai_generated: item.is_ai_generated || false
    }));
  } catch (error) {
    console.error('Error processing AI meal plan:', error);
    return null;
  }
}
