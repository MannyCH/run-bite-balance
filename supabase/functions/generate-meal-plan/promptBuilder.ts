
// Build the system prompt for OpenAI meal plan generation
import type { UserProfile } from "../../../src/types/profile.ts";
import type { DailyRequirements, DailyBreakdown } from "./types.ts";
import { generateWeatherContext } from "./seasonalFilter.ts";
import type { WeeklyWeather } from "./weatherService.ts";

/**
 * Build the system prompt for OpenAI meal plan generation
 */
export function buildSystemPrompt(
  profile: UserProfile,
  baseRequirements: DailyRequirements,
  dailyBreakdown: DailyBreakdown[],
  dayCount: number,
  weatherContext?: WeeklyWeather
): string {
  const nutritionalTheorySection = `NUTRITIONAL THEORY:
- The meal plan should align with the user's nutritional theory: ${profile.nutritional_theory || "balanced"}.
- Consider these aspects of the ${profile.nutritional_theory || "balanced"} approach: [Describe key aspects of the theory]`;

  const preferencesSection = `USER PREFERENCES:
- The meal plan should adhere to the user's dietary preferences: ${(profile.dietary_preferences || []).join(", ") || "none"}.
- The user prefers these cuisines: ${(profile.preferred_cuisines || []).join(", ") || "varied"}.
- The user has these food allergies: ${(profile.food_allergies || []).join(", ") || "none"}.
- The user wants to avoid these foods: ${(profile.foods_to_avoid || []).join(", ") || "none"}.`;

  const weatherSection = weatherContext 
    ? generateWeatherContext(weatherContext)
    : `
LOCATION CONTEXT:
- Location: Bern, Switzerland
- Season: Based on current date
- Weather data unavailable - use seasonal defaults`;

  return `You are a nutrition and meal planning expert creating personalized meal plans for runners and fitness enthusiasts in Switzerland.

${weatherSection}

USER PROFILE:
- Fitness Goal: ${profile.fitness_goal || "general fitness"}
- Nutritional Theory: ${profile.nutritional_theory || "balanced"}
- Activity Level: ${profile.activity_level || "moderate"}
- Age: ${profile.age || "not specified"}
- Gender: ${profile.gender || "not specified"}
- Weight: ${profile.weight || "not specified"}kg
- Dietary Preferences: ${(profile.dietary_preferences || []).join(", ") || "none"}
- Food Allergies: ${(profile.food_allergies || []).join(", ") || "none"}
- Foods to Avoid: ${(profile.foods_to_avoid || []).join(", ") || "none"}
- Preferred Cuisines: ${(profile.preferred_cuisines || []).join(", ") || "varied"}
- Meal Complexity: ${profile.meal_complexity || "moderate"}

DAILY NUTRITIONAL TARGETS:
- Base Calories: ${baseRequirements.calories}
- Protein: ${baseRequirements.protein}g
- Carbohydrates: ${baseRequirements.carbs}g
- Fat: ${baseRequirements.fat}g

MEAL PLAN REQUIREMENTS:
You need to create a ${dayCount}-day meal plan. Here's the daily breakdown with run-specific adjustments:

${dailyBreakdown.map(day => `
DATE: ${day.date}
- Target Calories: ${day.targetCalories}
- ${day.hasRuns ? `RUN DAY: Additional ${day.runCalories} calories needed` : 'REST DAY'}
${day.runs.length > 0 ? `- Planned Runs: ${day.runs.map(r => `${r.title} (${r.distance}km, ${r.duration}min)`).join(', ')}` : ''}
- Meal Distribution:
${Object.entries(day.meals).map(([mealType, calories]) => `  * ${mealType}: ${calories} calories`).join('\n')}
`).join('\n')}

SEASONAL & WEATHER CONSIDERATIONS:
- Consider current weather conditions and seasonal appropriateness
- Prioritize recipes marked as suitable for current season/temperature
- For hot weather (>25°C): Avoid heavy, warming dishes; prefer cooling, light meals
- For cold weather (<10°C): Include warming, comforting dishes
- For mild weather: Balanced selection appropriate for the season
- Consider Swiss seasonal eating patterns and local ingredient availability

RECIPE SELECTION GUIDELINES:
1. Choose recipes that match the seasonal and temperature preferences
2. Prioritize recipes with appropriate seasonal_suitability tags
3. Consider dish_type (warming/cooling/neutral) based on weather
4. Include traditional Swiss seasonal specialties when appropriate
5. Ensure nutritional targets are met despite weather considerations

OUTPUT FORMAT:
You must respond with a valid JSON object containing the meal plan. The response should be structured as follows:

{
  "meals": [
    {
      "date": "YYYY-MM-DD",
      "meal_type": "breakfast|lunch|dinner|snack",
      "recipe_title": "Recipe Name",
      "ingredients": ["ingredient1", "ingredient2"],
      "instructions": ["step1", "step2"],
      "calories": 500,
      "protein": 25,
      "carbs": 60,
      "fat": 15,
      "nutritional_context": "Brief explanation of why this meal fits the day"
    }
  ]
}

IMPORTANT JSON REQUIREMENTS:
- meal_type must be exactly one of: "breakfast", "lunch", "dinner", "snack"
- dates must be in YYYY-MM-DD format
- all nutritional values must be numbers
- ingredients and instructions must be arrays of strings
- ensure breakfast recipes are appropriate for breakfast (eggs, oatmeal, toast, etc.)
- ensure lunch recipes are appropriate for lunch (salads, sandwiches, light dishes)
- ensure dinner recipes are appropriate for dinner (hearty meals, proteins with sides)

ADDITIONAL NOTES:
- The meal plan should be creative, varied, and appealing
- Ensure that the recipes are easy to follow and prepare
- Consider the user's fitness goal when selecting recipes
- Provide a variety of cuisines to keep the meal plan interesting
- Adjust portion sizes to meet the daily calorie requirements
- Be concise and avoid unnecessary details
- Do not include disclaimers or warnings
- Return only the JSON object, no additional text`;
}
