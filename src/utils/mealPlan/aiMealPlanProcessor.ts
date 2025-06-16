
// Utility for processing AI-generated meal plans
import { UserProfile, MealPlan, MealPlanItem } from '@/types/profile';
import { Recipe } from '@/context/types';
import { 
  createOrUpdateMealPlan, 
  deleteExistingMealPlanItems, 
  insertMealPlanItems
} from './mealPlanDb';
import { validateMealType } from './validators';
import { isSameDay, parseISO, getHours } from 'date-fns';
import { RecipeDiversityManager } from './recipeSelection';

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
 * Checks if a run is scheduled during lunch time (11:00-14:00)
 */
function isLunchTimeRun(run: any): boolean {
  const runDate = new Date(run.date);
  const hour = getHours(runDate);
  return hour >= 11 && hour <= 14;
}

/**
 * Selects an appropriate recipe for snacks from existing recipes
 */
function selectSnackRecipe(
  recipes: Recipe[],
  snackType: 'pre_run_snack' | 'post_run_snack',
  diversityManager: RecipeDiversityManager
): Recipe | null {
  // Filter recipes suitable for snacks
  const snackRecipes = recipes.filter(recipe => {
    if (snackType === 'pre_run_snack') {
      // Light breakfast items or low-calorie recipes (100-200 cal)
      const isLightBreakfast = recipe.meal_type?.includes('breakfast') && recipe.calories <= 200;
      const isLowCalorie = recipe.calories <= 200 && recipe.calories >= 100;
      return isLightBreakfast || isLowCalorie;
    } else {
      // Light lunch items or medium-calorie recipes (200-300 cal)
      const isLightLunch = recipe.meal_type?.includes('lunch') && recipe.calories <= 300;
      const isMediumCalorie = recipe.calories <= 300 && recipe.calories >= 200;
      return isLightLunch || isMediumCalorie;
    }
  });

  if (snackRecipes.length === 0) {
    console.warn(`No suitable recipes found for ${snackType}`);
    return null;
  }

  // Use diversity manager to select appropriate snack
  const targetCalories = snackType === 'pre_run_snack' ? 150 : 250;
  const proteinTarget = snackType === 'pre_run_snack' ? 5 : 15;

  return diversityManager.selectRecipeWithDiversity(snackRecipes, targetCalories, proteinTarget);
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
      const hasLunchTimeRun = dayRuns.some(run => isLunchTimeRun(run));
      console.log(`Day ${date} has ${dayRuns.length} runs (${isRunDay ? 'RUN DAY' : 'REST DAY'}), lunch-time run: ${hasLunchTimeRun}`);
      
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
          if (hasLunchTimeRun) {
            contextualExplanation = `POST-RUN RECOVERY LUNCH: ${explanation} Enhanced for muscle recovery after your lunch-time run.`;
          } else {
            contextualExplanation = `RUN DAY LUNCH: ${explanation}`;
          }
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
      
      // Add run-specific snacks using existing recipes
      if (isRunDay) {
        // Always add pre-run snack
        const preRunSnack = selectSnackRecipe(allRecipes, 'pre_run_snack', diversityManager);
        if (preRunSnack) {
          console.log(`Adding pre-run snack recipe: ${preRunSnack.title}`);
          mealPlanItems.push({
            id: crypto.randomUUID(),
            meal_plan_id: mealPlan.id,
            recipe_id: preRunSnack.id,
            date,
            meal_type: 'pre_run_snack',
            nutritional_context: `Pre-run fuel: ${preRunSnack.title} provides quick energy for your run`,
            custom_title: null,
            calories: preRunSnack.calories,
            protein: preRunSnack.protein,
            carbs: preRunSnack.carbs,
            fat: preRunSnack.fat
          });
        }
        
        // Add post-run snack only if it's NOT a lunch-time run and it's a longer run
        if (!hasLunchTimeRun && dayRuns.some(run => run.distance >= 5)) {
          const postRunSnack = selectSnackRecipe(allRecipes, 'post_run_snack', diversityManager);
          if (postRunSnack) {
            console.log(`Adding post-run recovery snack recipe: ${postRunSnack.title}`);
            mealPlanItems.push({
              id: crypto.randomUUID(),
              meal_plan_id: mealPlan.id,
              recipe_id: postRunSnack.id,
              date,
              meal_type: 'post_run_snack',
              nutritional_context: `Post-run recovery: ${postRunSnack.title} helps with muscle recovery after your run`,
              custom_title: null,
              calories: postRunSnack.calories,
              protein: postRunSnack.protein,
              carbs: postRunSnack.carbs,
              fat: postRunSnack.fat
            });
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
