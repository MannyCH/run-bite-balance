
import type { RecipeSummary } from './types.ts';

// Define UserProfile interface directly in edge function context
interface UserProfile {
  id: string;
  username?: string | null;
  weight?: number | null;
  target_weight?: number | null;
  height?: number | null;
  age?: number | null;
  gender?: 'male' | 'female' | 'other' | null;
  fitness_goal?: 'lose' | 'maintain' | 'gain' | null;
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null;
  bmr?: number | null;
  dietary_preferences?: string[] | null;
  nutritional_theory?: string | null;
  food_allergies?: string[] | null;
  preferred_cuisines?: string[] | null;
  foods_to_avoid?: string[] | null;
  meal_complexity?: 'simple' | 'moderate' | 'complex' | null;
  ical_feed_url?: string | null;
  avatar_url?: string | null;
  batch_cooking_repetitions?: number | null;
  batch_cooking_people?: number | null;
}

interface DailyRequirements {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealDistribution: {
    breakfast: number;
    lunch: number;
    dinner: number;
  };
}

export function calculateAllDailyRequirements(profile: UserProfile): DailyRequirements {
  console.log('Calculating daily requirements for profile:', profile.id);
  
  // Use BMR if available, otherwise calculate basic estimate
  let baseCalories = profile.bmr || 1800; // Default fallback
  
  // Activity level multipliers
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };

  const multiplier = profile.activity_level ? 
    activityMultipliers[profile.activity_level as keyof typeof activityMultipliers] : 
    1.5; // Default to moderate

  // Calculate daily calories
  let dailyCalories = baseCalories * multiplier;
  
  // Adjust based on fitness goal
  if (profile.fitness_goal === 'lose') {
    dailyCalories *= 0.85; // 15% deficit for weight loss
  } else if (profile.fitness_goal === 'gain') {
    dailyCalories *= 1.1; // 10% surplus for weight gain
  }

  // Calculate macronutrient targets based on fitness goal
  let proteinPct, fatPct, carbsPct;
  
  if (profile.fitness_goal === 'lose') {
    proteinPct = 0.35; // Higher protein for weight loss
    fatPct = 0.35;
    carbsPct = 0.3;
  } else if (profile.fitness_goal === 'gain') {
    proteinPct = 0.25;
    fatPct = 0.3;
    carbsPct = 0.45; // Higher carbs for weight gain
  } else {
    proteinPct = 0.3;
    fatPct = 0.3;
    carbsPct = 0.4;
  }

  // Calculate grams (protein & carbs = 4 cal/g, fat = 9 cal/g)
  const proteinGrams = Math.round((dailyCalories * proteinPct) / 4);
  const carbsGrams = Math.round((dailyCalories * carbsPct) / 4);
  const fatGrams = Math.round((dailyCalories * fatPct) / 9);

  const requirements = {
    calories: Math.round(dailyCalories),
    protein: proteinGrams,
    carbs: carbsGrams,
    fat: fatGrams,
    mealDistribution: {
      breakfast: Math.round(dailyCalories * 0.25),  // 25%
      lunch: Math.round(dailyCalories * 0.40),      // 40%
      dinner: Math.round(dailyCalories * 0.35)      // 35%
    }
  };

  console.log('Calculated daily requirements:', requirements);
  return requirements;
}

export function prepareRecipeData(recipes: any[]): RecipeSummary[] {
  console.log('Preparing recipe data...');
  
  const preparedRecipes = recipes.map(recipe => {
    // Ensure meal_type is always an array
    let mealType: string[] = [];
    if (recipe.meal_type) {
      if (Array.isArray(recipe.meal_type)) {
        mealType = recipe.meal_type;
      } else if (typeof recipe.meal_type === 'string') {
        // Handle legacy string format
        mealType = [recipe.meal_type];
      }
    }
    
    // Ensure seasonal_suitability is an array
    let seasonalSuitability: string[] = ['year_round'];
    if (recipe.seasonal_suitability) {
      if (Array.isArray(recipe.seasonal_suitability)) {
        seasonalSuitability = recipe.seasonal_suitability;
      } else if (typeof recipe.seasonal_suitability === 'string') {
        seasonalSuitability = [recipe.seasonal_suitability];
      }
    }
    
    return {
      id: recipe.id,
      title: recipe.title || 'Untitled Recipe',
      calories: recipe.calories || 0,
      protein: recipe.protein || 0,
      carbs: recipe.carbs || 0,
      fat: recipe.fat || 0,
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
      categories: Array.isArray(recipe.categories) ? recipe.categories : [],
      meal_type: mealType,
      seasonal_suitability: seasonalSuitability,
      temperature_preference: recipe.temperature_preference || 'any',
      dish_type: recipe.dish_type || 'neutral'
    } as RecipeSummary;
  });
  
  // Log meal type distribution
  const mealTypeStats = {
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    snack: 0,
    no_meal_type: 0
  };
  
  preparedRecipes.forEach(recipe => {
    if (!recipe.meal_type || recipe.meal_type.length === 0) {
      mealTypeStats.no_meal_type++;
    } else {
      recipe.meal_type.forEach(mealType => {
        if (mealType === 'breakfast') mealTypeStats.breakfast++;
        else if (mealType === 'lunch') mealTypeStats.lunch++;
        else if (mealType === 'dinner') mealTypeStats.dinner++;
        else if (mealType === 'snack') mealTypeStats.snack++;
      });
    }
  });
  
  console.log('Recipe meal type distribution:', mealTypeStats);
  console.log(`Prepared ${preparedRecipes.length} recipes for meal planning`);
  
  return preparedRecipes;
}

export function validateRecipeData(recipes: RecipeSummary[]): boolean {
  const recipesWithMealTypes = recipes.filter(r => r.meal_type && r.meal_type.length > 0);
  
  if (recipesWithMealTypes.length === 0) {
    console.warn('No recipes have meal type classifications! Meal planning may not work correctly.');
    console.warn('Please run the Recipe Meal Type Classifier first.');
    return false;
  }
  
  // Check if we have recipes for each meal type
  const mealTypes = ['breakfast', 'lunch', 'dinner'];
  const missingMealTypes = mealTypes.filter(mealType => 
    !recipesWithMealTypes.some(recipe => recipe.meal_type?.includes(mealType))
  );
  
  if (missingMealTypes.length > 0) {
    console.warn(`Missing recipes for meal types: ${missingMealTypes.join(', ')}`);
    console.warn('Meal planning may be limited for these meal types.');
  }
  
  return true;
}
