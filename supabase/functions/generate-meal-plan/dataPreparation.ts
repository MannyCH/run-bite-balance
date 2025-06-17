
import type { RecipeSummary } from './types.ts';

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
  
  // Enhanced meal type statistics for better debugging
  const mealTypeStats = {
    breakfast: preparedRecipes.filter(r => r.meal_type?.includes('breakfast')).length,
    lunch: preparedRecipes.filter(r => r.meal_type?.includes('lunch')).length,
    dinner: preparedRecipes.filter(r => r.meal_type?.includes('dinner')).length,
    snack: preparedRecipes.filter(r => r.meal_type?.includes('snack')).length,
    low_calorie_snacks: preparedRecipes.filter(r => r.calories <= 200).length,
    no_meal_type: preparedRecipes.filter(r => !r.meal_type || r.meal_type.length === 0).length,
    total: preparedRecipes.length
  };
  
  console.log('Enhanced recipe meal type distribution:', mealTypeStats);
  console.log(`✅ Prepared ${preparedRecipes.length} recipes for advanced meal planning`);
  
  return preparedRecipes;
}

export function validateRecipeData(recipes: RecipeSummary[]): boolean {
  const recipesWithMealTypes = recipes.filter(r => r.meal_type && r.meal_type.length > 0);
  
  if (recipesWithMealTypes.length === 0) {
    console.warn('❌ No recipes have meal type classifications! Meal planning may not work correctly.');
    console.warn('Please run the Recipe Meal Type Classifier first.');
    return false;
  }
  
  // Enhanced validation for comprehensive meal planning
  const mealTypes = ['breakfast', 'lunch', 'dinner'];
  const missingMealTypes = mealTypes.filter(mealType => 
    !recipesWithMealTypes.some(recipe => recipe.meal_type?.includes(mealType))
  );
  
  if (missingMealTypes.length > 0) {
    console.warn(`⚠️ Missing recipes for meal types: ${missingMealTypes.join(', ')}`);
    console.warn('Meal planning may be limited for these meal types.');
  }
  
  // Check for adequate snack options (≤200 calories)
  const snackOptions = recipes.filter(r => r.calories <= 200);
  if (snackOptions.length < 5) {
    console.warn(`⚠️ Limited snack options (${snackOptions.length} recipes ≤200 cal). Run days may have fewer pre-run snack choices.`);
  }
  
  // Check recipe distribution for batch cooking scenarios
  const mealTypeDistribution = {
    breakfast: recipesWithMealTypes.filter(r => r.meal_type?.includes('breakfast')).length,
    lunch: recipesWithMealTypes.filter(r => r.meal_type?.includes('lunch')).length,
    dinner: recipesWithMealTypes.filter(r => r.meal_type?.includes('dinner')).length
  };
  
  console.log('Recipe distribution for batch cooking:', mealTypeDistribution);
  
  // Warn if insufficient recipes for batch cooking scenarios
  Object.entries(mealTypeDistribution).forEach(([mealType, count]) => {
    if (count < 3) {
      console.warn(`⚠️ Limited ${mealType} recipes (${count}). Batch cooking may have fewer options.`);
    }
  });
  
  console.log('✅ Recipe data validation completed with enhanced checks');
  return true;
}

// New function to calculate daily requirements including run adjustments
export function calculateAllDailyRequirements(profile: any) {
  // Base calorie calculation
  let baseCalories = 2000; // Default
  
  if (profile.bmr) {
    const activityMultipliers = {
      'sedentary': 1.2,
      'light': 1.375,
      'moderate': 1.55,
      'active': 1.725,
      'very_active': 1.9
    };
    
    const multiplier = activityMultipliers[profile.activity_level] || 1.55;
    baseCalories = Math.round(profile.bmr * multiplier);
    
    // Adjust for fitness goal
    if (profile.fitness_goal === 'lose') {
      baseCalories -= 300; // Moderate deficit
    } else if (profile.fitness_goal === 'gain') {
      baseCalories += 300; // Moderate surplus
    }
  }
  
  // Macronutrient distribution based on nutritional theory
  let proteinRatio = 0.25;
  let fatRatio = 0.30;
  let carbRatio = 0.45;
  
  if (profile.nutritional_theory === 'high_protein') {
    proteinRatio = 0.35;
    fatRatio = 0.25;
    carbRatio = 0.40;
  } else if (profile.nutritional_theory === 'low_carb') {
    proteinRatio = 0.25;
    fatRatio = 0.45;
    carbRatio = 0.30;
  } else if (profile.nutritional_theory === 'mediterranean') {
    proteinRatio = 0.20;
    fatRatio = 0.35;
    carbRatio = 0.45;
  }
  
  return {
    targetCalories: baseCalories,
    proteinGrams: Math.round((baseCalories * proteinRatio) / 4),
    fatGrams: Math.round((baseCalories * fatRatio) / 9),
    carbGrams: Math.round((baseCalories * carbRatio) / 4),
    mealDistribution: {
      breakfast: Math.round(baseCalories * 0.25),
      lunch: Math.round(baseCalories * 0.35),
      dinner: Math.round(baseCalories * 0.40)
    }
  };
}
