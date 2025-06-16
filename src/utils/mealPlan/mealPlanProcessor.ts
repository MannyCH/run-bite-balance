
import { MealPlanItem } from '@/types/profile';
import { Recipe } from '@/context/types';
import { 
  createOrUpdateMealPlan, 
  deleteExistingMealPlanItems, 
  insertMealPlanItems
} from './mealPlanDb';
import { isSameDay, parseISO } from 'date-fns';
import { RecipeDiversityManager } from './recipeSelection';
import { isLunchTimeRun, hasLunchTimeRuns, needsPostRunSnack } from './runTimingUtils';
import { selectSnackRecipe, createSnackMealPlanItem } from './snackSelectionUtils';
import { processAIMealsForDay } from './mealProcessingUtils';

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
    const allRecipes = Object.values(recipesMap);
    const diversityManager = new RecipeDiversityManager();
    diversityManager.reset();

    // Process each day from the AI response
    for (const day of aiResponse.mealPlan.days) {
      const { date, meals } = day;
      console.log(`Processing day ${date} with ${meals.length} meals`);
      
      // Check if this day has any runs and their timing
      const dayRuns = runs.filter(run => {
        const runDate = new Date(run.date);
        const dayDate = parseISO(date);
        return isSameDay(runDate, dayDate);
      });
      
      const isRunDay = dayRuns.length > 0;
      const hasLunchTimeRun = hasLunchTimeRuns(dayRuns);
      console.log(`Day ${date} has ${dayRuns.length} runs (${isRunDay ? 'RUN DAY' : 'REST DAY'}), lunch-time run: ${hasLunchTimeRun}`);
      
      // Process AI-generated meals
      const aiMealItems = processAIMealsForDay(
        meals,
        recipesMap,
        mealPlan.id,
        date,
        isRunDay,
        hasLunchTimeRun
      );
      mealPlanItems.push(...aiMealItems);
      
      // Add run-specific snacks using existing recipes
      if (isRunDay) {
        // Always add pre-run snack
        const preRunSnack = selectSnackRecipe(allRecipes, 'pre_run_snack', diversityManager);
        if (preRunSnack) {
          console.log(`Adding pre-run snack recipe: ${preRunSnack.title}`);
          const preRunItem = createSnackMealPlanItem(preRunSnack, mealPlan.id, date, 'pre_run_snack');
          mealPlanItems.push(preRunItem);
        }
        
        // Add post-run snack only if it's NOT a lunch-time run and it's a longer run
        if (needsPostRunSnack(dayRuns)) {
          const postRunSnack = selectSnackRecipe(allRecipes, 'post_run_snack', diversityManager);
          if (postRunSnack) {
            console.log(`Adding post-run recovery snack recipe: ${postRunSnack.title}`);
            const postRunItem = createSnackMealPlanItem(postRunSnack, mealPlan.id, date, 'post_run_snack');
            mealPlanItems.push(postRunItem);
          }
        }
      }
      
      // Move to next day for diversity tracking
      diversityManager.nextDay();
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
