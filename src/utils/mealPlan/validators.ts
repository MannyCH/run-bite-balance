// Utility functions for validating meal plan data
import { MealPlanItem } from '@/types/profile';

// Helper function to validate meal type
export function validateMealType(mealType: string): 'breakfast' | 'lunch' | 'dinner' | 'pre_run_snack' | 'post_run_snack' {
  const validMealTypes = ['breakfast', 'lunch', 'dinner', 'pre_run_snack', 'post_run_snack'] as const;
  if (validMealTypes.includes(mealType as any)) {
    return mealType as 'breakfast' | 'lunch' | 'dinner' | 'pre_run_snack' | 'post_run_snack';
  }
  return 'breakfast'; // default fallback
}

// Helper function to validate status
export function validateStatus(status: string): "active" | "draft" {
  if (["active", "draft"].includes(status.toLowerCase())) {
    return status.toLowerCase() as "active" | "draft";
  }
  return "draft"; // Default fallback
}

// Ensure meal plan items are properly typed
export function validateMealPlanItems(items: any[]): Partial<MealPlanItem>[] {
  return items.map(item => ({
    ...item,
    meal_type: validateMealType(item.meal_type),
  }));
}
