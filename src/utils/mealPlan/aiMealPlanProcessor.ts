
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
      
      const isRunDay = dayRuns.length > 0;
      console.log(`Day ${date} has ${dayRuns.length} runs (${isRunDay ? 'RUN DAY' : 'REST DAY'})`);
      
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

        // Add contextual information for lunch on run days
        let contextualExplanation = explanation;
        if (isRunDay && validMealType === 'lunch') {
          contextualExplanation = `POST-RUN RECOVERY: ${explanation}`;
        }

        console.log(`Adding ${validMealType}: ${recipe.title} (${recipe.calories} cal)`);

        mealPlanItems.push({
          id: crypto.randomUUID(),
          meal_plan_id: mealPlan.id,
          recipe_id: recipe_id,
          date,
          meal_type: validMealType,
          nutritional_context: contextualExplanation,
          custom_title: null, // Using actual recipe, no custom title needed
          calories: recipe.calories,
          protein: recipe.protein,
          carbs: recipe.carbs,
          fat: recipe.fat
        });
      }
      
      // Validate meal structure for the day
      const mealTypes = meals.map(m => validateMealType(m.meal_type));
      const expectedMeals = isRunDay 
        ? ['breakfast', 'pre_run_snack', 'lunch', 'dinner']
        : ['breakfast', 'lunch', 'dinner'];
      
      // Check if we have the expected meal structure
      const hasAllExpectedMeals = expectedMeals.every(expectedMeal => 
        mealTypes.includes(expectedMeal as any)
      );
      
      if (!hasAllExpectedMeals) {
        const missingMeals = expectedMeals.filter(expectedMeal => 
          !mealTypes.includes(expectedMeal as any)
        );
        console.warn(`Day ${date} missing expected meals: ${missingMeals.join(', ')}`);
        
        // Only add fallback for missing dinner as it's essential
        if (missingMeals.includes('dinner')) {
          console.log(`Adding fallback dinner for ${date}`);
          mealPlanItems.push({
            id: crypto.randomUUID(),
            meal_plan_id: mealPlan.id,
            recipe_id: null,
            date,
            meal_type: 'dinner',
            nutritional_context: `Simple dinner - AI couldn't select a suitable recipe`,
            custom_title: 'Simple dinner (lean protein + vegetables)',
            calories: isRunDay ? 400 : 500,
            protein: 25,
            carbs: 30,
            fat: 15
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
