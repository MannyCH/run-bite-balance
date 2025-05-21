
import { supabase } from "@/integrations/supabase/client";
import { MealPlanItem } from "@/types/profile";
import { extractMainIngredient } from "./ingredientUtils";
import { processAIRecipes } from "./aiRecipeProcessor";
import { findRealRecipeId } from "./recipeUtils";
import { IngredientTracking } from "./types";

/**
 * Process AI meal plan data and convert it to proper MealPlanItem objects
 */
export async function processAIMealPlan(
  userId: string, 
  data: any, 
  startDate: string, 
  endDate: string,
  recipesMap: Record<string, any>
): Promise<MealPlanItem[] | null> {
  try {
    console.log('Processing AI meal plan data');
    
    // Process and save any AI-generated recipes first
    const savedAIRecipes = await processAIRecipes(data.aiGeneratedRecipes);
    
    // Merge the saved AI recipes with the existing recipes map
    const allRecipesMap = { ...recipesMap, ...savedAIRecipes };
    
    // Create or update the meal plan in the database
    const { data: mealPlanData, error: mealPlanError } = await supabase
      .from('meal_plans')
      .insert([
        {
          user_id: userId,
          week_start_date: startDate,
          week_end_date: endDate,
          status: 'active'
        }
      ])
      .select()
      .single();
      
    if (mealPlanError) {
      console.error('Error creating meal plan:', mealPlanError);
      return null;
    }
    
    const mealPlanId = mealPlanData.id;
    console.log(`Created meal plan with ID: ${mealPlanId}`);
    
    // Track used recipe IDs to avoid duplication
    const globalUsedRecipeIds = new Set<string>();
    const globalUsedContentHashes = new Set<string>();
    
    // Track ingredient usage for variety
    const ingredientTracking: IngredientTracking = {
      byDay: {},
      allWeek: new Set<string>()
    };
    
    // Convert AI meal plan data to MealPlanItems
    const mealPlanItems: MealPlanItem[] = [];
    
    if (data?.mealPlan?.days) {
      for (const day of data.mealPlan.days) {
        const date = day.date;
        
        for (const meal of day.meals) {
          const tempRecipeId = meal.recipe_id;
          const mealType = meal.meal_type;
          
          // Find a real recipe ID for temporary AI recipe IDs
          const realRecipeId = findRealRecipeId(
            tempRecipeId,
            mealType,
            date,
            allRecipesMap,
            savedAIRecipes,
            globalUsedRecipeIds,
            globalUsedContentHashes,
            ingredientTracking
          );
          
          if (!realRecipeId) {
            console.log(`No suitable recipe found for ${mealType} on ${date}, skipping`);
            continue;
          }
          
          // Get the recipe object
          const recipe = allRecipesMap[realRecipeId];
          
          // Create the meal plan item
          const mealPlanItem: Partial<MealPlanItem> = {
            meal_plan_id: mealPlanId,
            recipe_id: realRecipeId,
            date: date,
            meal_type: mealType as any,
            nutritional_context: meal.explanation || null,
            is_ai_generated: !!recipe?.is_ai_generated,
            main_ingredient: recipe?.main_ingredient || extractMainIngredient(recipe) || null
          };
          
          // Add nutritional information if available
          if (recipe) {
            mealPlanItem.calories = recipe.calories || 0;
            mealPlanItem.protein = recipe.protein || 0;
            mealPlanItem.carbs = recipe.carbs || 0;
            mealPlanItem.fat = recipe.fat || 0;
          }
          
          mealPlanItems.push(mealPlanItem as MealPlanItem);
        }
      }
    }
    
    // Insert all meal plan items into the database
    if (mealPlanItems.length > 0) {
      const { data: insertedItems, error: insertError } = await supabase
        .from('meal_plan_items')
        .insert(mealPlanItems)
        .select();
        
      if (insertError) {
        console.error('Error inserting meal plan items:', insertError);
        return null;
      }
      
      console.log(`Successfully inserted ${insertedItems.length} meal plan items`);
      
      // Return the inserted items
      return insertedItems as MealPlanItem[];
    } else {
      console.log('No meal plan items to insert');
      return null;
    }
  } catch (error) {
    console.error('Error in processAIMealPlan:', error);
    return null;
  }
}

/**
 * Process a single meal plan item from the AI response
 */
export function processAIMealPlanItem(item: any, recipe: any) {
  // When creating or updating meal plan items, make sure to properly handle main_ingredient
  const processedItem = {
    id: item.id,
    meal_plan_id: item.meal_plan_id,
    recipe_id: item.recipe_id,
    date: item.date,
    meal_type: item.meal_type,
    nutritional_context: item.nutritional_context,
    custom_title: item.custom_title,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    is_ai_generated: item.is_ai_generated,
    // Add the main_ingredient property if available from the recipe
    main_ingredient: recipe?.main_ingredient || extractMainIngredient(recipe) || null
  };

  return processedItem;
}
