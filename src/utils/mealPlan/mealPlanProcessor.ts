
import { MealPlanItem } from '@/types/profile';
import { Recipe } from '@/context/types';
import { 
  createOrUpdateMealPlan, 
  deleteExistingMealPlanItems, 
  insertMealPlanItems
} from './mealPlanDb';
import { isSameDay, parseISO } from 'date-fns';
import { RecipeDiversityManager } from './recipeSelection';
import { getRunsForDate } from './runTimingUtils';
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
): Promise<{ mealPlan: any; items: MealPlanItem[] } | null> {
  try {
    console.log('Processing AI meal plan response');
    console.log(`Runs provided for processing: ${runs.length}`);
    console.log(`Expected date range: ${startDate} to ${endDate}`);
    
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

    // Validate dates are within expected range
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const invalidDates = aiResponse.mealPlan.days.filter((day: AIMealPlanDay) => {
      const dayDate = new Date(day.date);
      return dayDate < startDateObj || dayDate > endDateObj;
    });
    
    if (invalidDates.length > 0) {
      console.warn(`⚠️ AI generated ${invalidDates.length} days outside expected range (${startDate} to ${endDate}):`, 
        invalidDates.map((d: AIMealPlanDay) => d.date));
    }

    // Process each day from the AI response
    for (const day of aiResponse.mealPlan.days) {
      const { date, meals } = day;
      console.log(`Processing day ${date} with ${meals.length} meals`);
      
      // Check if this day has any runs
      const dayDate = parseISO(date);
      const dayRuns = getRunsForDate(runs, dayDate);
      const isRunDay = dayRuns.length > 0;
      
      console.log(`Day ${date} has ${dayRuns.length} runs (${isRunDay ? 'RUN DAY' : 'REST DAY'})`);
      
      // Check if AI already included pre_run_snack
      const hasAIPreRunSnack = meals.some(meal => meal.meal_type === 'pre_run_snack');
      
      // Process AI-generated meals (lunch will be automatically enhanced for run days)
      const aiMealItems = processAIMealsForDay(
        meals,
        recipesMap,
        mealPlan.id,
        date,
        isRunDay
      );
      mealPlanItems.push(...aiMealItems);
      
      // Only add pre-run snack if it's a run day AND AI didn't already include it
      if (isRunDay && !hasAIPreRunSnack) {
        const preRunSnack = selectSnackRecipe(allRecipes, 'pre_run_snack', diversityManager);
        if (preRunSnack) {
          console.log(`Adding pre-run snack recipe: ${preRunSnack.title}`);
          const preRunItem = createSnackMealPlanItem(preRunSnack, mealPlan.id, date, 'pre_run_snack');
          mealPlanItems.push(preRunItem);
        }
      } else if (hasAIPreRunSnack) {
        console.log(`AI already included pre-run snack for ${date}, skipping manual addition`);
      }
      
      if (isRunDay) {
        console.log(`Lunch will serve as post-run recovery meal for this run day`);
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
    return { mealPlan, items: savedItems };
  } catch (error) {
    console.error('Error processing AI meal plan:', error);
    return null;
  }
}
