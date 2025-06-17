
import type { RecipeSummary } from './types.ts';
import { calculateAllDailyRequirements } from './dataPreparation.ts';

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

interface MealPlanDay {
  date: string;
  meals: {
    meal_type: string;
    recipe_id: string;
    explanation: string;
  }[];
}

interface RecipeScore {
  recipe: RecipeSummary;
  score: number;
  diversityPenalty: number;
  nutritionalMatch: number;
  mainIngredient: string;
}

export function generateFallbackMealPlan(
  profile: UserProfile,
  recipes: RecipeSummary[],
  startDate: string,
  endDate: string,
  runs: any[] = []
): any {
  console.log('🔄 Generating enhanced fallback meal plan with improved diversity');
  
  const requirements = calculateAllDailyRequirements(profile);
  
  // Categorize recipes by meal type
  const breakfastRecipes = recipes.filter(r => r.meal_type?.includes('breakfast') && r.calories > 0);
  const lunchRecipes = recipes.filter(r => r.meal_type?.includes('lunch') && r.calories > 0);
  const dinnerRecipes = recipes.filter(r => r.meal_type?.includes('dinner') && r.calories > 0);
  const snackRecipes = recipes.filter(r => r.meal_type?.includes('snack') && r.calories > 0);
  
  console.log(`Enhanced fallback recipe categories: ${breakfastRecipes.length} breakfast, ${lunchRecipes.length} lunch, ${dinnerRecipes.length} dinner, ${snackRecipes.length} snack`);
  
  // Batch cooking configuration with improved diversity
  const batchCookingEnabled = profile.batch_cooking_repetitions && profile.batch_cooking_repetitions > 1;
  const batchCookingRepetitions = profile.batch_cooking_repetitions || 1;
  const isStrictBatchCooking = batchCookingRepetitions >= 5;
  
  // Generate date range
  const dates = generateDateRange(startDate, endDate);
  const days: MealPlanDay[] = [];
  
  // Enhanced recipe selection for better diversity
  let selectedBreakfastRecipes: RecipeSummary[] = [];
  let selectedLunchRecipes: RecipeSummary[] = [];
  let selectedDinnerRecipes: RecipeSummary[] = [];
  
  if (batchCookingEnabled) {
    // Calculate optimal number of unique recipes for better variety
    const recipesPerMealType = isStrictBatchCooking ? 
      Math.max(1, Math.min(3, Math.ceil(7 / batchCookingRepetitions))) : 
      Math.max(3, Math.min(4, Math.ceil(7 / (batchCookingRepetitions - 1))));
    
    console.log(`Enhanced batch cooking: Selecting ${recipesPerMealType} diverse recipes per meal type`);
    
    selectedBreakfastRecipes = selectDiverseRecipesEnhanced(breakfastRecipes, recipesPerMealType, requirements.mealDistribution.breakfast);
    selectedLunchRecipes = selectDiverseRecipesEnhanced(lunchRecipes, recipesPerMealType, requirements.mealDistribution.lunch);
    selectedDinnerRecipes = selectDiverseRecipesEnhanced(dinnerRecipes, recipesPerMealType, requirements.mealDistribution.dinner);
    
    console.log(`Selected diverse recipes:`);
    console.log(`- Breakfast: ${selectedBreakfastRecipes.map(r => r.title).join(', ')}`);
    console.log(`- Lunch: ${selectedLunchRecipes.map(r => r.title).join(', ')}`);
    console.log(`- Dinner: ${selectedDinnerRecipes.map(r => r.title).join(', ')}`);
  }
  
  // Enhanced recipe rotation tracking
  const recipeRotationTracker = new Map<string, { count: number; lastUsed: number; mainIngredient: string }>();
  
  // Generate meals for each day with improved variety
  dates.forEach((date, dayIndex) => {
    const dayMeals: any[] = [];
    
    // Check if this is a run day
    const dayRuns = runs.filter(run => {
      const runDate = new Date(run.date).toISOString().split('T')[0];
      return runDate === date;
    });
    const isRunDay = dayRuns.length > 0;
    
    // Breakfast with enhanced selection
    const breakfastRecipe = batchCookingEnabled 
      ? selectRecipeWithEnhancedRotation(selectedBreakfastRecipes, recipeRotationTracker, dayIndex, 'breakfast')
      : selectDiverseRecipesEnhanced(breakfastRecipes, 1, requirements.mealDistribution.breakfast)[0];
      
    if (breakfastRecipe) {
      const trackingKey = `breakfast-${breakfastRecipe.id}`;
      const currentTracking = recipeRotationTracker.get(trackingKey) || { 
        count: 0, 
        lastUsed: -1, 
        mainIngredient: extractMainIngredient(breakfastRecipe) 
      };
      currentTracking.count++;
      currentTracking.lastUsed = dayIndex;
      recipeRotationTracker.set(trackingKey, currentTracking);
      
      dayMeals.push({
        meal_type: 'breakfast',
        recipe_id: breakfastRecipe.id,
        explanation: batchCookingEnabled 
          ? `${breakfastRecipe.title} (${currentTracking.count}/${batchCookingRepetitions}x batch) - efficient meal prep for ${profile.batch_cooking_people || 1} people`
          : `${breakfastRecipe.title} - nutritious breakfast with ${currentTracking.mainIngredient}`
      });
    }
    
    // Pre-run snack for run days - always diverse
    if (isRunDay && snackRecipes.length > 0) {
      const availableSnacks = snackRecipes.filter(s => s.calories <= 200);
      const preRunSnack = availableSnacks.length > 0 ? availableSnacks[dayIndex % availableSnacks.length] : snackRecipes[0];
      dayMeals.push({
        meal_type: 'pre_run_snack',
        recipe_id: preRunSnack.id,
        explanation: `Pre-run fuel: ${preRunSnack.title} provides quick energy (${preRunSnack.calories} cal)`
      });
    }
    
    // Lunch with enhanced rotation (post-run recovery when applicable)
    const lunchRecipe = batchCookingEnabled 
      ? selectRecipeWithEnhancedRotation(selectedLunchRecipes, recipeRotationTracker, dayIndex, 'lunch')
      : selectDiverseRecipesEnhanced(lunchRecipes, 1, requirements.mealDistribution.lunch)[0];
      
    if (lunchRecipe) {
      const trackingKey = `lunch-${lunchRecipe.id}`;
      const currentTracking = recipeRotationTracker.get(trackingKey) || { 
        count: 0, 
        lastUsed: -1, 
        mainIngredient: extractMainIngredient(lunchRecipe) 
      };
      currentTracking.count++;
      currentTracking.lastUsed = dayIndex;
      recipeRotationTracker.set(trackingKey, currentTracking);
      
      let lunchExplanation = batchCookingEnabled 
        ? `${lunchRecipe.title} (${currentTracking.count}/${batchCookingRepetitions}x batch) with ${currentTracking.mainIngredient}`
        : `${lunchRecipe.title} featuring ${currentTracking.mainIngredient}`;
        
      if (isRunDay) {
        lunchExplanation += ' - POST-RUN RECOVERY: Enhanced with higher protein for muscle recovery';
      }
      
      dayMeals.push({
        meal_type: 'lunch',
        recipe_id: lunchRecipe.id,
        explanation: lunchExplanation
      });
    }
    
    // Dinner with enhanced rotation
    const dinnerRecipe = batchCookingEnabled 
      ? selectRecipeWithEnhancedRotation(selectedDinnerRecipes, recipeRotationTracker, dayIndex, 'dinner')
      : selectDiverseRecipesEnhanced(dinnerRecipes, 1, requirements.mealDistribution.dinner)[0];
      
    if (dinnerRecipe) {
      const trackingKey = `dinner-${dinnerRecipe.id}`;
      const currentTracking = recipeRotationTracker.get(trackingKey) || { 
        count: 0, 
        lastUsed: -1, 
        mainIngredient: extractMainIngredient(dinnerRecipe) 
      };
      currentTracking.count++;
      currentTracking.lastUsed = dayIndex;
      recipeRotationTracker.set(trackingKey, currentTracking);
      
      dayMeals.push({
        meal_type: 'dinner',
        recipe_id: dinnerRecipe.id,
        explanation: batchCookingEnabled 
          ? `${dinnerRecipe.title} (${currentTracking.count}/${batchCookingRepetitions}x batch) - hearty dinner with ${currentTracking.mainIngredient} for ${profile.batch_cooking_people || 1} people`
          : `${dinnerRecipe.title} - satisfying dinner with ${currentTracking.mainIngredient}`
      });
    }
    
    days.push({
      date,
      meals: dayMeals
    });
  });
  
  const mealPlanMessage = batchCookingEnabled 
    ? `Enhanced fallback meal plan with ${isStrictBatchCooking ? 'strict' : 'flexible'} batch cooking (${batchCookingRepetitions}x repetitions) and maximum recipe diversity - OpenAI unavailable, using advanced recipe-based planning`
    : 'Enhanced fallback meal plan with optimized recipe diversity - OpenAI unavailable, using intelligent recipe selection';
  
  return {
    message: mealPlanMessage,
    mealPlan: {
      days
    },
    fallback: true
  };
}

function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}

function extractMainIngredient(recipe: RecipeSummary): string {
  // Use explicit main_ingredient if available
  if (recipe.main_ingredient) {
    return recipe.main_ingredient.toLowerCase();
  }
  
  // Extract from title with enhanced parsing
  const titleWords = recipe.title.toLowerCase().split(' ');
  
  // Enhanced common ingredients list
  const commonIngredients = [
    'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'turkey', 'tofu', 'tempeh',
    'beans', 'lentils', 'chickpeas', 'quinoa', 'rice', 'pasta', 'noodles',
    'potato', 'sweet potato', 'egg', 'cheese', 'avocado', 'mushroom', 'spinach'
  ];
  
  for (const ingredient of commonIngredients) {
    if (titleWords.some(word => word.includes(ingredient))) {
      return ingredient;
    }
  }
  
  // Fallback to first significant word
  const significantWords = titleWords.filter(word => 
    word.length > 3 && 
    !['with', 'and', 'the', 'for', 'mit', 'und', 'der', 'die', 'das'].includes(word)
  );
  return significantWords[0] || titleWords[0] || 'unknown';
}

function selectDiverseRecipesEnhanced(recipes: RecipeSummary[], count: number, targetCalories: number): RecipeSummary[] {
  if (recipes.length === 0) return [];
  
  // Track ingredients and cuisine diversity
  const ingredientUsage = new Map<string, number>();
  const cuisineUsage = new Map<string, number>();
  const selectedRecipes: RecipeSummary[] = [];
  
  // Score recipes with enhanced diversity metrics
  const scoredRecipes: RecipeScore[] = recipes.map(recipe => {
    const calorieScore = recipe.calories ? 
      Math.max(0, 100 - Math.abs(recipe.calories - targetCalories) / targetCalories * 100) : 50;
    
    const mainIngredient = extractMainIngredient(recipe);
    const ingredientCount = ingredientUsage.get(mainIngredient) || 0;
    const diversityPenalty = ingredientCount * 30; // Heavy penalty for ingredient repetition
    
    // Cuisine diversity bonus (extract from categories or title)
    const cuisineHints = (recipe.categories || []).concat([recipe.title]).join(' ').toLowerCase();
    let cuisineBonus = 0;
    const cuisines = ['italian', 'asian', 'mexican', 'indian', 'mediterranean', 'american', 'french', 'thai', 'chinese'];
    for (const cuisine of cuisines) {
      if (cuisineHints.includes(cuisine)) {
        const cuisineCount = cuisineUsage.get(cuisine) || 0;
        cuisineBonus = Math.max(0, 20 - cuisineCount * 5); // Bonus for cuisine diversity
        break;
      }
    }
    
    // Enhanced randomization for variety
    const randomFactor = Math.random() * 15;
    
    const totalScore = calorieScore - diversityPenalty + cuisineBonus + randomFactor;
    
    return {
      recipe,
      score: totalScore,
      diversityPenalty,
      nutritionalMatch: calorieScore,
      mainIngredient
    };
  });
  
  // Sort by score and select diverse recipes
  scoredRecipes.sort((a, b) => b.score - a.score);
  
  for (const scoredRecipe of scoredRecipes) {
    if (selectedRecipes.length >= count) break;
    
    const recipe = scoredRecipe.recipe;
    const mainIngredient = scoredRecipe.mainIngredient;
    
    selectedRecipes.push(recipe);
    ingredientUsage.set(mainIngredient, (ingredientUsage.get(mainIngredient) || 0) + 1);
    
    console.log(`Selected "${recipe.title}" (score: ${scoredRecipe.score.toFixed(1)}, ingredient: ${mainIngredient})`);
  }
  
  return selectedRecipes;
}

function selectRecipeWithEnhancedRotation(
  recipes: RecipeSummary[], 
  rotationTracker: Map<string, { count: number; lastUsed: number; mainIngredient: string }>, 
  currentDay: number, 
  mealType: string
): RecipeSummary {
  if (recipes.length === 0) return recipes[0];
  if (recipes.length === 1) return recipes[0];
  
  // Enhanced rotation logic with ingredient diversity
  const recipeOptions = recipes.map(recipe => {
    const trackingKey = `${mealType}-${recipe.id}`;
    const tracking = rotationTracker.get(trackingKey) || { count: 0, lastUsed: -1, mainIngredient: extractMainIngredient(recipe) };
    
    // Calculate rotation score based on usage and ingredient diversity
    let rotationScore = 100;
    
    // Penalize recent usage
    if (tracking.lastUsed >= 0) {
      const daysSinceLastUse = currentDay - tracking.lastUsed;
      if (daysSinceLastUse < 2) rotationScore -= 50;
      else if (daysSinceLastUse < 3) rotationScore -= 25;
    }
    
    // Penalize high usage count
    rotationScore -= tracking.count * 20;
    
    // Check ingredient diversity across all tracked recipes
    const ingredientCount = Array.from(rotationTracker.values())
      .filter(t => t.mainIngredient === tracking.mainIngredient).length;
    rotationScore -= ingredientCount * 15;
    
    // Add randomization for variety
    rotationScore += Math.random() * 10;
    
    return {
      recipe,
      rotationScore,
      tracking
    };
  });
  
  // Sort by rotation score and select best option
  recipeOptions.sort((a, b) => b.rotationScore - a.rotationScore);
  
  const selected = recipeOptions[0];
  console.log(`Enhanced rotation selected "${selected.recipe.title}" (score: ${selected.rotationScore.toFixed(1)}, ingredient: ${selected.tracking.mainIngredient})`);
  
  return selected.recipe;
}
