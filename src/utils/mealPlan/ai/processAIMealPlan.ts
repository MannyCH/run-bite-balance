
import { supabase } from '@/integrations/supabase/client';
import { MealPlanItem } from '@/types/profile';
import { Recipe } from '@/context/types';
import { validateMealType } from '../validators';
import { AIResponse, ExtendedRecipe } from './types';
import { processAIRecipes } from './aiRecipeProcessor';
import { processMealPlanItems } from './mealPlanItemProcessor';

/**
 * Process an AI-generated meal plan into MealPlanItem objects
 * and optionally save new AI-generated recipes to the database
 */
export async function processAIMealPlan(
  userId: string,
  aiResponse: AIResponse,
  startDate: string,
  endDate: string,
  recipesMap: Record<string, Recipe | ExtendedRecipe>
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
    
    // Process AI-generated recipes if any
    const savedAIRecipes = await processAIRecipes(aiResponse.aiGeneratedRecipes);
    
    // Add newly saved recipes to the provided recipesMap
    Object.entries(savedAIRecipes).forEach(([id, recipe]) => {
      recipesMap[id] = recipe;
    });

    // Process meal plan items
    const mealPlanItems = processMealPlanItems(
      mealPlanId, 
      aiResponse.mealPlan, 
      recipesMap, 
      savedAIRecipes
    );
    
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
      is_ai_generated: item.is_ai_generated || false,
      main_ingredient: item.main_ingredient // Handle the main_ingredient field from the database
    }));
  } catch (error) {
    console.error('Error processing AI meal plan:', error);
    return null;
  }
}
