
// Main export file that re-exports all meal plan functionality
export { generateMealPlan, generateMealPlanForUser } from './mealPlanGenerator';
export { validateMealType, validateStatus } from './validators';
export { generateMealPlanItems } from './mealPlanItems';
export type { MealPlanResult, GenerateMealPlanParams } from './types';
export { getMealTypeSuitabilityScores, getRecipesForMealType } from './mealTypeClassifier';
export { processAIMealPlan } from './mealPlanProcessor';
export { getRunsForDate, hasRunsOnDate } from './runTimingUtils';
export { selectSnackRecipe, createSnackMealPlanItem } from './snackSelectionUtils';
export { createMealPlanItemFromAI, processAIMealsForDay } from './mealProcessingUtils';
