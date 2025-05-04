
// Utility functions for validating meal plan data
import { MealPlanItem } from '@/types/profile';

// Helper function to validate meal type
export function validateMealType(mealType: string): "breakfast" | "lunch" | "dinner" | "snack" {
  if (["breakfast", "lunch", "dinner", "snack"].includes(mealType.toLowerCase())) {
    return mealType.toLowerCase() as "breakfast" | "lunch" | "dinner" | "snack";
  }
  return "snack"; // Default fallback
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
