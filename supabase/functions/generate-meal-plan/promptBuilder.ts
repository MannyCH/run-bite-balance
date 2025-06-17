
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
  const weatherSection = weatherContext 
    ? generateWeatherContext(weatherContext)
    : `
LOCATION CONTEXT:
- Location: Bern, Switzerland
- Season: Based on current date
- Weather data unavailable - use seasonal defaults`;

  return `You are a nutrition and meal planning expert creating personalized meal plans for runners and fitness enthusiasts in Switzerland.

CRITICAL MEAL TYPE REQUIREMENTS - NON-NEGOTIABLE:
These rules MUST be followed above all other considerations:

BREAKFAST FOODS ONLY:
- Eggs (omelets, scrambled, fried, poached)
- Oatmeal, porridge, muesli, granola, cereal
- Pancakes, waffles, toast, bagels, muffins
- Yogurt with fruits, chia pudding
- Smoothies, fresh fruit
- Coffee or tea accompaniments
- NEVER: pasta, rice dishes, heavy meat dishes, soups, dinner foods

LUNCH FOODS ONLY:
- Salads (grain bowls, green salads, protein salads)
- Sandwiches, wraps, light pasta dishes
- Soups (light, not heavy stews)
- Rice bowls, quinoa dishes
- Light proteins with vegetables
- NEVER: heavy breakfast foods, heavy dinner dishes, desserts

DINNER FOODS ONLY:
- Substantial proteins (meat, fish, poultry)
- Pasta dishes, risottos, hearty grain dishes
- Casseroles, baked dishes, roasts
- Stews, curries, substantial soups
- Vegetables as sides to main proteins
- NEVER: breakfast cereals, light salads only, breakfast pastries

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

RECIPE SELECTION GUIDELINES - PRIORITY ORDER:
1. **MEAL TYPE APPROPRIATENESS (HIGHEST PRIORITY)**: 
   - ALWAYS choose foods that belong to the correct meal type
   - NEVER assign breakfast foods to dinner or vice versa
   - This rule overrides ALL other considerations

2. **Seasonal and Weather Appropriateness**:
   - Within the correct meal type, prefer seasonally appropriate options
   - Consider temperature preferences for the chosen meal type
   - Prioritize recipes marked as suitable for current season/temperature

3. **Nutritional Targets**: Meet calorie and macro requirements within meal type constraints

4. **User Preferences**: Apply dietary restrictions and cuisine preferences

5. **Variety**: Ensure diverse selection within appropriate meal types

MEAL TYPE VALIDATION PROCESS:
Before finalizing any meal selection, ask yourself:
- Is this a typical breakfast/lunch/dinner food?
- Would this meal be served at the correct time of day?
- Does this fit the meal type regardless of season?

SEASONAL & WEATHER CONSIDERATIONS (SECONDARY TO MEAL TYPE):
- Consider current weather conditions within the appropriate meal type
- For hot weather: Choose lighter versions of appropriate meal type foods
- For cold weather: Choose heartier versions of appropriate meal type foods
- Seasonal ingredients should be used within the correct meal type context

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

CRITICAL JSON REQUIREMENTS:
- meal_type must be exactly one of: "breakfast", "lunch", "dinner", "snack"
- dates must be in YYYY-MM-DD format
- all nutritional values must be numbers
- ingredients and instructions must be arrays of strings
- ENSURE breakfast recipes are ONLY breakfast foods (eggs, oatmeal, toast, yogurt, etc.)
- ENSURE lunch recipes are ONLY lunch foods (salads, sandwiches, light dishes, etc.)
- ENSURE dinner recipes are ONLY dinner foods (hearty meals, proteins with sides, etc.)

FINAL VALIDATION:
Before submitting your response, verify that:
1. Each breakfast meal contains only breakfast-appropriate foods
2. Each lunch meal contains only lunch-appropriate foods  
3. Each dinner meal contains only dinner-appropriate foods
4. No meal type rules have been violated for seasonal considerations

ADDITIONAL NOTES:
- The meal plan should be creative, varied, and appealing within meal type constraints
- Ensure that the recipes are easy to follow and prepare
- Consider the user's fitness goal when selecting recipes within appropriate meal types
- Provide a variety of cuisines to keep the meal plan interesting within meal type boundaries
- Adjust portion sizes to meet the daily calorie requirements
- Be concise and avoid unnecessary details
- Do not include disclaimers or warnings
- Return only the JSON object, no additional text`;
}

export function buildMealPlanPrompt(
  profile: UserProfile,
  recipes: any[],
  runs: any[],
  startDate: string,
  endDate: string,
  dailyRequirements: any,
  recipesByMealType: any,
  currentWeather?: any
): string {
  // Basic profile info
  const profileSection = `
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
`;

  // Daily nutritional requirements
  const requirementsSection = `
DAILY NUTRITIONAL REQUIREMENTS:
- Base Calories: ${dailyRequirements.calories}
- Protein: ${dailyRequirements.protein}g
- Carbohydrates: ${dailyRequirements.carbs}g
- Fat: ${dailyRequirements.fat}g
`;

  // Runs analysis
  const runsSection = `
RUNS AND ACTIVITY SCHEDULE:
${runs.map(run => `
- Date: ${run.date}
  - Title: ${run.title}
  - Distance: ${run.distance}km
  - Duration: ${run.duration}min
  - Calories: ${run.calories}
`).join('\n')}
`;

  // Seasonal preferences
  const seasonalSection = `
SEASONAL AND WEATHER CONSIDERATIONS:
- Location: Bern, Switzerland
- Season: Based on current date
- Weather data unavailable - use seasonal defaults
`;

  // Available recipes by meal type
  const recipesByMealTypeSection = `
AVAILABLE RECIPES BY MEAL TYPE:
${Object.entries(recipesByMealType).map(([mealType, recipes]) => `
- ${mealType}:
  ${recipes.map(recipe => `
    - ${recipe.title} (calories: ${recipe.calories}, protein: ${recipe.protein}g, carbs: ${recipe.carbs}g, fat: ${recipe.fat}g)
  `).join('\n')}
`).join('\n')}
`;

  // Flexible batch cooking configuration
  const batchCookingEnabled = profile.batch_cooking_repetitions && profile.batch_cooking_repetitions > 1;
  const batchCookingRepetitions = profile.batch_cooking_repetitions || 1;
  const batchCookingPeople = profile.batch_cooking_people || 1;
  const totalRequiredServings = batchCookingRepetitions * batchCookingPeople;

  let batchCookingInstructions = '';
  if (batchCookingEnabled) {
    batchCookingInstructions = `
FLEXIBLE BATCH COOKING STRATEGY:
- Target: Aim for recipes to appear approximately ${batchCookingRepetitions} times per week for ${batchCookingPeople} people
- Flexibility: Allow intelligent variation (2-4 repetitions per recipe) based on practical constraints
- Priority: Focus batch cooking primarily on dinner recipes (most time-consuming to prepare)
- Run Day Adaptation: Allow run days to break batch cooking rules when nutritionally necessary (e.g., special pre/post-run meals)
- Meal Type Rules:
  * Dinner: Primary target for batch cooking (aim for 2-4 repetitions of substantial recipes)
  * Lunch: Secondary target (can be batched but with more flexibility for run days)
  * Breakfast: Less critical for batching (simpler meals, quick prep)
  * Snacks: Never batch (too situational based on runs)

INTELLIGENT DISTRIBUTION GUIDELINES:
- Calculate approximate unique recipes needed per meal type: total_meals ÷ ${batchCookingRepetitions}
- Allow some recipes to appear 2x, others 4x to balance practical constraints
- If run days require specialized meals, adapt remaining days for batch cooking
- Prioritize cooking efficiency over perfect mathematical distribution
- Example: For 7 dinners, aim for ~2-3 unique recipes appearing 2-4 times each
- Explain reasoning when deviating from target repetitions (e.g., "Lighter meal needed for pre-run day")

PORTION SIZE INTELLIGENCE:
- Calculate servings based on actual recipe repetition (may be 2-4x instead of exactly ${batchCookingRepetitions}x)
- Suggest realistic portion adjustments: "Make double portion for 2 meals" or "Make large batch for 4 meals"
- Consider leftover management across varying repetitions
- Include portion notes like: "Cook once, serves 3 dinners for ${batchCookingPeople} people"
`;
  }

  const prompt = `You are a professional nutritionist and meal planning expert. Create a personalized weekly meal plan.

USER PROFILE:
${profileSection}

DAILY NUTRITIONAL REQUIREMENTS:
${requirementsSection}

${batchCookingInstructions}

RUNS AND ACTIVITY SCHEDULE:
${runsSection}

SEASONAL AND WEATHER CONSIDERATIONS:
${seasonalSection}

AVAILABLE RECIPES BY MEAL TYPE:
${recipesByMealTypeSection}

MEAL PLAN REQUIREMENTS:
- Plan for dates from ${startDate} to ${endDate}
- Include breakfast, lunch, dinner, and snacks (pre/post-run when applicable)
- Ensure nutritional balance and variety
- Consider meal complexity preference: ${profile.meal_complexity || 'moderate'}
- Account for dietary restrictions and preferences
- Factor in seasonal appropriateness and current weather
${batchCookingEnabled ? `- Apply flexible batch cooking strategy: aim for ~${batchCookingRepetitions} repetitions but allow 2-4x variation based on practical needs` : '- Provide variety across different days'}

RESPONSE FORMAT:
Return a JSON object with this exact structure:
{
  "message": "Brief explanation of the meal plan approach and any batch cooking considerations",
  "mealPlan": {
    "days": [
      {
        "date": "YYYY-MM-DD",
        "meals": [
          {
            "mealType": "breakfast|lunch|dinner|pre_run_snack|post_run_snack",
            "recipeId": "recipe-uuid-from-available-recipes",
            "customTitle": "Custom meal title if no recipe",
            "nutritionalContext": "Context like 'PRE-RUN FUEL' or 'POST-RUN RECOVERY'",
            "portionNote": "Flexible portion guidance for batch cooking if applicable"
          }
        ]
      }
    ]
  }
}

${batchCookingEnabled ? `
FLEXIBLE BATCH COOKING SPECIFIC INSTRUCTIONS:
- When a recipe appears multiple times, mention this in the meal's "portionNote"
- Allow variation in repetitions (2-4x) and explain reasoning in portionNote
- Calculate servings flexibly: "Make large batch for 3-4 meals for ${batchCookingPeople} people"
- Suggest practical adjustments: "Double recipe for 2 dinners" or "Large batch for 4 servings"
- In your message, explain how the flexible batch cooking strategy was applied
- Prioritize dinner batch cooking over other meal types
- Allow run day meals to break batch cooking when nutritionally appropriate
` : ''}

Important: Only use recipeId values that exist in the provided recipes list. Ensure all dates are within the specified range.`;

  return prompt;
}
