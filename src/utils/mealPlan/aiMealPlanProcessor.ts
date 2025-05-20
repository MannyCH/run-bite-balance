
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
      // Add a timestamp and random number to each recipe to ensure uniqueness
      aiResponse.aiGeneratedRecipes.forEach((recipe: any, index: number) => {
        if (recipe && recipe.title) {
          // Create a really unique ID for each recipe using timestamp + random number + index
          const timestamp = new Date().getTime();
          const randomSuffix = Math.floor(Math.random() * 10000);
          const uniqueTitle = `${recipe.title} (AI ${timestamp}-${randomSuffix}-${index})`;
          
          newAIRecipesToSave.push({
            title: uniqueTitle, // Make the title unique
            calories: recipe.calories || 0,
            protein: recipe.protein || 0,
            carbs: recipe.carbs || 0,
            fat: recipe.fat || 0,
            ingredients: recipe.ingredients || [],
            instructions: recipe.instructions || [],
            categories: recipe.meal_type ? [recipe.meal_type] : [],
            is_ai_generated: true, // Mark as AI-generated
            created_at: new Date(timestamp + (index * 1000) + randomSuffix).toISOString() // Give each recipe a different timestamp
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
            categories: recipe.categories,
            is_ai_generated: true
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
    
    // Create a global Set to track all used recipe IDs throughout the entire meal plan
    // This ensures we don't reuse any recipe across the whole week
    const globalUsedRecipeIds = new Set<string>();
    
    // Helper function to get all available AI recipes for a meal type
    const getAvailableAIRecipes = (mealType: string) => {
      return Object.entries(savedAIRecipes)
        .filter(([id, recipe]) => {
          // Skip already used recipes
          if (globalUsedRecipeIds.has(id)) return false;
          
          // Check if recipe has categories that match the meal type
          if (recipe.categories && recipe.categories.length > 0) {
            return recipe.categories.some(category => 
              category.toLowerCase().includes(mealType.toLowerCase())
            );
          }
          
          // If no categories or no match, it's still available for use
          return true;
        })
        .map(([id]) => id);
    };
    
    // Helper function to find real recipe ID for AI-generated recipes
    // with enhanced uniqueness checks
    const findRealRecipeId = (tempId: string, mealType: string): string | null => {
      // If it's a regular recipe ID, return it (if not already used)
      if (!tempId.startsWith('ai-')) {
        // For non-AI recipes, don't enforce uniqueness to maintain backward compatibility
        return tempId;
      }
      
      // It's a temporary AI recipe ID from the meal plan
      // Find a corresponding real recipe ID from the saved recipes that hasn't been used yet
      const availableAIRecipeIds = getAvailableAIRecipes(mealType);
      
      if (availableAIRecipeIds.length > 0) {
        // Get a random recipe from the available ones
        const randomIndex = Math.floor(Math.random() * availableAIRecipeIds.length);
        const chosenRecipeId = availableAIRecipeIds[randomIndex];
        
        // Mark this recipe as used so we don't use it again anywhere in the meal plan
        globalUsedRecipeIds.add(chosenRecipeId);
        
        console.log(`Assigned AI recipe ${chosenRecipeId} for meal type ${mealType}`);
        return chosenRecipeId;
      }
      
      console.log(`No available AI recipes for meal type ${mealType}, using non-AI recipe instead`);
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
            // Pass the meal type to help find appropriate recipes
            const realRecipeId = findRealRecipeId(meal.recipe_id, validMealType);
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
              is_ai_generated: recipe.is_ai_generated || false
            });
          }
        }
      }
    }

    // Log information about recipe uniqueness for debugging
    console.log(`Generated ${mealPlanItems.length} meal plan items with ${globalUsedRecipeIds.size} unique AI recipes`);
    
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
