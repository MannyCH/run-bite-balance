
// Main function for generating meal plan items
import { UserProfile, MealPlanItem } from '@/types/profile';
import { Recipe } from '@/context/types';
import { 
  filterRecipesByPreferences, 
  prioritizeRecipes, 
  getRandomRecipe, 
  getContextForMeal 
} from '../recipe';
import { calculateDailyRequirements, getGenericRequirements } from '../requirements';
import { generateGenericMealPlanItems } from './generateGenericMealPlanItems';
import { generatePersonalizedMealPlanItems } from './generatePersonalizedMealPlanItems';

// Main function to generate meal plan items
export function generateMealPlanItems(
  mealPlanId: string,
  profile: UserProfile,
  recipes: Recipe[],
  startDate: string,
  endDate: string
): Partial<MealPlanItem>[] {
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
    return generateGenericMealPlanItems(mealPlanId, prioritizedRecipes, start, dayCount);
  }

  return generatePersonalizedMealPlanItems(mealPlanId, profile, prioritizedRecipes, start, dayCount, requirements);
}
