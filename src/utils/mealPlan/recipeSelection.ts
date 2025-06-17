
// Enhanced recipe selection with diversity tracking
import { Recipe } from '@/context/types';
import { filterSeasonallyAppropriateRecipes } from './seasonalFiltering';

export interface RecipeUsageTracker {
  recipeId: string;
  usageCount: number;
  lastUsedDay: number;
  mealType: string; // Track which meal type used this recipe
}

export class RecipeDiversityManager {
  private mainMealUsageTracker: Map<string, RecipeUsageTracker> = new Map();
  private snackUsageTracker: Map<string, RecipeUsageTracker> = new Map();
  private ingredientUsageTracker: Map<string, number> = new Map(); // Track main ingredient usage
  private currentDay: number = 0;
  private batchCookingMode: boolean = false;
  private batchCookingRepetitions: number = 1;
  private strictBatchCooking: boolean = false;

  // Configure batch cooking settings
  configureBatchCooking(repetitions: number, enabled: boolean = true) {
    this.batchCookingMode = enabled && repetitions > 1;
    this.batchCookingRepetitions = repetitions;
    this.strictBatchCooking = repetitions >= 5;
    
    console.log(`Batch cooking configured: ${this.batchCookingMode ? 'enabled' : 'disabled'}, repetitions: ${repetitions}, strict: ${this.strictBatchCooking}`);
  }

  // Reset for a new meal plan generation
  reset() {
    this.mainMealUsageTracker.clear();
    this.snackUsageTracker.clear();
    this.ingredientUsageTracker.clear();
    this.currentDay = 0;
  }

  // Advance to the next day
  nextDay() {
    this.currentDay++;
  }

  // Get recipes suitable for a specific meal type with seasonal filtering
  getRecipesForMealType(recipes: Recipe[], mealType: 'breakfast' | 'lunch' | 'dinner'): Recipe[] {
    console.log(`Getting recipes for ${mealType} on day ${this.currentDay}`);
    
    // First apply seasonal filtering
    const seasonallyFiltered = filterSeasonallyAppropriateRecipes(recipes);
    console.log(`After seasonal filtering: ${seasonallyFiltered.length} recipes`);

    // Filter by meal type using the meal_type field
    const mealTypeFiltered = seasonallyFiltered.filter(recipe => {
      // Check if recipe has meal_type field and it's an array
      if (recipe.meal_type && Array.isArray(recipe.meal_type)) {
        return recipe.meal_type.includes(mealType);
      }
      
      // Check if recipe has meal_type field and it's a string (legacy support)
      if (recipe.meal_type && typeof recipe.meal_type === 'string') {
        return recipe.meal_type === mealType;
      }
      
      // Fallback to keyword-based filtering
      return this.matchesMealTypeByKeywords(recipe, mealType);
    });

    console.log(`After meal type filtering: ${mealTypeFiltered.length} recipes for ${mealType}`);
    return mealTypeFiltered;
  }

  // Fallback keyword matching for recipes without meal_type classification
  private matchesMealTypeByKeywords(recipe: Recipe, mealType: string): boolean {
    const title = recipe.title.toLowerCase();
    const ingredients = (recipe.ingredients || []).join(' ').toLowerCase();
    const categories = (recipe.categories || []).join(' ').toLowerCase();
    const searchText = `${title} ${ingredients} ${categories}`;

    const breakfastKeywords = ['oatmeal', 'pancake', 'waffle', 'cereal', 'yogurt', 'granola', 'toast', 'egg', 'omelet', 'smoothie', 'muesli', 'breakfast'];
    const lunchKeywords = ['salad', 'sandwich', 'wrap', 'soup', 'bowl', 'quinoa', 'rice bowl', 'lunch', 'light', 'gazpacho'];
    const dinnerKeywords = ['roast', 'stew', 'casserole', 'pasta', 'risotto', 'curry', 'braised', 'grilled', 'baked', 'dinner', 'hearty'];

    switch (mealType) {
      case 'breakfast':
        return breakfastKeywords.some(keyword => searchText.includes(keyword));
      case 'lunch':
        return lunchKeywords.some(keyword => searchText.includes(keyword));
      case 'dinner':
        return dinnerKeywords.some(keyword => searchText.includes(keyword));
      default:
        return false;
    }
  }

  // Extract main ingredient from recipe for diversity tracking
  private extractMainIngredient(recipe: Recipe): string {
    // Use explicit main_ingredient if available
    if (recipe.main_ingredient) {
      return recipe.main_ingredient.toLowerCase();
    }
    
    // Extract from title as fallback
    const titleWords = recipe.title.toLowerCase().split(' ');
    
    // Common main ingredients to prioritize in title parsing
    const commonIngredients = ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'turkey', 'tofu', 'beans', 'lentils', 'rice', 'pasta', 'potato', 'sweet potato', 'quinoa', 'egg'];
    
    for (const ingredient of commonIngredients) {
      if (titleWords.some(word => word.includes(ingredient))) {
        return ingredient;
      }
    }
    
    // Fallback to first significant word
    const significantWords = titleWords.filter(word => word.length > 3 && !['with', 'and', 'the', 'for'].includes(word));
    return significantWords[0] || titleWords[0] || 'unknown';
  }

  // Select a recipe with enhanced diversity considerations and batch cooking logic
  selectRecipeWithDiversity(
    availableRecipes: Recipe[],
    targetCalories: number,
    proteinTarget: number,
    mealType?: string
  ): Recipe | null {
    if (availableRecipes.length === 0) return null;

    const isSnack = mealType === 'pre_run_snack' || mealType === 'post_run_snack';
    const usageTracker = isSnack ? this.snackUsageTracker : this.mainMealUsageTracker;

    // Score recipes based on nutritional match, diversity, and batch cooking logic
    const scoredRecipes = availableRecipes.map(recipe => {
      const usage = usageTracker.get(recipe.id);
      const mainIngredient = this.extractMainIngredient(recipe);
      const ingredientUsage = this.ingredientUsageTracker.get(mainIngredient) || 0;
      
      // Nutritional scoring
      const calorieScore = recipe.calories ? 
        Math.max(0, 100 - Math.abs(recipe.calories - targetCalories) / targetCalories * 100) : 0;
      const proteinScore = recipe.protein ? 
        Math.max(0, 100 - Math.abs(recipe.protein - proteinTarget) / proteinTarget * 100) : 0;
      const nutritionalScore = (calorieScore + proteinScore) / 2;

      // Enhanced diversity scoring with ingredient tracking
      let diversityScore = 100;
      
      // Penalize ingredient repetition
      diversityScore -= ingredientUsage * 30; // Heavy penalty for same ingredients
      
      // Batch cooking vs diversity scoring
      let repetitionScore = 100;
      if (usage) {
        if (this.batchCookingMode && !isSnack) {
          // In batch cooking mode, ENCOURAGE repetition for main meals, but limit variety
          if (this.strictBatchCooking) {
            // Strict mode: heavily reward recipes that can reach exact repetition target
            const targetUsage = this.batchCookingRepetitions;
            if (usage.usageCount < targetUsage) {
              repetitionScore += (targetUsage - usage.usageCount) * 50; // Strong reward for reaching target
            } else if (usage.usageCount === targetUsage) {
              repetitionScore -= 200; // Stop using once target reached
            }
          } else {
            // Flexible mode: moderate reward for repetition within range, but allow some variety
            if (usage.usageCount < this.batchCookingRepetitions) {
              repetitionScore += 20; // Moderate reward
            } else if (usage.usageCount >= this.batchCookingRepetitions) {
              repetitionScore -= 80; // Discourage excessive repetition
            }
          }
        } else {
          // Regular diversity mode: penalize repetition
          repetitionScore -= usage.usageCount * 25;
          
          // Extra penalty if used recently
          const daysSinceLastUse = this.currentDay - usage.lastUsedDay;
          if (daysSinceLastUse < 2) {
            repetitionScore -= 50;
          } else if (daysSinceLastUse < 4) {
            repetitionScore -= 25;
          }
        }
      } else if (this.batchCookingMode && !isSnack) {
        // In batch cooking mode, give new recipes a bonus to start repetition chains
        repetitionScore += 30;
      }

      // Seasonal score boost (if available)
      const seasonalScore = (recipe as any).seasonalScore || 5;
      const seasonalBonus = (seasonalScore - 5) * 10;

      // Add randomization for variety
      const randomFactor = Math.random() * 15;

      const totalScore = (nutritionalScore * 0.3) + (diversityScore * 0.3) + (repetitionScore * 0.3) + (seasonalBonus * 0.05) + (randomFactor * 0.05);
      
      return { 
        recipe, 
        score: totalScore, 
        nutritionalScore, 
        diversityScore, 
        repetitionScore, 
        seasonalScore, 
        usage: usage?.usageCount || 0,
        mainIngredient
      };
    });

    // Sort by total score
    scoredRecipes.sort((a, b) => b.score - a.score);

    // In strict batch cooking mode, be more selective but allow some variety
    const selectionPoolSize = this.strictBatchCooking && !isSnack ? 
      Math.min(5, scoredRecipes.length) : 
      Math.min(15, scoredRecipes.length);
    
    const topRecipes = scoredRecipes.slice(0, selectionPoolSize);
    const selectedRecipe = topRecipes[Math.floor(Math.random() * topRecipes.length)];

    if (selectedRecipe) {
      // Track usage
      const usage = usageTracker.get(selectedRecipe.recipe.id) || {
        recipeId: selectedRecipe.recipe.id,
        usageCount: 0,
        lastUsedDay: -1,
        mealType: mealType || 'unknown'
      };
      
      usage.usageCount++;
      usage.lastUsedDay = this.currentDay;
      if (mealType) usage.mealType = mealType;
      usageTracker.set(selectedRecipe.recipe.id, usage);

      // Track ingredient usage
      const mainIngredient = selectedRecipe.mainIngredient;
      this.ingredientUsageTracker.set(mainIngredient, (this.ingredientUsageTracker.get(mainIngredient) || 0) + 1);

      const batchInfo = this.batchCookingMode && !isSnack ? 
        ` [batch ${usage.usageCount}/${this.batchCookingRepetitions}, ${mainIngredient}]` : 
        ` [${mainIngredient}]`;
      
      console.log(`Selected "${selectedRecipe.recipe.title}"${batchInfo} (score: ${selectedRecipe.score.toFixed(1)}, nutritional: ${selectedRecipe.nutritionalScore.toFixed(1)}, diversity: ${selectedRecipe.diversityScore.toFixed(1)}, repetition: ${selectedRecipe.repetitionScore.toFixed(1)})`);
    }

    return selectedRecipe?.recipe || null;
  }

  // Get usage statistics for reporting
  getUsageStats() {
    const mainMealStats = Array.from(this.mainMealUsageTracker.values()).map(usage => ({
      recipeId: usage.recipeId,
      usageCount: usage.usageCount,
      mealType: usage.mealType
    }));

    const snackStats = Array.from(this.snackUsageTracker.values()).map(usage => ({
      recipeId: usage.recipeId,
      usageCount: usage.usageCount,
      mealType: usage.mealType
    }));

    const ingredientStats = Array.from(this.ingredientUsageTracker.entries()).map(([ingredient, count]) => ({
      ingredient,
      count
    }));

    return { mainMeals: mainMealStats, snacks: snackStats, ingredients: ingredientStats };
  }
}
