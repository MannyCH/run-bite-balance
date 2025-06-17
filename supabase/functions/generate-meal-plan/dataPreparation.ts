
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
