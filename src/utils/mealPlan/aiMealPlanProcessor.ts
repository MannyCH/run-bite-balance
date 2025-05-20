
// Let's update this file to handle the is_ai_generated flag
import { supabase } from '@/integrations/supabase/client';
import { MealPlanItem } from '@/types/profile';
import { Recipe } from '@/context/types';
import { validateMealType } from './validators';

/**
 * Process an AI-generated meal plan into MealPlanItem objects
 * and optionally save new AI-generated recipes to the database
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

    // Check if we have new AI-generated recipes to save
    const newAIRecipesToSave: any[] = [];
    
    if (aiResponse && aiResponse.aiGeneratedRecipes && Array.isArray(aiResponse.aiGeneratedRecipes)) {
      console.log(`Processing ${aiResponse.aiGeneratedRecipes.length} new AI-generated recipes`);
      
      // Extract AI-generated recipes for saving to database
      aiResponse.aiGeneratedRecipes.forEach((recipe: any) => {
        if (recipe && recipe.title) {
          newAIRecipesToSave.push({
            title: recipe.title,
            calories: recipe.calories || 0,
            protein: recipe.protein || 0,
            carbs: recipe.carbs || 0,
            fat: recipe.fat || 0,
            ingredients: recipe.ingredients || [],
            instructions: recipe.instructions || [],
            categories: recipe.meal_type ? [recipe.meal_type] : [],
            is_ai_generated: true // Mark as AI-generated
          });
        }
      });
    }
    
    // Save new AI-generated recipes to the database if any
    let savedAIRecipes: Record<string, Recipe> = {};
    
    if (newAIRecipesToSave.length > 0) {
      console.log(`Saving ${newAIRecipesToSave.length} new AI-generated recipes to the database`);
      
      const { data: insertedRecipes, error: recipeError } = await supabase
        .from('recipes')
        .insert(newAIRecipesToSave)
        .select();
      
      if (recipeError) {
        console.error('Error saving AI-generated recipes:', recipeError);
        // Continue with the meal plan without saving the new recipes
      } else if (insertedRecipes) {
        console.log(`Successfully saved ${insertedRecipes.length} AI-generated recipes`);
        
        // Add newly saved recipes to the recipesMap
        insertedRecipes.forEach(recipe => {
          const recipeObj: Recipe = {
            id: recipe.id,
            title: recipe.title,
            calories: recipe.calories,
            protein: recipe.protein,
            carbs: recipe.carbs,
            fat: recipe.fat,
            ingredients: recipe.ingredients,
            instructions: recipe.instructions,
            categories: recipe.categories
          };
          
          recipesMap[recipe.id] = recipeObj;
          savedAIRecipes[recipe.id] = recipeObj;
        });
      }
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
    
    // Helper function to find real recipe ID for AI-generated recipes
    const findRealRecipeId = (tempId: string): string | null => {
      // If it's a regular recipe ID, return it
      if (!tempId.startsWith('ai-')) {
        return tempId;
      }
      
      // It's a temporary AI recipe ID from the meal plan
      // Find the corresponding real recipe ID from the saved recipes
      const aiIndex = parseInt(tempId.replace('ai-', ''), 10);
      
      if (aiResponse && aiResponse.aiGeneratedRecipes && 
          aiResponse.aiGeneratedRecipes[aiIndex]) {
        
        // Get the title of the AI recipe
        const aiRecipeTitle = aiResponse.aiGeneratedRecipes[aiIndex].title;
        
        // Find the saved recipe with the same title
        const savedRecipeId = Object.keys(savedAIRecipes).find(id => 
          savedAIRecipes[id].title === aiRecipeTitle
        );
        
        if (savedRecipeId) {
          return savedRecipeId;
        }
      }
      
      return null;
    };
    
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
            
            // Get the real recipe ID (handle AI-generated recipe IDs)
            const realRecipeId = findRealRecipeId(meal.recipe_id);
            if (!realRecipeId) continue;
            
            // Get recipe details from the map
            const recipe = recipesMap[realRecipeId];
            if (!recipe) continue;

            // Create a meal plan item with all required fields explicitly defined
            mealPlanItems.push({
              meal_plan_id: mealPlanId,
              date: day.date,
              meal_type: validMealType,
              recipe_id: realRecipeId,
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
