
// Utility for processing AI-generated meal plans
import { UserProfile, MealPlan, MealPlanItem } from '@/types/profile';
import { Recipe } from '@/context/types';
import { 
  createOrUpdateMealPlan, 
  deleteExistingMealPlanItems, 
  insertMealPlanItems
} from './mealPlanDb';
import { validateMealType } from './validators';
import { isSameDay, parseISO } from 'date-fns';

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
  aiResponse: any,
  startDate: string,
  endDate: string,
  recipesMap: Record<string, Recipe>,
  runs: any[] = []
): Promise<MealPlanItem[] | null> {
  try {
    console.log('Processing AI meal plan response');
    console.log(`Runs provided for processing: ${runs.length}`);
    
    if (!aiResponse?.mealPlan?.days) {
      console.error('Invalid AI meal plan structure');
      return null;
    }

    // Create or update the meal plan record
    const mealPlan = await createOrUpdateMealPlan(userId, startDate, endDate);
    if (!mealPlan) {
      console.error('Failed to create meal plan record');
      return null;
    }

    // Delete existing meal plan items
    const deleteSuccess = await deleteExistingMealPlanItems(mealPlan.id);
    if (!deleteSuccess) {
      console.error('Failed to delete existing meal plan items');
      return null;
    }

    const mealPlanItems: Partial<MealPlanItem>[] = [];

    // Process each day from the AI response
    for (const day of aiResponse.mealPlan.days) {
      const { date, meals } = day;
      console.log(`Processing day ${date} with ${meals.length} meals`);
      
      // Check if this day has any runs
      const dayRuns = runs.filter(run => {
        const runDate = new Date(run.date);
        const dayDate = parseISO(date);
        return isSameDay(runDate, dayDate);
      });
      
      console.log(`Day ${date} has ${dayRuns.length} runs`);
      
      // Process AI-generated meals
      for (const meal of meals) {
        const { meal_type, recipe_id, explanation } = meal;
        
        // Validate meal type to include new snack types
        const validMealType = validateMealType(meal_type);
        
        // Handle simple snacks vs recipe-based meals
        let recipeData = null;
        let customTitle = null;
        
        if (recipe_id === 'simple-snack' || (validMealType === 'pre_run_snack' || validMealType === 'post_run_snack')) {
          // For snacks, use explanation as custom title and set basic nutrition
          customTitle = explanation || 'Healthy snack';
          recipeData = {
            calories: validMealType === 'pre_run_snack' ? 150 : 200, // Default calories for snacks
            protein: validMealType === 'pre_run_snack' ? 3 : 10,
            carbs: validMealType === 'pre_run_snack' ? 30 : 25,
            fat: validMealType === 'pre_run_snack' ? 2 : 8
          };
        } else if (recipesMap[recipe_id]) {
          // For main meals, use the actual recipe data
          recipeData = recipesMap[recipe_id];
        } else {
          console.warn(`Recipe not found: ${recipe_id}, skipping meal`);
          continue;
        }

        mealPlanItems.push({
          id: crypto.randomUUID(),
          meal_plan_id: mealPlan.id,
          recipe_id: (validMealType === 'pre_run_snack' || validMealType === 'post_run_snack') ? null : recipe_id,
          date,
          meal_type: validMealType,
          nutritional_context: explanation,
          custom_title: customTitle,
          calories: recipeData.calories,
          protein: recipeData.protein,
          carbs: recipeData.carbs,
          fat: recipeData.fat
        });
      }
      
      // FALLBACK: If AI didn't generate snacks but there are runs on this day, add them
      if (dayRuns.length > 0) {
        const existingSnackTypes = meals.map(m => validateMealType(m.meal_type));
        
        // Add pre-run snack if missing
        if (!existingSnackTypes.includes('pre_run_snack')) {
          console.log(`Adding fallback pre-run snack for ${date}`);
          mealPlanItems.push({
            id: crypto.randomUUID(),
            meal_plan_id: mealPlan.id,
            recipe_id: null,
            date,
            meal_type: 'pre_run_snack',
            nutritional_context: `Pre-run fuel for ${dayRuns[0].title}`,
            custom_title: 'Pre-run snack (banana + dates)',
            calories: 150,
            protein: 3,
            carbs: 30,
            fat: 2
          });
        }
        
        // Add post-run snack if missing
        if (!existingSnackTypes.includes('post_run_snack')) {
          console.log(`Adding fallback post-run snack for ${date}`);
          mealPlanItems.push({
            id: crypto.randomUUID(),
            meal_plan_id: mealPlan.id,
            recipe_id: null,
            date,
            meal_type: 'post_run_snack',
            nutritional_context: `Recovery nutrition after ${dayRuns[0].title}`,
            custom_title: 'Post-run recovery (protein shake + fruit)',
            calories: 200,
            protein: 15,
            carbs: 25,
            fat: 5
          });
        }
      }
    }

    // Insert the processed meal plan items
    const savedItems = await insertMealPlanItems(mealPlanItems);
    if (!savedItems) {
      console.error('Failed to insert meal plan items');
      return null;
    }

    console.log(`Successfully processed ${savedItems.length} meal plan items`);
    return savedItems;
  } catch (error) {
    console.error('Error processing AI meal plan:', error);
    return null;
  }
}
