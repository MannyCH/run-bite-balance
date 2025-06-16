
// Generate meal plan items using enhanced recipe selection with seasonal filtering
import { Recipe } from '@/context/types';
import { UserProfile, MealPlanItem } from '@/types/profile';
import { format, addDays, parseISO, isSameDay } from 'date-fns';
import { RecipeDiversityManager } from './recipeSelection';
import { filterSeasonallyAppropriateRecipes } from './seasonalFiltering';

interface Run {
  title: string;
  date: Date | string;
  distance: number;
  duration: number;
  isPlanned: boolean;
  isImported?: boolean;
}

// Calculate daily caloric needs based on profile
function calculateDailyCalories(profile: UserProfile): number {
  if (!profile.bmr || !profile.activity_level || !profile.fitness_goal) {
    return 2000; // Default fallback
  }

  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };

  const maintenanceCalories = profile.bmr * activityMultipliers[profile.activity_level];
  
  switch (profile.fitness_goal) {
    case 'lose':
      return Math.round(maintenanceCalories - 500);
    case 'gain':
      return Math.round(maintenanceCalories + 300);
    default:
      return Math.round(maintenanceCalories);
  }
}

// Estimate calories burned during a run
function estimateRunCalories(run: Run, userWeight: number = 70): number {
  const caloriesPerKmPerKg = 0.75;
  return Math.round(run.distance * userWeight * caloriesPerKmPerKg);
}

// Calculate meal distribution with runs consideration
function calculateMealDistribution(
  targetCalories: number,
  hasRuns: boolean
): Record<string, number> {
  if (hasRuns) {
    // Run days: breakfast (25%), pre-run snack (8%), lunch as post-run (42%), dinner (25%)
    return {
      breakfast: Math.round(targetCalories * 0.25),
      pre_run_snack: Math.round(targetCalories * 0.08),
      lunch: Math.round(targetCalories * 0.42), // Lunch serves as post-run recovery
      dinner: Math.round(targetCalories * 0.25)
    };
  } else {
    // Rest days: breakfast (25%), lunch (40%), dinner (35%)
    return {
      breakfast: Math.round(targetCalories * 0.25),
      lunch: Math.round(targetCalories * 0.40),
      dinner: Math.round(targetCalories * 0.35)
    };
  }
}

// Generate a simple snack meal item
function generateSnackItem(
  mealPlanId: string,
  date: string,
  mealType: 'pre_run_snack' | 'post_run_snack',
  targetCalories: number,
  runTitle?: string
): MealPlanItem {
  const snackOptions = {
    pre_run_snack: [
      { title: 'Banana with Almond Butter', calories: 200, protein: 6, carbs: 30, fat: 8 },
      { title: 'Energy Ball (Dates & Nuts)', calories: 180, protein: 4, carbs: 22, fat: 9 },
      { title: 'Greek Yogurt with Berries', calories: 150, protein: 15, carbs: 20, fat: 2 },
      { title: 'Toast with Honey', calories: 160, protein: 4, carbs: 32, fat: 2 }
    ],
    post_run_snack: [
      { title: 'Chocolate Milk', calories: 190, protein: 8, carbs: 26, fat: 8 },
      { title: 'Protein Smoothie', calories: 220, protein: 25, carbs: 15, fat: 5 },
      { title: 'Greek Yogurt with Granola', calories: 200, protein: 15, carbs: 25, fat: 6 },
      { title: 'Recovery Shake', calories: 180, protein: 20, carbs: 18, fat: 4 }
    ]
  };

  const options = snackOptions[mealType];
  const selectedSnack = options[Math.floor(Math.random() * options.length)];
  
  return {
    id: `generated-${Date.now()}-${Math.random()}`,
    meal_plan_id: mealPlanId,
    recipe_id: null,
    date,
    meal_type: mealType,
    custom_title: selectedSnack.title,
    calories: selectedSnack.calories,
    protein: selectedSnack.protein,
    carbs: selectedSnack.carbs,
    fat: selectedSnack.fat,
    nutritional_context: runTitle ? `Fuel for: ${runTitle}` : 'Recovery nutrition'
  };
}

export function generateMealPlanItems(
  mealPlanId: string,
  profile: UserProfile,
  recipes: Recipe[],
  startDate: string,
  endDate: string,
  runs: Run[] = []
): MealPlanItem[] {
  console.log(`🍽️ Generating algorithmic meal plan with ${runs.length} runs from ${startDate} to ${endDate}`);
  
  // Filter and apply seasonal appropriateness
  const seasonallyAppropriateRecipes = filterSeasonallyAppropriateRecipes(recipes);
  console.log(`After seasonal filtering: ${seasonallyAppropriateRecipes.length} recipes available`);

  // Initialize diversity manager
  const diversityManager = new RecipeDiversityManager();
  diversityManager.reset();

  const mealPlanItems: MealPlanItem[] = [];
  const baseCalories = calculateDailyCalories(profile);
  const userWeight = profile.weight || 70;

  // Generate meals for each day
  const startDateObj = parseISO(startDate);
  const endDateObj = parseISO(endDate);
  let currentDate = startDateObj;

  while (currentDate <= endDateObj) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    console.log(`\n📅 Planning personalized meals for day ${Math.floor((currentDate.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1}: ${dateStr}`);

    // Find runs for this day (check both imported and regular runs)
    const runsForDay = runs.filter(run => {
      const runDate = typeof run.date === 'string' ? parseISO(run.date) : run.date;
      return isSameDay(runDate, currentDate) && run.isPlanned;
    });

    console.log(`Found ${runsForDay.length} planned runs for ${dateStr}:`, 
      runsForDay.map(r => `${r.title} (${r.distance}km, imported: ${r.isImported || false})`));

    const hasRuns = runsForDay.length > 0;
    
    // Calculate daily calories including run burn
    let dailyCalories = baseCalories;
    if (hasRuns) {
      const runCalories = runsForDay.reduce((total, run) => total + estimateRunCalories(run, userWeight), 0);
      dailyCalories += runCalories;
      console.log(`Added ${runCalories} calories for runs, total: ${dailyCalories}`);
    }

    // Get meal distribution for the day
    const mealDistribution = calculateMealDistribution(dailyCalories, hasRuns);
    console.log(`Meal distribution for ${dateStr}:`, mealDistribution);

    // Generate meals based on whether it's a run day
    if (hasRuns) {
      // Generate pre-run snack
      const preRunSnack = generateSnackItem(
        mealPlanId,
        dateStr,
        'pre_run_snack',
        mealDistribution.pre_run_snack,
        runsForDay[0].title
      );
      mealPlanItems.push(preRunSnack);
      console.log(`Generated pre-run snack: ${preRunSnack.custom_title}`);

      // Generate main meals
      for (const mealType of ['breakfast', 'lunch', 'dinner'] as const) {
        const targetCalories = mealDistribution[mealType];
        const proteinTarget = Math.round(targetCalories * 0.2 / 4); // 20% protein

        const availableRecipes = diversityManager.getRecipesForMealType(seasonallyAppropriateRecipes, mealType);
        const selectedRecipe = diversityManager.selectRecipeWithDiversity(
          availableRecipes,
          targetCalories,
          proteinTarget
        );

        if (selectedRecipe) {
          const mealItem: MealPlanItem = {
            id: `generated-${Date.now()}-${Math.random()}`,
            meal_plan_id: mealPlanId,
            recipe_id: selectedRecipe.id,
            date: dateStr,
            meal_type: mealType,
            custom_title: null,
            calories: selectedRecipe.calories,
            protein: selectedRecipe.protein,
            carbs: selectedRecipe.carbs,
            fat: selectedRecipe.fat,
            nutritional_context: hasRuns ? `Run day: ${runsForDay.map(r => r.title).join(', ')}` : null
          };
          mealPlanItems.push(mealItem);
        } else {
          console.warn(`No suitable ${mealType} recipe found for ${dateStr}`);
        }
      }
    } else {
      // Rest day - generate standard meals
      for (const mealType of ['breakfast', 'lunch', 'dinner'] as const) {
        const targetCalories = mealDistribution[mealType];
        const proteinTarget = Math.round(targetCalories * 0.2 / 4);

        const availableRecipes = diversityManager.getRecipesForMealType(seasonallyAppropriateRecipes, mealType);
        const selectedRecipe = diversityManager.selectRecipeWithDiversity(
          availableRecipes,
          targetCalories,
          proteinTarget
        );

        if (selectedRecipe) {
          const mealItem: MealPlanItem = {
            id: `generated-${Date.now()}-${Math.random()}`,
            meal_plan_id: mealPlanId,
            recipe_id: selectedRecipe.id,
            date: dateStr,
            meal_type: mealType,
            custom_title: null,
            calories: selectedRecipe.calories,
            protein: selectedRecipe.protein,
            carbs: selectedRecipe.carbs,
            fat: selectedRecipe.fat,
            nutritional_context: 'Rest day nutrition'
          };
          mealPlanItems.push(mealItem);
        } else {
          console.warn(`No suitable ${mealType} recipe found for ${dateStr}`);
        }
      }
    }

    diversityManager.nextDay();
    currentDate = addDays(currentDate, 1);
  }

  console.log(`✅ Generated ${mealPlanItems.length} meal plan items total`);
  return mealPlanItems;
}
