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

  // Batch cooking configuration
  const batchCookingEnabled = profile.batch_cooking_repetitions && profile.batch_cooking_repetitions > 1;
  const batchCookingRepetitions = profile.batch_cooking_repetitions || 1;
  const batchCookingPeople = profile.batch_cooking_people || 1;
  const totalRequiredServings = batchCookingRepetitions * batchCookingPeople;

  let batchCookingInstructions = '';
  if (batchCookingEnabled) {
    batchCookingInstructions = `
BATCH COOKING PREFERENCES:
- User wants to cook the same meal ${batchCookingRepetitions} times per week for ${batchCookingPeople} people
- Total required servings per recipe: ${totalRequiredServings} servings (${batchCookingRepetitions} × ${batchCookingPeople})
- IMPORTANT: Repeat selected recipes across ${batchCookingRepetitions} different days during the week
- When selecting recipes, prioritize those with servings close to or greater than ${totalRequiredServings}
- If a recipe has fewer servings than required, suggest increasing portion size or making a double batch
- Focus on selecting fewer unique recipes but repeating them strategically across the week
- Example: If selecting a dinner recipe for 4 servings but need ${totalRequiredServings}, suggest "Make a double portion to cover ${batchCookingRepetitions} meals for ${batchCookingPeople} people"
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
${batchCookingEnabled ? `- Apply batch cooking strategy: repeat selected recipes ${batchCookingRepetitions} times across the week` : '- Provide variety across different days'}

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
            "portionNote": "Note about portion sizes for batch cooking if applicable"
          }
        ]
      }
    ]
  }
}

${batchCookingEnabled ? `
BATCH COOKING SPECIFIC INSTRUCTIONS:
- When repeating a recipe across ${batchCookingRepetitions} days, mention this in the meal's "portionNote"
- Calculate if recipe servings match the required ${totalRequiredServings} total servings
- Suggest portion adjustments in "portionNote" when needed (e.g., "Make double portion for 3 meals for 2 people")
- In your message, explain how the batch cooking strategy was applied
` : ''}

Important: Only use recipeId values that exist in the provided recipes list. Ensure all dates are within the specified range.`;

  return prompt;
}
