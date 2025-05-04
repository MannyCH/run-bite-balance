
// Core meal plan generation logic
import { UserProfile, MealPlan, MealPlanItem } from '@/types/profile';
import { Recipe } from '@/context/types';
import { generateMealPlanItems } from './mealPlanItems';
import { 
  createOrUpdateMealPlan, 
  deleteExistingMealPlanItems, 
  insertMealPlanItems,
  fetchUserProfile,
  fetchRecipes
} from './mealPlanDb';
import { GenerateMealPlanParams, MealPlanResult } from './types';

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
