// Functions for generating meal plan items
import { UserProfile, MealPlanItem } from '@/types/profile';
import { Recipe } from '@/context/types';
import { filterRecipesByPreferences, prioritizeRecipes, getContextForMeal } from './recipeUtils';
import { calculateDailyRequirements, getGenericRequirements } from './requirements';

// Helper function to get recipes suitable for a specific meal type using the meal_type field
function getRecipesForMealType(recipes: Recipe[], mealType: 'breakfast' | 'lunch' | 'dinner'): Recipe[] {
  console.log(`Filtering ${recipes.length} recipes for meal type: ${mealType}`);
  
  // First, try to filter by the actual meal_type field from the database
  const mealTypeFilteredRecipes = recipes.filter(recipe => {
    // Check if recipe has meal_type field and it's an array
    if (recipe.meal_type && Array.isArray(recipe.meal_type)) {
      const hasMealType = recipe.meal_type.includes(mealType);
      if (hasMealType) {
        console.log(`Recipe "${recipe.title}" matches meal type "${mealType}" via meal_type field`);
      }
      return hasMealType;
    }
    
    // Check if recipe has meal_type field and it's a string (legacy support)
    if (recipe.meal_type && typeof recipe.meal_type === 'string') {
      const hasMealType = recipe.meal_type === mealType;
      if (hasMealType) {
        console.log(`Recipe "${recipe.title}" matches meal type "${mealType}" via meal_type string`);
      }
      return hasMealType;
    }
    
    return false;
  });
  
  // If we have recipes with proper meal_type classification, use those
  if (mealTypeFilteredRecipes.length > 0) {
    console.log(`Found ${mealTypeFilteredRecipes.length} recipes with proper meal_type classification for ${mealType}`);
    return mealTypeFilteredRecipes;
  }
  
  // Fallback to keyword-based filtering for recipes without meal_type classification
  console.log(`No recipes found with meal_type field for ${mealType}, falling back to keyword matching`);
  
  // Keywords that indicate breakfast foods
  const breakfastKeywords = [
    'oatmeal', 'pancake', 'waffle', 'cereal', 'yogurt', 'granola', 'toast', 'egg', 'omelet', 'frittata',
    'smoothie', 'muesli', 'croissant', 'bagel', 'muffin', 'breakfast', 'porridge', 'bircher'
  ];
  
  // Keywords that indicate lunch foods
  const lunchKeywords = [
    'salad', 'sandwich', 'wrap', 'soup', 'bowl', 'quinoa', 'rice bowl', 'lunch', 'light',
    'gazpacho', 'bruschetta', 'tapas', 'mezze', 'poke', 'grain bowl'
  ];
  
  // Keywords that indicate dinner foods
  const dinnerKeywords = [
    'roast', 'stew', 'casserole', 'pasta', 'risotto', 'curry', 'braised', 'grilled', 'baked',
    'dinner', 'main course', 'hearty', 'paella', 'lasagna', 'tagine', 'schnitzel', 'pot roast'
  ];
  
  const keywordFilteredRecipes = recipes.filter(recipe => {
    const title = recipe.title.toLowerCase();
    const ingredients = (recipe.ingredients || []).join(' ').toLowerCase();
    const categories = (recipe.categories || []).join(' ').toLowerCase();
    const searchText = `${title} ${ingredients} ${categories}`;
    
    switch (mealType) {
      case 'breakfast':
        const isBreakfast = breakfastKeywords.some(keyword => searchText.includes(keyword));
        const notLunchOrDinner = !lunchKeywords.some(keyword => searchText.includes(keyword)) && 
                                !dinnerKeywords.some(keyword => searchText.includes(keyword));
        return isBreakfast || (notLunchOrDinner && recipe.calories && recipe.calories < 600);
        
      case 'lunch':
        const isLunch = lunchKeywords.some(keyword => searchText.includes(keyword));
        const notBreakfastOrDinner = !breakfastKeywords.some(keyword => searchText.includes(keyword)) && 
                                    !dinnerKeywords.some(keyword => searchText.includes(keyword));
        return isLunch || (notBreakfastOrDinner && recipe.calories && recipe.calories >= 400 && recipe.calories <= 800);
        
      case 'dinner':
        const isDinner = dinnerKeywords.some(keyword => searchText.includes(keyword));
        const notBreakfastOrLunch = !breakfastKeywords.some(keyword => searchText.includes(keyword)) && 
                                   !lunchKeywords.some(keyword => searchText.includes(keyword));
        return isDinner || (notBreakfastOrLunch && recipe.calories && recipe.calories > 500);
        
      default:
        return true;
    }
  });
  
  console.log(`Found ${keywordFilteredRecipes.length} recipes using keyword matching for ${mealType}`);
  return keywordFilteredRecipes;
}

// Enhanced random recipe selection with meal type awareness
function getRandomRecipeForMealType(
  recipes: Recipe[], 
  mealType: 'breakfast' | 'lunch' | 'dinner',
  targetCalories: number, 
  proteinTarget: number, 
  usedRecipeIds: string[]
): Recipe | null {
  // First filter by meal type
  const mealTypeRecipes = getRecipesForMealType(recipes, mealType);
  
  // Filter out already used recipes
  const availableRecipes = mealTypeRecipes.filter(recipe => !usedRecipeIds.includes(recipe.id));
  
  if (availableRecipes.length === 0) {
    console.warn(`No available recipes for ${mealType}, falling back to all recipes`);
    // Fallback to all recipes if no meal-type specific recipes available
    const fallbackRecipes = recipes.filter(recipe => !usedRecipeIds.includes(recipe.id));
    return fallbackRecipes.length > 0 ? fallbackRecipes[Math.floor(Math.random() * fallbackRecipes.length)] : null;
  }
  
  // Score recipes based on how well they match the targets
  const scoredRecipes = availableRecipes.map(recipe => {
    const calorieScore = recipe.calories ? Math.max(0, 100 - Math.abs(recipe.calories - targetCalories) / targetCalories * 100) : 0;
    const proteinScore = recipe.protein ? Math.max(0, 100 - Math.abs(recipe.protein - proteinTarget) / proteinTarget * 100) : 0;
    const totalScore = (calorieScore + proteinScore) / 2;
    
    return { recipe, score: totalScore };
  });
  
  // Sort by score and pick from top 3 to add some variety
  scoredRecipes.sort((a, b) => b.score - a.score);
  const topRecipes = scoredRecipes.slice(0, Math.min(3, scoredRecipes.length));
  const selectedRecipe = topRecipes[Math.floor(Math.random() * topRecipes.length)];
  
  console.log(`Selected ${selectedRecipe.recipe.title} for ${mealType} (score: ${selectedRecipe.score.toFixed(1)})`);
  return selectedRecipe.recipe;
}

// Helper function to generate meal plan items
export function generateMealPlanItems(
  mealPlanId: string,
  profile: UserProfile,
  recipes: Recipe[],
  startDate: string,
  endDate: string
): Partial<MealPlanItem>[] {
  console.log(`Generating meal plan items with ${recipes.length} recipes`);
  const mealPlanItems: Partial<MealPlanItem>[] = [];
  
  // Calculate how many days we need to plan for
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

  // Filter and prioritize recipes based on user preferences
  let filteredRecipes = filterRecipesByPreferences(recipes, profile);
  let prioritizedRecipes = prioritizeRecipes(filteredRecipes, profile);

  console.log(`Using ${prioritizedRecipes.length} filtered and prioritized recipes`);

  // Get nutritional requirements
  const requirements = calculateDailyRequirements(profile);
  
  if (!requirements) {
    return generateGenericMealPlanItems(mealPlanId, prioritizedRecipes, start, dayCount);
  }

  return generatePersonalizedMealPlanItems(mealPlanId, profile, prioritizedRecipes, start, dayCount, requirements);
}

// Generate generic meal plan items when no profile requirements are available
function generateGenericMealPlanItems(
  mealPlanId: string,
  prioritizedRecipes: Recipe[],
  startDate: Date,
  dayCount: number
): Partial<MealPlanItem>[] {
  console.log('Generating generic meal plan items');
  const mealPlanItems: Partial<MealPlanItem>[] = [];
  const genericRequirements = getGenericRequirements();
  
  for (let day = 0; day < dayCount; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const usedRecipeIds: string[] = [];
    
    // Add breakfast
    const breakfast = getRandomRecipeForMealType(
      prioritizedRecipes, 
      'breakfast',
      genericRequirements.mealDistribution.breakfast, 
      genericRequirements.proteinGrams * 0.25, 
      usedRecipeIds
    );
    if (breakfast) {
      usedRecipeIds.push(breakfast.id);
      mealPlanItems.push({
        id: crypto.randomUUID(),
        meal_plan_id: mealPlanId,
        recipe_id: breakfast.id,
        date: dateStr,
        meal_type: "breakfast",
        nutritional_context: "A balanced breakfast to start your day",
        calories: breakfast.calories,
        protein: breakfast.protein,
        carbs: breakfast.carbs,
        fat: breakfast.fat
      });
    }
    
    // Add lunch
    const lunch = getRandomRecipeForMealType(
      prioritizedRecipes, 
      'lunch',
      genericRequirements.mealDistribution.lunch, 
      genericRequirements.proteinGrams * 0.40, 
      usedRecipeIds
    );
    if (lunch) {
      usedRecipeIds.push(lunch.id);
      mealPlanItems.push({
        id: crypto.randomUUID(),
        meal_plan_id: mealPlanId,
        recipe_id: lunch.id,
        date: dateStr,
        meal_type: "lunch",
        nutritional_context: "A satisfying lunch with good protein content",
        calories: lunch.calories,
        protein: lunch.protein,
        carbs: lunch.carbs,
        fat: lunch.fat
      });
    }
    
    // Add dinner
    const dinner = getRandomRecipeForMealType(
      prioritizedRecipes, 
      'dinner',
      genericRequirements.mealDistribution.dinner, 
      genericRequirements.proteinGrams * 0.35, 
      usedRecipeIds
    );
    if (dinner) {
      usedRecipeIds.push(dinner.id);
      mealPlanItems.push({
        id: crypto.randomUUID(),
        meal_plan_id: mealPlanId,
        recipe_id: dinner.id,
        date: dateStr,
        meal_type: "dinner",
        nutritional_context: "A nutritious dinner to end your day",
        calories: dinner.calories,
        protein: dinner.protein,
        carbs: dinner.carbs,
        fat: dinner.fat
      });
    }
  }
  
  console.log(`Generated ${mealPlanItems.length} meal plan items`);
  return mealPlanItems;
}

// Generate personalized meal plan items based on calculated requirements
function generatePersonalizedMealPlanItems(
  mealPlanId: string,
  profile: UserProfile,
  prioritizedRecipes: Recipe[],
  startDate: Date,
  dayCount: number,
  requirements: any
): Partial<MealPlanItem>[] {
  console.log('Generating personalized meal plan items');
  const mealPlanItems: Partial<MealPlanItem>[] = [];
  
  for (let day = 0; day < dayCount; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const usedRecipeIds: string[] = [];
    
    // Add breakfast
    const breakfast = getRandomRecipeForMealType(
      prioritizedRecipes, 
      'breakfast',
      requirements.mealDistribution.breakfast, 
      requirements.proteinGrams * 0.25, 
      usedRecipeIds
    );
    if (breakfast) {
      usedRecipeIds.push(breakfast.id);
      mealPlanItems.push({
        id: crypto.randomUUID(),
        meal_plan_id: mealPlanId,
        recipe_id: breakfast.id,
        date: dateStr,
        meal_type: "breakfast",
        nutritional_context: getContextForMeal('breakfast', breakfast, profile),
        calories: breakfast.calories,
        protein: breakfast.protein,
        carbs: breakfast.carbs,
        fat: breakfast.fat
      });
    }
    
    // Add lunch
    const lunch = getRandomRecipeForMealType(
      prioritizedRecipes, 
      'lunch',
      requirements.mealDistribution.lunch, 
      requirements.proteinGrams * 0.40, 
      usedRecipeIds
    );
    if (lunch) {
      usedRecipeIds.push(lunch.id);
      mealPlanItems.push({
        id: crypto.randomUUID(),
        meal_plan_id: mealPlanId,
        recipe_id: lunch.id,
        date: dateStr,
        meal_type: "lunch",
        nutritional_context: getContextForMeal('lunch', lunch, profile),
        calories: lunch.calories,
        protein: lunch.protein,
        carbs: lunch.carbs,
        fat: lunch.fat
      });
    }
    
    // Add dinner
    const dinner = getRandomRecipeForMealType(
      prioritizedRecipes, 
      'dinner',
      requirements.mealDistribution.dinner, 
      requirements.proteinGrams * 0.35, 
      usedRecipeIds
    );
    if (dinner) {
      usedRecipeIds.push(dinner.id);
      mealPlanItems.push({
        id: crypto.randomUUID(),
        meal_plan_id: mealPlanId,
        recipe_id: dinner.id,
        date: dateStr,
        meal_type: "dinner",
        nutritional_context: getContextForMeal('dinner', dinner, profile),
        calories: dinner.calories,
        protein: dinner.protein,
        carbs: dinner.carbs,
        fat: dinner.fat
      });
    }
  }
  
  console.log(`Generated ${mealPlanItems.length} personalized meal plan items`);
  return mealPlanItems;
}
