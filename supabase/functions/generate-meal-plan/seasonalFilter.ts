
// seasonalFilter.ts — Complete version with correct meal type handling
import type { RecipeSummary } from "./types.ts";
import type { WeeklyWeather } from "./weatherService.ts";

export interface SeasonalContext {
  weather: WeeklyWeather;
  location: string;
  preferences: {
    avoidHeavyInHeat: boolean;
    preferSeasonalIngredients: boolean;
    considerSwissTraditional: boolean;
  };
}

/**
 * Filter and score recipes grouped by meal type to prevent mismatches (e.g., dinner recipes for breakfast)
 */
export function filterSeasonallyAppropriateRecipesByMealType(
  recipes: RecipeSummary[],
  context: SeasonalContext
): Record<"breakfast" | "lunch" | "dinner" | "snack", RecipeSummary[]> {
  const result = {
    breakfast: [] as RecipeSummary[],
    lunch: [] as RecipeSummary[],
    dinner: [] as RecipeSummary[],
    snack: [] as RecipeSummary[],
  };

  for (const mealType of ["breakfast", "lunch", "dinner", "snack"] as const) {
    // Filter recipes that include this meal type in their meal_type array
    const filtered = recipes
      .filter(r => {
        // If meal_type is not set, fall back to basic categorization
        if (!r.meal_type || r.meal_type.length === 0) {
          return classifyRecipeByTitle(r.title, mealType);
        }
        // Check if the recipe's meal_type array includes the current meal type
        return r.meal_type.includes(mealType);
      })
      .map(recipe => ({
        ...recipe,
        seasonalScore: calculateSeasonalScore(recipe, context)
      }))
      .sort((a, b) => (b.seasonalScore || 0) - (a.seasonalScore || 0));

    result[mealType] = filtered;
  }

  return result;
}

/**
 * Fallback classification based on recipe title for recipes without meal_type
 */
function classifyRecipeByTitle(title: string, targetMealType: string): boolean {
  const lowerTitle = title.toLowerCase();
  
  switch (targetMealType) {
    case 'breakfast':
      return /\b(breakfast|cereal|oatmeal|pancake|waffle|toast|egg|bacon|sausage|muffin|bagel|smoothie|coffee|tea)\b/.test(lowerTitle);
    case 'lunch':
      return /\b(lunch|sandwich|wrap|salad|soup|bowl|burger|pizza|pasta)\b/.test(lowerTitle) ||
             (!/(breakfast|dinner|dessert|cake|pie|cookie)\b/.test(lowerTitle) && /\b(light|quick|fresh)\b/.test(lowerTitle));
    case 'dinner':
      return /\b(dinner|steak|roast|casserole|curry|stew|grilled|baked|main|entree|hearty)\b/.test(lowerTitle) ||
             (!/(breakfast|lunch|snack|dessert)\b/.test(lowerTitle) && /\b(chicken|beef|pork|fish|lamb)\b/.test(lowerTitle));
    case 'snack':
      return /\b(snack|appetizer|dip|chip|cracker|cookie|bar|bite|finger|small)\b/.test(lowerTitle);
    default:
      return false;
  }
}

/**
 * Calculate how suitable a recipe is for current weather/season (0-10 scale)
 */
function calculateSeasonalScore(recipe: RecipeSummary, context: SeasonalContext): number {
  let score = 5;
  const { weather } = context;

  // Season match
  if (recipe.seasonal_suitability?.includes(weather.season)) {
    score += 3;
  } else if (recipe.seasonal_suitability?.includes("year_round")) {
    score += 1;
  } else if (recipe.seasonal_suitability?.length > 0) {
    const hasSpecificSeasons = recipe.seasonal_suitability.some(s => s !== "year_round");
    if (hasSpecificSeasons) {
      score -= 2;
    }
  }

  // Temperature preference
  if (recipe.temperature_preference) {
    switch (weather.temperatureCategory) {
      case "hot":
        if (recipe.temperature_preference === "hot_weather") score += 3;
        else if (recipe.temperature_preference === "cold_weather") score -= 4;
        else if (recipe.temperature_preference === "any") score += 0.5;
        break;
      case "cold":
        if (recipe.temperature_preference === "cold_weather") score += 3;
        else if (recipe.temperature_preference === "hot_weather") score -= 3;
        else if (recipe.temperature_preference === "any") score += 0.5;
        break;
      case "mild":
        if (recipe.temperature_preference === "mild_weather") score += 2;
        else if (recipe.temperature_preference === "any") score += 1;
        break;
    }
  }

  // Dish type preference
  if (recipe.dish_type) {
    if (weather.temperatureCategory === "hot" && recipe.dish_type === "cooling") score += 2;
    else if (weather.temperatureCategory === "cold" && recipe.dish_type === "warming") score += 2;
    else if (weather.temperatureCategory === "hot" && recipe.dish_type === "warming") score -= 3;
    else if (weather.temperatureCategory === "cold" && recipe.dish_type === "cooling") score -= 2;
  }

  if (context.preferences.considerSwissTraditional) {
    score += getSwissSeasonalBonus(recipe, weather.season);
  }

  return Math.max(0, Math.min(10, score));
}

function getSwissSeasonalBonus(recipe: RecipeSummary, season: string): number {
  const title = recipe.title.toLowerCase();
  switch (season) {
    case "winter":
      if (["fondue", "raclette", "soup", "stew", "chili", "curry", "casserole"].some(w => title.includes(w))) {
        return 1.5;
      }
      break;
    case "summer":
      if (["salad", "grilled", "cold", "fresh", "gazpacho", "smoothie", "ice cream"].some(w => title.includes(w))) {
        return 1.5;
      }
      break;
    case "autumn":
      if (["pumpkin", "mushroom", "root", "squash", "apple", "harvest"].some(w => title.includes(w))) {
        return 1;
      }
      break;
    case "spring":
      if (["asparagus", "fresh", "green", "pea", "herb", "light"].some(w => title.includes(w))) {
        return 1;
      }
      break;
  }
  return 0;
}
