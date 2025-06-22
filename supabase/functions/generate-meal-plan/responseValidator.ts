
export function extractJsonFromResponse(content: string): any {
  console.log(`Extracting JSON from response content...`);
  console.log(`Response length: ${content.length} characters`);
  
  // First try to parse as direct JSON
  try {
    const parsed = JSON.parse(content.trim());
    console.log(`✅ Successfully parsed response as direct JSON`);
    return parsed;
  } catch (directParseError) {
    console.log(`Direct JSON parse failed, looking for JSON object boundaries...`);
  }
  
  // Look for JSON object boundaries in text that might contain markdown or explanations
  const jsonStart = content.indexOf('{');
  const jsonEnd = content.lastIndexOf('}');
  
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    console.log(`Found JSON object boundaries in plain text`);
    const jsonContent = content.substring(jsonStart, jsonEnd + 1);
    console.log(`Extracted JSON content: ${jsonContent.substring(0, 500)}${jsonContent.length > 500 ? '...' : ''}`);
    
    try {
      const parsed = JSON.parse(jsonContent);
      console.log(`✅ Successfully parsed and validated OpenAI response`);
      return parsed;
    } catch (extractedParseError) {
      console.error(`Failed to parse extracted JSON:`, extractedParseError);
    }
  }
  
  // If all parsing attempts fail, throw an error
  console.error(`Unable to extract valid JSON from response`);
  throw new Error('Failed to parse OpenAI response as JSON');
}

export function validateMealPlanResponse(response: any): boolean {
  if (!response || typeof response !== 'object') {
    console.error('Response is not a valid object');
    return false;
  }

  if (!response.message || typeof response.message !== 'string') {
    console.error('Missing or invalid message field');
    return false;
  }

  if (!response.mealPlan || !response.mealPlan.days || !Array.isArray(response.mealPlan.days)) {
    console.error('Missing or invalid mealPlan.days array');
    return false;
  }

  // Validate each day has required structure
  for (const day of response.mealPlan.days) {
    if (!day.date || !day.meals || !Array.isArray(day.meals)) {
      console.error(`Invalid day structure: missing date or meals array`);
      return false;
    }

    // Validate each meal has required fields
    for (const meal of day.meals) {
      if (!meal.meal_type || !meal.recipe_id) {
        console.error(`Invalid meal structure: missing meal_type or recipe_id`);
        return false;
      }
    }
  }

  return true;
}
