// Database operations for meal plans
import { supabase } from '@/integrations/supabase/client';
import { MealPlan, MealPlanItem } from '@/types/profile';
import { validateStatus, validateMealType } from './validators';
import { UserProfile } from "@/types/profile";


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
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
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

// Fetch recipes from the database
export async function fetchRecipes(): Promise<Recipe[] | null> {
  try {
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('*');

    if (recipesError) {
      console.error('Error fetching recipes:', recipesError);
      return null;
    }

    return recipes || [];
  } catch (error) {
    console.error('Error in fetchRecipes:', error);
    return [];
  }
}

// New function to clean up unsaved AI-generated recipes from previous meal plan generations
export async function cleanupUnsavedAIRecipes(userId: string): Promise<void> {
  try {
    console.log(`Cleaning up unsaved AI recipes for user ${userId}`);
    
    // Step 1: Get all AI-generated recipes
    const { data: aiRecipes, error: aiRecipesError } = await supabase
      .from('recipes')
      .select('id')
      .eq('is_ai_generated', true);
      
    if (aiRecipesError) {
      console.error('Error fetching AI recipes:', aiRecipesError);
      return;
    }
    
    if (!aiRecipes || aiRecipes.length === 0) {
      console.log('No AI recipes found to clean up');
      return;
    }
    
    console.log(`Found ${aiRecipes.length} AI-generated recipes`);
    
    // Step 2: Get all recipe IDs that are used in meal plans for this user
    // These are considered "in use" and should not be deleted
    const { data: mealPlanData, error: mealPlanError } = await supabase
      .from('meal_plans')
      .select('id')
      .eq('user_id', userId);
      
    if (mealPlanError) {
      console.error('Error fetching meal plans:', mealPlanError);
      return;
    }
    
    if (!mealPlanData || mealPlanData.length === 0) {
      console.log('No meal plans found for this user');
      // No meal plans means no recipes are in use, all AI recipes can be cleaned up
      return;
    }
    
    const mealPlanIds = mealPlanData.map(plan => plan.id);
    
    // Get all meal plan items that reference recipes
    const { data: mealPlanItems, error: itemsError } = await supabase
      .from('meal_plan_items')
      .select('recipe_id')
      .in('meal_plan_id', mealPlanIds)
      .not('recipe_id', 'is', null);
      
    if (itemsError) {
      console.error('Error fetching meal plan items:', itemsError);
      return;
    }
    
    // Create a set of recipe IDs that are in use
    const inUseRecipeIds = new Set(mealPlanItems?.map(item => item.recipe_id) || []);
    
    // Step 3: Delete AI-generated recipes that are not in use
    const recipesToDelete = aiRecipes
      .filter(recipe => !inUseRecipeIds.has(recipe.id))
      .map(recipe => recipe.id);
      
    if (recipesToDelete.length === 0) {
      console.log('No unused AI recipes to delete');
      return;
    }
    
    console.log(`Deleting ${recipesToDelete.length} unused AI recipes`);
    
    // Delete the unused AI-generated recipes
    const { error: deleteError } = await supabase
      .from('recipes')
      .delete()
      .in('id', recipesToDelete);
      
    if (deleteError) {
      console.error('Error deleting unused AI recipes:', deleteError);
      return;
    }
    
    console.log(`Successfully deleted ${recipesToDelete.length} unused AI recipes`);
    
  } catch (error) {
    console.error('Error in cleanupUnsavedAIRecipes:', error);
  }
}
