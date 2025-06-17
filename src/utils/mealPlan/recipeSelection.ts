
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

  // Enhanced main ingredient extraction with better fallbacks
  private extractMainIngredient(recipe: Recipe): string {
    // Use explicit main_ingredient if available
    if (recipe.main_ingredient) {
      return recipe.main_ingredient.toLowerCase();
    }
    
    // Extract from title with enhanced parsing
    const titleWords = recipe.title.toLowerCase().split(' ');
    
    // Enhanced common ingredients to prioritize in title parsing
    const commonIngredients = [
      'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'turkey', 'tofu', 'tempeh',
      'beans', 'lentils', 'chickpeas', 'quinoa', 'rice', 'pasta', 'noodles',
      'potato', 'sweet potato', 'egg', 'cheese', 'avocado', 'mushroom', 'spinach',
      'tomato', 'broccoli', 'carrot', 'onion', 'garlic', 'ginger'
    ];
    
    for (const ingredient of commonIngredients) {
      if (titleWords.some(word => word.includes(ingredient))) {
        return ingredient;
      }
    }
    
    // Enhanced fallback to first significant word (excluding common non-ingredient words)
    const excludeWords = ['with', 'and', 'the', 'for', 'mit', 'und', 'der', 'die', 'das', 'in', 'on', 'at'];
    const significantWords = titleWords.filter(word => 
      word.length > 3 && !excludeWords.includes(word)
    );
    return significantWords[0] || titleWords[0] || 'unknown';
  }

  // Enhanced recipe selection with improved diversity and batch cooking logic
  selectRecipeWithDiversity(
    availableRecipes: Recipe[],
    targetCalories: number,
    proteinTarget: number,
    mealType?: string
  ): Recipe | null {
    if (availableRecipes.length === 0) return null;

    const isSnack = mealType === 'pre_run_snack' || mealType === 'post_run_snack';
    const usageTracker = isSnack ? this.snackUsageTracker : this.mainMealUsageTracker;

    // Enhanced scoring with improved diversity and nutritional matching
    const scoredRecipes = availableRecipes.map(recipe => {
      const usage = usageTracker.get(recipe.id);
      const mainIngredient = this.extractMainIngredient(recipe);
      const ingredientUsage = this.ingredientUsageTracker.get(mainIngredient) || 0;
      
      // Enhanced nutritional scoring
      const calorieScore = recipe.calories ? 
        Math.max(0, 100 - Math.abs(recipe.calories - targetCalories) / targetCalories * 100) : 50;
      const proteinScore = recipe.protein ? 
        Math.max(0, 100 - Math.abs(recipe.protein - proteinTarget) / proteinTarget * 100) : 50;
      const nutritionalScore = (calorieScore * 0.7) + (proteinScore * 0.3); // Weight calories more heavily
      
      // Enhanced diversity scoring with ingredient and cuisine tracking
      let diversityScore = 100;
      
      // Heavy penalty for ingredient repetition (enhanced)
      diversityScore -= ingredientUsage * 35;
      
      // Cuisine diversity bonus
      const cuisineHints = (recipe.categories || []).concat([recipe.title]).join(' ').toLowerCase();
      const cuisines = ['italian', 'asian', 'mexican', 'indian', 'mediterranean', 'american', 'french'];
      let cuisineBonus = 0;
      for (const cuisine of cuisines) {
        if (cuisineHints.includes(cuisine)) {
          cuisineBonus = 10; // Small bonus for identifiable cuisine
          break;
        }
      }
      
      // Enhanced batch cooking vs diversity scoring
      let repetitionScore = 100;
      if (usage) {
        if (this.batchCookingMode && !isSnack) {
          // Enhanced batch cooking logic
          if (this.strictBatchCooking) {
            // Strict mode: precisely target exact repetitions
            const targetUsage = this.batchCookingRepetitions;
            if (usage.usageCount < targetUsage) {
              repetitionScore += (targetUsage - usage.usageCount) * 60; // Stronger reward for reaching target
            } else if (usage.usageCount === targetUsage) {
              repetitionScore -= 300; // Strong signal to stop using once target reached
            }
          } else {
            // Flexible mode: allow 2-4 repetitions with intelligent variation
            const minReps = Math.max(2, this.batchCookingRepetitions - 1);
            const maxReps = this.batchCookingRepetitions + 1;
            
            if (usage.usageCount < minReps) {
              repetitionScore += 30; // Encourage reaching minimum
            } else if (usage.usageCount <= maxReps) {
              repetitionScore += 10; // Maintain within target range
            } else {
              repetitionScore -= 100; // Discourage excessive repetition
            }
          }
        } else {
          // Regular diversity mode: enhanced penalties for repetition
          repetitionScore -= usage.usageCount * 30;
          
          // Enhanced recent usage penalty
          const daysSinceLastUse = this.currentDay - usage.lastUsedDay;
          if (daysSinceLastUse < 2) {
            repetitionScore -= 60;
          } else if (daysSinceLastUse < 3) {
            repetitionScore -= 30;
          } else if (daysSinceLastUse < 4) {
            repetitionScore -= 15;
          }
        }
      } else if (this.batchCookingMode && !isSnack) {
        // Enhanced bonus for new recipes in batch cooking mode
        repetitionScore += 40;
      }

      // Seasonal score integration (if available)
      const seasonalScore = (recipe as any).seasonalScore || 5;
      const seasonalBonus = (seasonalScore - 5) * 12;

      // Enhanced randomization for variety while maintaining consistency
      const randomFactor = Math.random() * 12;

      const totalScore = (nutritionalScore * 0.35) + (diversityScore * 0.3) + (repetitionScore * 0.25) + (seasonalBonus * 0.05) + (cuisineBonus * 0.02) + (randomFactor * 0.03);
      
      return { 
        recipe, 
        score: totalScore, 
        nutritionalScore, 
        diversityScore, 
        repetitionScore, 
        seasonalScore, 
        usage: usage?.usageCount || 0,
        mainIngredient,
        cuisineBonus
      };
    });

    // Sort by total score
    scoredRecipes.sort((a, b) => b.score - a.score);

    // Enhanced selection pool sizing
    const selectionPoolSize = this.strictBatchCooking && !isSnack ? 
      Math.min(3, scoredRecipes.length) : 
      Math.min(10, scoredRecipes.length);
    
    const topRecipes = scoredRecipes.slice(0, selectionPoolSize);
    const selectedRecipe = topRecipes[Math.floor(Math.random() * topRecipes.length)];

    if (selectedRecipe) {
      // Enhanced usage tracking
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

      // Enhanced ingredient usage tracking
      const mainIngredient = selectedRecipe.mainIngredient;
      this.ingredientUsageTracker.set(mainIngredient, (this.ingredientUsageTracker.get(mainIngredient) || 0) + 1);

      const batchInfo = this.batchCookingMode && !isSnack ? 
        ` [batch ${usage.usageCount}/${this.batchCookingRepetitions}, ${mainIngredient}]` : 
        ` [${mainIngredient}]`;
      
      console.log(`Selected "${selectedRecipe.recipe.title}"${batchInfo} (score: ${selectedRecipe.score.toFixed(1)}, nutritional: ${selectedRecipe.nutritionalScore.toFixed(1)}, diversity: ${selectedRecipe.diversityScore.toFixed(1)}, repetition: ${selectedRecipe.repetitionScore.toFixed(1)})`);
    }

    return selectedRecipe?.recipe || null;
  }

  // Enhanced usage statistics for better reporting
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
    })).sort((a, b) => b.count - a.count); // Sort by usage frequency

    return { 
      mainMeals: mainMealStats, 
      snacks: snackStats, 
      ingredients: ingredientStats,
      batchCookingMode: this.batchCookingMode,
      repetitions: this.batchCookingRepetitions,
      strictMode: this.strictBatchCooking
    };
  }
}
