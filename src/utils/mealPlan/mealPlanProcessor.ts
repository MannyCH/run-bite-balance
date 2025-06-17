
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
): Promise<MealPlanItem[] | null> {
  try {
    console.log('🔄 Processing AI meal plan response');
    console.log(`📅 Date range: ${startDate} to ${endDate}`);
    console.log(`🏃 Runs provided for processing: ${runs.length}`);
    console.log('📊 AI Response structure:', {
      hasMessage: !!aiResponse?.message,
      hasMealPlan: !!aiResponse?.mealPlan,
      hasDays: !!aiResponse?.mealPlan?.days,
      daysCount: aiResponse?.mealPlan?.days?.length || 0
    });
    
    if (!aiResponse?.mealPlan?.days) {
      console.error('❌ Invalid AI meal plan structure - missing days array');
      return null;
    }

    // Create or update the meal plan record
    const mealPlan = await createOrUpdateMealPlan(userId, startDate, endDate);
    if (!mealPlan) {
      console.error('❌ Failed to create meal plan record');
      return null;
    }

    console.log(`✅ Created meal plan record: ${mealPlan.id}`);

    // Delete existing meal plan items
    const deleteSuccess = await deleteExistingMealPlanItems(mealPlan.id);
    if (!deleteSuccess) {
      console.error('❌ Failed to delete existing meal plan items');
      return null;
    }

    console.log('✅ Deleted existing meal plan items');

    const mealPlanItems: Partial<MealPlanItem>[] = [];
    const allRecipes = Object.values(recipesMap);
    const diversityManager = new RecipeDiversityManager();
    diversityManager.reset();

    // Process each day from the AI response
    const days = aiResponse.mealPlan.days;
    console.log(`🗓️ Processing ${days.length} days from AI response`);

    for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
      const day = days[dayIndex];
      const { date, meals } = day;
      
      console.log(`\n📅 Processing day ${dayIndex + 1}/7: ${date}`);
      console.log(`🍽️ Meals for ${date}: ${meals.length} meals`);
      
      // Log each meal for this day
      meals.forEach((meal, mealIndex) => {
        console.log(`  Meal ${mealIndex + 1}: ${meal.meal_type} - Recipe ID: ${meal.recipe_id}`);
      });
      
      // Check if this day has any runs
      const dayDate = parseISO(date);
      const dayRuns = getRunsForDate(runs, dayDate);
      const isRunDay = dayRuns.length > 0;
      
      console.log(`🏃 Day ${date}: ${dayRuns.length} runs (${isRunDay ? 'RUN DAY' : 'REST DAY'})`);
      
      // Process AI-generated meals (lunch will be automatically enhanced for run days)
      const aiMealItems = processAIMealsForDay(
        meals,
        recipesMap,
        mealPlan.id,
        date,
        isRunDay
      );
      
      console.log(`✅ Processed ${aiMealItems.length} AI meals for ${date}`);
      mealPlanItems.push(...aiMealItems);
      
      // Add pre-run snack for run days
      if (isRunDay) {
        const preRunSnack = selectSnackRecipe(allRecipes, 'pre_run_snack', diversityManager);
        if (preRunSnack) {
          console.log(`🍌 Adding pre-run snack recipe: ${preRunSnack.title} for ${date}`);
          const preRunItem = createSnackMealPlanItem(preRunSnack, mealPlan.id, date, 'pre_run_snack');
          mealPlanItems.push(preRunItem);
        } else {
          console.warn(`⚠️ No pre-run snack recipe found for ${date}`);
        }
        
        console.log(`🥗 Lunch will serve as post-run recovery meal for this run day`);
      }
      
      // Move to next day for diversity tracking
      diversityManager.nextDay();
    }

    console.log(`\n📊 Total meal plan items created: ${mealPlanItems.length}`);
    
    // Log summary by date
    const itemsByDate = mealPlanItems.reduce((acc, item) => {
      if (!acc[item.date!]) acc[item.date!] = [];
      acc[item.date!].push(item);
      return acc;
    }, {} as Record<string, any[]>);
    
    Object.entries(itemsByDate).forEach(([date, items]) => {
      console.log(`📅 ${date}: ${items.length} meals - ${items.map(i => i.meal_type).join(', ')}`);
    });

    // Insert the processed meal plan items
    const savedItems = await insertMealPlanItems(mealPlanItems);
    if (!savedItems) {
      console.error('❌ Failed to insert meal plan items');
      return null;
    }

    console.log(`✅ Successfully saved ${savedItems.length} meal plan items to database`);
    return savedItems;
  } catch (error) {
    console.error('❌ Error processing AI meal plan:', error);
    return null;
  }
}
