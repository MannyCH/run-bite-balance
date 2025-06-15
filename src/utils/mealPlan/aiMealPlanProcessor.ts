
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
        
        // Validate meal type
        const validMealType = validateMealType(meal_type);
        
        // Check if recipe exists in our recipes map
        const recipe = recipesMap[recipe_id];
        if (!recipe) {
          console.warn(`Recipe not found: ${recipe_id}, skipping meal`);
          continue;
        }

        console.log(`Adding ${validMealType}: ${recipe.title} (${recipe.calories} cal)`);

        mealPlanItems.push({
          id: crypto.randomUUID(),
          meal_plan_id: mealPlan.id,
          recipe_id: recipe_id,
          date,
          meal_type: validMealType,
          nutritional_context: explanation,
          custom_title: null, // Using actual recipe, no custom title needed
          calories: recipe.calories,
          protein: recipe.protein,
          carbs: recipe.carbs,
          fat: recipe.fat
        });
      }
      
      // FALLBACK: Only add simple snacks if AI didn't generate ANY snacks for a run day
      if (dayRuns.length > 0) {
        const existingSnackTypes = meals.map(m => validateMealType(m.meal_type));
        
        // Add pre-run snack if missing and no suitable recipe was selected
        if (!existingSnackTypes.includes('pre_run_snack')) {
          console.log(`Adding fallback pre-run snack for ${date} (AI didn't select a recipe)`);
          mealPlanItems.push({
            id: crypto.randomUUID(),
            meal_plan_id: mealPlan.id,
            recipe_id: null,
            date,
            meal_type: 'pre_run_snack',
            nutritional_context: `Pre-run fuel for ${dayRuns[0].title} - AI couldn't find suitable recipe`,
            custom_title: 'Pre-run snack (banana + dates)',
            calories: 150,
            protein: 3,
            carbs: 30,
            fat: 2
          });
        }
        
        // Add post-run snack if missing and no suitable recipe was selected
        if (!existingSnackTypes.includes('post_run_snack')) {
          console.log(`Adding fallback post-run snack for ${date} (AI didn't select a recipe)`);
          mealPlanItems.push({
            id: crypto.randomUUID(),
            meal_plan_id: mealPlan.id,
            recipe_id: null,
            date,
            meal_type: 'post_run_snack',
            nutritional_context: `Recovery nutrition after ${dayRuns[0].title} - AI couldn't find suitable recipe`,
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
