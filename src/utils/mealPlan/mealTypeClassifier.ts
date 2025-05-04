
// Utility for classifying recipes by meal type
import { Recipe } from '@/context/types';

// Keywords that strongly suggest a recipe is appropriate for breakfast
const BREAKFAST_KEYWORDS = [
  'breakfast', 'morning', 'cereal', 'oatmeal', 'porridge', 'pancake', 'waffle', 
  'toast', 'bagel', 'muffin', 'croissant', 'yogurt', 'granola', 'egg', 
  'omelet', 'omelette', 'frittata', 'bacon', 'sausage', 'smoothie', 'fruit',
  'pastry', 'danish', 'scone', 'biscuit', 'coffee cake', 'french toast',
  'crepe', 'hash brown', 'breakfast burrito', 'avocado toast'
];

// Keywords that strongly suggest a recipe is appropriate for lunch
const LUNCH_KEYWORDS = [
  'lunch', 'sandwich', 'wrap', 'salad', 'soup', 'bowl', 'light', 'quick', 'mid-day',
  'snack plate', 'quesadilla', 'taco', 'burger', 'quiche', 'panini', 'easy', 'simple'
];

// Keywords that strongly suggest a recipe is appropriate for dinner
const DINNER_KEYWORDS = [
  'dinner', 'supper', 'roast', 'bake', 'casserole', 'entrée', 'entree', 'meal',
  'steak', 'chicken', 'beef', 'pork', 'lamb', 'fish', 'seafood', 'pasta', 'rice dish',
  'curry', 'stew', 'hearty', 'substantial', 'main course', 'main dish'
];

// Keywords that strongly suggest a recipe is appropriate for snacks
const SNACK_KEYWORDS = [
  'snack', 'bite', 'nibble', 'appetizer', 'small plate', 'dip', 'finger food', 
  'cracker', 'nut', 'popcorn', 'chip', 'bar', 'cookie', 'trail mix', 'quick',
  'light', 'small', 'easy'
];

// Keywords that should NEVER be considered for breakfast
const NON_BREAKFAST_KEYWORDS = [
  'steak', 'roast beef', 'pork chop', 'lasagna', 'curry', 'beer', 'wine',
  'cocktail', 'whiskey', 'vodka', 'liquor', 'rum'
];

/**
 * Check if a recipe is appropriate for a specific meal type based on title, categories, and ingredients
 */
export function isSuitableForMealType(recipe: Recipe, mealType: string): boolean {
  if (!recipe) return false;
  
  const titleLower = recipe.title.toLowerCase();
  
  // For breakfast, first check if it contains any NON_BREAKFAST keywords
  if (mealType === 'breakfast' && NON_BREAKFAST_KEYWORDS.some(keyword => titleLower.includes(keyword))) {
    return false;
  }
  
  // Check if title explicitly contains meal type
  if (titleLower.includes(mealType.toLowerCase())) {
    return true;
  }
  
  // Select appropriate keywords based on meal type
  let relevantKeywords: string[] = [];
  switch (mealType) {
    case 'breakfast':
      relevantKeywords = BREAKFAST_KEYWORDS;
      break;
    case 'lunch':
      relevantKeywords = LUNCH_KEYWORDS;
      break;
    case 'dinner':
      relevantKeywords = DINNER_KEYWORDS;
      break;
    case 'snack':
      relevantKeywords = SNACK_KEYWORDS;
      break;
    default:
      return true; // If unknown meal type, don't filter
  }
  
  // Check title against relevant keywords
  if (relevantKeywords.some(keyword => titleLower.includes(keyword))) {
    return true;
  }
  
  // Check categories against relevant keywords
  if (recipe.categories) {
    if (recipe.categories.some(category => 
      category.toLowerCase().includes(mealType.toLowerCase()) || 
      relevantKeywords.some(keyword => category.toLowerCase().includes(keyword))
    )) {
      return true;
    }
  }
  
  // If mealType is breakfast, add additional special checks
  if (mealType === 'breakfast') {
    // Breakfast typically has fewer calories
    if (recipe.calories < 500) {
      // Check for typical breakfast ingredients
      if (recipe.ingredients && recipe.ingredients.some(ingredient => 
        ['egg', 'toast', 'cereal', 'milk', 'yogurt', 'oat', 'berr', 'fruit'].some(item => 
          ingredient.toLowerCase().includes(item)
        )
      )) {
        return true;
      }
    }
  }
  
  // If we have no strong signals, use some heuristics
  if (mealType === 'breakfast') {
    // Avoid heavy dinner-like foods for breakfast
    return !DINNER_KEYWORDS.some(keyword => titleLower.includes(keyword));
  }
  
  if (mealType === 'dinner') {
    // Dinner tends to be more substantial
    return recipe.calories >= 400;
  }
  
  // Default to true for lunch and snack if no strong signals either way
  return (mealType === 'lunch' || mealType === 'snack');
}

/**
 * Get the most appropriate recipes for a specific meal type
 */
export function getRecipesForMealType(recipes: Recipe[], mealType: string): Recipe[] {
  // First, filter for recipes that are suitable for this meal type
  const suitableRecipes = recipes.filter(recipe => isSuitableForMealType(recipe, mealType));
  
  // If we have enough suitable recipes, return those
  if (suitableRecipes.length >= 10) {
    return suitableRecipes;
  }
  
  // If we don't have enough suitable recipes, return all recipes
  // This is a fallback to ensure we always have recipes to choose from
  console.log(`Not enough recipes classified for ${mealType} (${suitableRecipes.length}), using all recipes`);
  return recipes;
}

/**
 * Assign a suitability score for each meal type to a recipe
 * Higher score means more suitable
 */
export function getMealTypeSuitabilityScores(recipe: Recipe): Record<string, number> {
  const scores: Record<string, number> = {
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    snack: 0
  };
  
  const title = recipe.title.toLowerCase();
  
  // First check for non-breakfast items
  if (NON_BREAKFAST_KEYWORDS.some(keyword => title.includes(keyword.toLowerCase()))) {
    scores.breakfast -= 100; // Strong negative signal for breakfast
  }
  
  // Check title against meal type keywords
  BREAKFAST_KEYWORDS.forEach(keyword => {
    if (title.includes(keyword.toLowerCase())) scores.breakfast += 1;
  });
  
  LUNCH_KEYWORDS.forEach(keyword => {
    if (title.includes(keyword.toLowerCase())) scores.lunch += 1;
  });
  
  DINNER_KEYWORDS.forEach(keyword => {
    if (title.includes(keyword.toLowerCase())) scores.dinner += 1;
  });
  
  SNACK_KEYWORDS.forEach(keyword => {
    if (title.includes(keyword.toLowerCase())) scores.snack += 1;
  });
  
  // Check categories
  if (recipe.categories) {
    recipe.categories.forEach(category => {
      const categoryLower = category.toLowerCase();
      
      if (categoryLower.includes('breakfast')) scores.breakfast += 2;
      if (categoryLower.includes('lunch')) scores.lunch += 2;
      if (categoryLower.includes('dinner')) scores.dinner += 2;
      if (categoryLower.includes('snack')) scores.snack += 2;
      
      BREAKFAST_KEYWORDS.forEach(keyword => {
        if (categoryLower.includes(keyword.toLowerCase())) scores.breakfast += 1;
      });
      
      LUNCH_KEYWORDS.forEach(keyword => {
        if (categoryLower.includes(keyword.toLowerCase())) scores.lunch += 1;
      });
      
      DINNER_KEYWORDS.forEach(keyword => {
        if (categoryLower.includes(keyword.toLowerCase())) scores.dinner += 1;
      });
      
      SNACK_KEYWORDS.forEach(keyword => {
        if (categoryLower.includes(keyword.toLowerCase())) scores.snack += 1;
      });
    });
  }
  
  // Check ingredients for breakfast items
  if (recipe.ingredients) {
    const breakfastIngredients = ['egg', 'bread', 'toast', 'cereal', 'milk', 'yogurt', 'oat', 'berry', 'fruit', 'jam', 'honey'];
    const dinnerIngredients = ['steak', 'roast', 'wine', 'beer', 'potato', 'pasta', 'rice'];
    
    breakfastIngredients.forEach(item => {
      if (recipe.ingredients!.some(ingredient => ingredient.toLowerCase().includes(item))) {
        scores.breakfast += 1;
      }
    });
    
    dinnerIngredients.forEach(item => {
      if (recipe.ingredients!.some(ingredient => ingredient.toLowerCase().includes(item))) {
        scores.dinner += 1;
        // Dinner ingredients generally make a recipe less suitable for breakfast
        scores.breakfast -= 0.5;
      }
    });
  }
  
  // Apply some calorie heuristics
  if (recipe.calories < 400) {
    scores.breakfast += 1;
    scores.snack += 2;
    scores.dinner -= 1;
  } else if (recipe.calories > 600) {
    scores.dinner += 1;
    scores.breakfast -= 1;
    scores.snack -= 2;
  } else {
    scores.lunch += 1; // Medium calorie meals are good for lunch
  }
  
  return scores;
}

