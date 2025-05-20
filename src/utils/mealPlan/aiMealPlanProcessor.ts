
// This file is now a re-export of the refactored functionality
// to maintain backward compatibility

import { processAIMealPlan as processAIMealPlanInternal, processAIMealPlanItem } from './ai/processAIMealPlan';
import { extractMainIngredient } from './ai/ingredientUtils';
import { Recipe } from '@/context/types';

// Re-export the main functionality with the same function signature
export const processAIMealPlan = processAIMealPlanInternal;

// Re-export the helper function for backward compatibility
export { extractMainIngredient, processAIMealPlanItem };
