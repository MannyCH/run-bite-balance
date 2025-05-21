
// Utility for processing AI-generated meal plans
import { UserProfile, MealPlan, MealPlanItem } from '@/types/profile';
import { Recipe } from '@/context/types';
import { 
  createOrUpdateMealPlan, 
  deleteExistingMealPlanItems, 
  insertMealPlanItems
} from './mealPlanDb';
import { validateMealType } from './validators';

interface AIMealPlanDay {
  date: string;
  meals: {
    meal_type: string;
    recipe_id: string;
    explanation: string;
  }[];
}

interface AIMealPlanResponse {
  message: string;
  mealPlan: {
    days: AIMealPlanDay[];
  };
}

/**
 * Processes the AI-generated meal plan response and saves it to the database
 */
export async function processAIMealPlan(
  userId: string,
  aiResponse: AIMealPlanResponse,
  startDate: string,
  endDate: string,
  recipes: Record<string, Recipe>
): Promise<MealPlanItem[] | null> {
  try {
    // Create a new meal plan record
    const mealPlan = await createOrUpdateMealPlan(userId, startDate, endDate);
    if (!mealPlan) {
      console.error('Failed to create meal plan record');
      return null;
    }
    
    // Delete any existing meal plan items
    const deleteSuccess = await deleteExistingMealPlanItems(mealPlan.id);
    if (!deleteSuccess) {
      console.error('Failed to delete existing meal plan items');
      return null;
    }
    
    // Convert AI meal plan to database format
    const mealPlanItems: Partial<MealPlanItem>[] = [];
    
    if (!aiResponse.mealPlan || !Array.isArray(aiResponse.mealPlan.days)) {
      console.error('Invalid AI meal plan structure', aiResponse);
      return null;
    }
    
    aiResponse.mealPlan.days.forEach(day => {
      if (!day.date || !Array.isArray(day.meals)) return;
      
      day.meals.forEach(meal => {
        // Verify the recipe exists
        const recipe = recipes[meal.recipe_id];
        if (!recipe) {
          console.warn(`Recipe not found: ${meal.recipe_id}`);
          return;
        }
        
        mealPlanItems.push({
          id: crypto.randomUUID(),
          meal_plan_id: mealPlan.id,
          recipe_id: meal.recipe_id,
          date: day.date,
          meal_type: validateMealType(meal.meal_type), // Validate meal type to ensure it's one of the allowed types
          nutritional_context: meal.explanation,
          calories: recipe.calories,
          protein: recipe.protein,
          carbs: recipe.carbs,
          fat: recipe.fat
        });
      });
    });
    
    // Insert the new meal plan items
    const savedItems = await insertMealPlanItems(mealPlanItems);
    if (!savedItems) {
      console.error('Failed to save meal plan items');
      return null;
    }
    
    return savedItems;
  } catch (error) {
    console.error('Error processing AI meal plan:', error);
    return null;
  }
}
