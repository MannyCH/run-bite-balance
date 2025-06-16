// Database operations for meal plans
import { supabase } from '@/integrations/supabase/client';
import { MealPlan, MealPlanItem } from '@/types/profile';
import { validateStatus, validateMealType } from './validators';

// Create or update a meal plan record
export async function createOrUpdateMealPlan(
  userId: string,
  startDate: string,
  endDate: string
): Promise<MealPlan | null> {
  try {
    const { data: mealPlan, error: mealPlanError } = await supabase
      .from('meal_plans')
      .upsert({
        user_id: userId,
        week_start_date: startDate,
        week_end_date: endDate,
        status: 'active', // Explicitly set as active
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id, week_start_date',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (mealPlanError) {
      console.error('Error creating meal plan:', mealPlanError);
      return null;
    }

    // Convert the returned data to the expected type
    const typedMealPlan: MealPlan = {
      id: mealPlan.id,
      user_id: mealPlan.user_id,
      week_start_date: mealPlan.week_start_date,
      week_end_date: mealPlan.week_end_date,
      created_at: mealPlan.created_at,
      status: validateStatus(mealPlan.status),
    };

    return typedMealPlan;
  } catch (error) {
    console.error('Error in createOrUpdateMealPlan:', error);
    return null;
  }
}

// Delete existing meal plan items for a specific meal plan
export async function deleteExistingMealPlanItems(mealPlanId: string): Promise<boolean> {
  try {
    const { error: deleteError } = await supabase
      .from('meal_plan_items')
      .delete()
      .eq('meal_plan_id', mealPlanId);

    if (deleteError) {
      console.error('Error deleting existing meal plan items:', deleteError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteExistingMealPlanItems:', error);
    return false;
  }
}

// Insert meal plan items into the database
export async function insertMealPlanItems(
  mealPlanItems: Partial<MealPlanItem>[]
): Promise<MealPlanItem[] | null> {
  try {
    // Make sure each item has required fields
    const completeItems = mealPlanItems.map(item => ({
      ...item,
      date: item.date, // Ensure date is always present
      meal_plan_id: item.meal_plan_id, // Ensure meal_plan_id is always present
      meal_type: item.meal_type, // Ensure meal_type is always present
    }));

    const { data: savedItems, error: itemsError } = await supabase
      .from('meal_plan_items')
      .insert(completeItems)
      .select();

    if (itemsError) {
      console.error('Error saving meal plan items:', itemsError);
      return null;
    }

    // Convert the returned data to the expected types
    const typedMealPlanItems = (savedItems || []).map(item => ({
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

    return typedMealPlanItems;
  } catch (error) {
    console.error('Error in insertMealPlanItems:', error);
    return null;
  }
}

// Fetch a user's profile
export async function fetchUserProfile(userId: string) {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return null;
    }

    return profile;
  } catch (error) {
    console.error('Error in fetchUserProfile:', error);
    return null;
  }
}

// Fetch recipes from the database with proper meal_type handling
export async function fetchRecipes() {
  try {
    console.log('Frontend: Fetching recipes with meal_type data...');
    
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('id, title, calories, protein, carbs, fat, ingredients, categories, meal_type, seasonal_suitability, temperature_preference, dish_type, imgurl');

    if (recipesError) {
      console.error('Error fetching recipes:', recipesError);
      return null;
    }

    if (recipes && recipes.length > 0) {
      // Log sample recipe to verify meal_type format
      const sampleRecipe = recipes[0];
      console.log('Frontend: Sample recipe meal_type:', {
        id: sampleRecipe.id,
        title: sampleRecipe.title,
        meal_type: sampleRecipe.meal_type,
        meal_type_is_array: Array.isArray(sampleRecipe.meal_type)
      });
      
      // Count recipes with meal types
      const recipesWithMealType = recipes.filter(recipe => 
        recipe.meal_type && 
        (Array.isArray(recipe.meal_type) ? recipe.meal_type.length > 0 : recipe.meal_type)
      );
      
      console.log(`Frontend: ${recipes.length} total recipes, ${recipesWithMealType.length} have meal_type classifications`);
      
      // Map recipes to include imgUrl correctly
      const mappedRecipes = recipes.map(recipe => ({
        ...recipe,
        imgUrl: recipe.imgurl // Map imgurl to imgUrl for compatibility
      }));
      
      return mappedRecipes;
    }

    return [];
  } catch (error) {
    console.error('Error in fetchRecipes:', error);
    return [];
  }
}
