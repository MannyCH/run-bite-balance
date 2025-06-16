
// dataPreparation.ts — Prepare data for meal plan generation
import type { DailyRequirements, DailyBreakdown, RecipeSummary } from "./types.ts";
import type { UserProfile } from "../../../src/types/profile.ts";

/**
 * Convert database recipes to RecipeSummary format
 */
export function prepareRecipeSummaries(recipes: any[]): RecipeSummary[] {
  return recipes.map(recipe => ({
    id: recipe.id,
    title: recipe.title,
    calories: recipe.calories || 0,
    protein: recipe.protein || 0,
    carbs: recipe.carbs || 0,
    fat: recipe.fat || 0,
    ingredients: recipe.ingredients || [],
    categories: recipe.categories || [],
    meal_type: recipe.meal_type || [],  // Now properly handle array
    seasonal_suitability: recipe.seasonal_suitability || ['year_round'],
    temperature_preference: recipe.temperature_preference || 'any',
    dish_type: recipe.dish_type || 'neutral',
  }));
}

/**
 * Group runs by date for easy lookup
 */
export function groupRunsByDate(runs: any[]): Record<string, any[]> {
  const runsByDate: Record<string, any[]> = {};
  
  runs.forEach(run => {
    const dateStr = run.date;
    if (!runsByDate[dateStr]) {
      runsByDate[dateStr] = [];
    }
    runsByDate[dateStr].push(run);
  });
  
  return runsByDate;
}

/**
 * Calculate daily nutritional requirements for the entire period
 */
export function calculateAllDailyRequirements(
  profile: UserProfile,
  startDate: string,
  endDate: string,
  runsByDate: Record<string, any[]>
): { baseRequirements: DailyRequirements; dailyRequirements: Record<string, DailyRequirements> } {
  // Calculate base requirements (without runs)
  const baseRequirements = calculateBaseRequirements(profile);
  
  // Calculate requirements for each day
  const dailyRequirements: Record<string, DailyRequirements> = {};
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    const dayRuns = runsByDate[dateStr] || [];
    
    // Calculate additional calories needed for runs
    const runCalories = dayRuns.reduce((total, run) => {
      return total + (run.estimated_calories || 0);
    }, 0);
    
    dailyRequirements[dateStr] = {
      ...baseRequirements,
      runCalories,
      targetCalories: baseRequirements.targetCalories + runCalories
    };
  }
  
  return { baseRequirements, dailyRequirements };
}

/**
 * Calculate base nutritional requirements based on user profile
 */
function calculateBaseRequirements(profile: UserProfile): DailyRequirements {
  // Use BMR if available, otherwise calculate
  let bmr = profile.bmr || 1800; // Default fallback
  
  if (!profile.bmr && profile.weight && profile.height && profile.age && profile.gender) {
    // Calculate BMR using Mifflin-St Jeor equation
    if (profile.gender === 'male') {
      bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) + 5;
    } else {
      bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) - 161;
    }
  }
  
  // Apply activity level multiplier
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };
  
  const activityLevel = profile.activity_level || 'moderate';
  const maintenanceCalories = Math.round(bmr * activityMultipliers[activityLevel]);
  
  // Adjust for fitness goal
  let targetCalories = maintenanceCalories;
  if (profile.fitness_goal === 'lose') {
    targetCalories = Math.round(maintenanceCalories * 0.85); // 15% deficit
  } else if (profile.fitness_goal === 'gain') {
    targetCalories = Math.round(maintenanceCalories * 1.15); // 15% surplus
  }
  
  // Calculate macronutrient targets based on nutritional theory
  const { proteinGrams, fatGrams, carbGrams } = calculateMacroTargets(
    targetCalories, 
    profile.nutritional_theory || 'balanced'
  );
  
  return {
    targetCalories,
    maintenanceCalories,
    proteinGrams,
    fatGrams,
    carbGrams,
    mealDistribution: {
      breakfast: Math.round(targetCalories * 0.25),
      lunch: Math.round(targetCalories * 0.35),
      dinner: Math.round(targetCalories * 0.40)
    }
  };
}

/**
 * Calculate macro targets based on nutritional theory
 */
function calculateMacroTargets(calories: number, theory: string) {
  let proteinPercent = 0.20;
  let fatPercent = 0.30;
  let carbPercent = 0.50;
  
  switch (theory) {
    case 'high_protein':
      proteinPercent = 0.30;
      fatPercent = 0.25;
      carbPercent = 0.45;
      break;
    case 'low_carb':
      proteinPercent = 0.25;
      fatPercent = 0.45;
      carbPercent = 0.30;
      break;
    case 'keto':
      proteinPercent = 0.20;
      fatPercent = 0.70;
      carbPercent = 0.10;
      break;
    case 'mediterranean':
      proteinPercent = 0.18;
      fatPercent = 0.35;
      carbPercent = 0.47;
      break;
    default: // balanced
      break;
  }
  
  return {
    proteinGrams: Math.round((calories * proteinPercent) / 4),
    fatGrams: Math.round((calories * fatPercent) / 9),
    carbGrams: Math.round((calories * carbPercent) / 4)
  };
}
