
// Core meal plan generation logic
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, MealPlan, MealPlanItem } from '@/types/profile';
import { Recipe } from '@/context/types';
import { validateMealType, validateStatus, validateMealPlanItems } from './validators';
import { calculateDailyRequirements, getGenericRequirements } from './requirements';
import { filterRecipesByPreferences, prioritizeRecipes, getRandomRecipe, getContextForMeal } from './recipeUtils';
import { GenerateMealPlanParams, MealPlanResult } from './types';

// Helper function to generate meal plan items
export function generateMealPlanItems(
  mealPlanId: string,
  profile: UserProfile,
  recipes: Recipe[],
  startDate: string,
  endDate: string
): Partial<MealPlanItem>[] {
  const mealPlanItems: Partial<MealPlanItem>[] = [];
  
  // Calculate how many days we need to plan for
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

  // Filter and prioritize recipes based on user preferences
  let filteredRecipes = filterRecipesByPreferences(recipes, profile);
  let prioritizedRecipes = prioritizeRecipes(filteredRecipes, profile);

  // Get nutritional requirements
  const requirements = calculateDailyRequirements(profile);
  
  if (!requirements) {
    // Use generic values if we can't calculate from profile
    const genericRequirements = getGenericRequirements();
    
    // Generate generic meal plan
    for (let day = 0; day < dayCount; day++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + day);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      const usedRecipeIds: string[] = [];
      
      // Add breakfast
      const breakfast = getRandomRecipe(prioritizedRecipes, genericRequirements.meals.breakfast.calories, genericRequirements.meals.breakfast.protein);
      if (breakfast) {
        usedRecipeIds.push(breakfast.id);
        mealPlanItems.push({
          id: crypto.randomUUID(), // Generate a temporary id
          meal_plan_id: mealPlanId,
          recipe_id: breakfast.id,
          date: dateStr,
          meal_type: "breakfast",
          nutritional_context: "A balanced breakfast to start your day",
          calories: breakfast.calories,
          protein: breakfast.protein,
          carbs: breakfast.carbs,
          fat: breakfast.fat
        });
      }
      
      // Add lunch
      const lunch = getRandomRecipe(prioritizedRecipes, genericRequirements.meals.lunch.calories, genericRequirements.meals.lunch.protein, usedRecipeIds);
      if (lunch) {
        usedRecipeIds.push(lunch.id);
        mealPlanItems.push({
          id: crypto.randomUUID(), // Generate a temporary id
          meal_plan_id: mealPlanId,
          recipe_id: lunch.id,
          date: dateStr,
          meal_type: "lunch",
          nutritional_context: "A satisfying lunch with good protein content",
          calories: lunch.calories,
          protein: lunch.protein,
          carbs: lunch.carbs,
          fat: lunch.fat
        });
      }
      
      // Add dinner
      const dinner = getRandomRecipe(prioritizedRecipes, genericRequirements.meals.dinner.calories, genericRequirements.meals.dinner.protein, usedRecipeIds);
      if (dinner) {
        usedRecipeIds.push(dinner.id);
        mealPlanItems.push({
          id: crypto.randomUUID(), // Generate a temporary id
          meal_plan_id: mealPlanId,
          recipe_id: dinner.id,
          date: dateStr,
          meal_type: "dinner",
          nutritional_context: "A nutritious dinner to end your day",
          calories: dinner.calories,
          protein: dinner.protein,
          carbs: dinner.carbs,
          fat: dinner.fat
        });
      }
      
      // Add snack
      const snack = getRandomRecipe(prioritizedRecipes, genericRequirements.meals.snack.calories, genericRequirements.meals.snack.protein, usedRecipeIds);
      if (snack && Math.random() > 0.3) { // 70% chance of having a snack
        mealPlanItems.push({
          id: crypto.randomUUID(), // Generate a temporary id
          meal_plan_id: mealPlanId,
          recipe_id: snack.id,
          date: dateStr,
          meal_type: "snack",
          nutritional_context: "A light snack to keep you going",
          calories: snack.calories,
          protein: snack.protein,
          carbs: snack.carbs,
          fat: snack.fat
        });
      }
    }
    
    return mealPlanItems;
  }

  // Generate personalized meal plan based on calculated requirements
  for (let day = 0; day < dayCount; day++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + day);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const usedRecipeIds: string[] = [];
    
    // Add breakfast
    const breakfast = getRandomRecipe(prioritizedRecipes, requirements.meals.breakfast.calories, requirements.meals.breakfast.protein);
    if (breakfast) {
      usedRecipeIds.push(breakfast.id);
      mealPlanItems.push({
        id: crypto.randomUUID(), // Add required id field
        meal_plan_id: mealPlanId,
        recipe_id: breakfast.id,
        date: dateStr,
        meal_type: "breakfast",
        nutritional_context: getContextForMeal('breakfast', breakfast, profile),
        calories: breakfast.calories,
        protein: breakfast.protein,
        carbs: breakfast.carbs,
        fat: breakfast.fat
      });
    }
    
    // Add lunch
    const lunch = getRandomRecipe(prioritizedRecipes, requirements.meals.lunch.calories, requirements.meals.lunch.protein, usedRecipeIds);
    if (lunch) {
      usedRecipeIds.push(lunch.id);
      mealPlanItems.push({
        id: crypto.randomUUID(), // Add required id field
        meal_plan_id: mealPlanId,
        recipe_id: lunch.id,
        date: dateStr,
        meal_type: "lunch",
        nutritional_context: getContextForMeal('lunch', lunch, profile),
        calories: lunch.calories,
        protein: lunch.protein,
        carbs: lunch.carbs,
        fat: lunch.fat
      });
    }
    
    // Add dinner
    const dinner = getRandomRecipe(prioritizedRecipes, requirements.meals.dinner.calories, requirements.meals.dinner.protein, usedRecipeIds);
    if (dinner) {
      usedRecipeIds.push(dinner.id);
      mealPlanItems.push({
        id: crypto.randomUUID(), // Add required id field
        meal_plan_id: mealPlanId,
        recipe_id: dinner.id,
        date: dateStr,
        meal_type: "dinner",
        nutritional_context: getContextForMeal('dinner', dinner, profile),
        calories: dinner.calories,
        protein: dinner.protein,
        carbs: dinner.carbs,
        fat: dinner.fat
      });
    }
    
    // Add snack (only some days)
    if (Math.random() > 0.3) { // 70% chance of having a snack
      const snack = getRandomRecipe(prioritizedRecipes, requirements.meals.snack.calories, requirements.meals.snack.protein, usedRecipeIds);
      if (snack) {
        mealPlanItems.push({
          id: crypto.randomUUID(), // Add required id field
          meal_plan_id: mealPlanId,
          recipe_id: snack.id,
          date: dateStr,
          meal_type: "snack",
          nutritional_context: getContextForMeal('snack', snack, profile),
          calories: snack.calories,
          protein: snack.protein,
          carbs: snack.carbs,
          fat: snack.fat
        });
      }
    }
  }
  
  return mealPlanItems;
}

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

    // First, create or update a meal plan record
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

    // Delete any existing meal plan items for this plan
    const { error: deleteError } = await supabase
      .from('meal_plan_items')
      .delete()
      .eq('meal_plan_id', mealPlan.id);

    if (deleteError) {
      console.error('Error deleting existing meal plan items:', deleteError);
      return null;
    }

    // Generate the meal plan items
    const mealPlanItems = generateMealPlanItems(mealPlan.id, profile, recipes, startDate, endDate);

    // Insert the meal plan items - make sure each item has required fields
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
    const typedMealPlan: MealPlan = {
      id: mealPlan.id,
      user_id: mealPlan.user_id,
      week_start_date: mealPlan.week_start_date,
      week_end_date: mealPlan.week_end_date,
      created_at: mealPlan.created_at,
      status: validateStatus(mealPlan.status),
    };

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

    return {
      mealPlan: typedMealPlan,
      mealPlanItems: typedMealPlanItems
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
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError);
      return null;
    }

    // Get all available recipes
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('*');

    if (recipesError) {
      console.error('Error fetching recipes:', recipesError);
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
      recipes: recipes || [],
      startDate,
      endDate: endDateStr
    });
  } catch (error) {
    console.error('Error generating meal plan:', error);
    return null;
  }
}
