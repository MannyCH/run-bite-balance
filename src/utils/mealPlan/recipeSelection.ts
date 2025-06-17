
// Enhanced recipe selection with diversity tracking
import { Recipe } from '@/context/types';
import { filterSeasonallyAppropriateRecipes } from './seasonalFiltering';

export interface RecipeUsageTracker {
  recipeId: string;
  usageCount: number;
  lastUsedDay: number;
}

export class RecipeDiversityManager {
  private usageTracker: Map<string, RecipeUsageTracker> = new Map();
  private currentDay: number = 0;

  // Reset for a new meal plan generation
  reset() {
    this.usageTracker.clear();
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

  // Select a recipe with diversity considerations
  selectRecipeWithDiversity(
    availableRecipes: Recipe[],
    targetCalories: number,
    proteinTarget: number
  ): Recipe | null {
    if (availableRecipes.length === 0) return null;

    // Score recipes based on nutritional match and diversity
    const scoredRecipes = availableRecipes.map(recipe => {
      const usage = this.usageTracker.get(recipe.id);
      
      // Nutritional scoring
      const calorieScore = recipe.calories ? 
        Math.max(0, 100 - Math.abs(recipe.calories - targetCalories) / targetCalories * 100) : 0;
      const proteinScore = recipe.protein ? 
        Math.max(0, 100 - Math.abs(recipe.protein - proteinTarget) / proteinTarget * 100) : 0;
      const nutritionalScore = (calorieScore + proteinScore) / 2;

      // Diversity scoring (penalize recent/frequent usage)
      let diversityScore = 100;
      if (usage) {
        // Penalty for usage count
        diversityScore -= usage.usageCount * 20;
        
        // Extra penalty if used recently
        const daysSinceLastUse = this.currentDay - usage.lastUsedDay;
        if (daysSinceLastUse < 2) {
          diversityScore -= 50; // Heavy penalty for very recent use
        } else if (daysSinceLastUse < 4) {
          diversityScore -= 25; // Moderate penalty for recent use
        }
      }

      // Seasonal score boost (if available)
      const seasonalScore = (recipe as any).seasonalScore || 5;
      const seasonalBonus = (seasonalScore - 5) * 10; // Convert 0-10 to -50 to +50

      const totalScore = (nutritionalScore * 0.4) + (diversityScore * 0.4) + (seasonalBonus * 0.2);
      
      return { recipe, score: totalScore, nutritionalScore, diversityScore, seasonalScore };
    });

    // Sort by total score
    scoredRecipes.sort((a, b) => b.score - a.score);

    // Pick from top 15 recipes to add variety (increased from top 3)
    const topRecipes = scoredRecipes.slice(0, Math.min(15, scoredRecipes.length));
    const selectedRecipe = topRecipes[Math.floor(Math.random() * topRecipes.length)];

    if (selectedRecipe) {
      // Track usage
      const usage = this.usageTracker.get(selectedRecipe.recipe.id) || {
        recipeId: selectedRecipe.recipe.id,
        usageCount: 0,
        lastUsedDay: -1
      };
      
      usage.usageCount++;
      usage.lastUsedDay = this.currentDay;
      this.usageTracker.set(selectedRecipe.recipe.id, usage);

      console.log(`Selected "${selectedRecipe.recipe.title}" (score: ${selectedRecipe.score.toFixed(1)}, nutritional: ${selectedRecipe.nutritionalScore.toFixed(1)}, diversity: ${selectedRecipe.diversityScore.toFixed(1)}, seasonal: ${selectedRecipe.seasonalScore})`);
    }

    return selectedRecipe?.recipe || null;
  }
}
