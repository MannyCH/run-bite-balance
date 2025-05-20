
import { Recipe } from '@/context/types';
import { UserProfile } from '@/types/profile';

/**
 * Generates nutritional context for a meal
 */
export function getContextForMeal(
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  recipe: Recipe,
  profile: UserProfile
): string {
  const mealContexts = {
    breakfast: [
      "A nutritious breakfast to kickstart your day",
      "Provides energy for your morning activities",
      "A healthy start to your day with balanced nutrients"
    ],
    lunch: [
      "A balanced midday meal to maintain your energy levels",
      "Keeps you going through the afternoon",
      "Provides sustained energy and nutrients for the day"
    ],
    dinner: [
      "A satisfying dinner with balanced nutrition",
      "Completes your daily nutritional needs",
      "A fulfilling dinner to end your day right"
    ],
    snack: [
      "A light snack to keep hunger at bay",
      "A quick energy boost between meals",
      "Helps maintain your metabolism between main meals"
    ]
  };
  
  let context = mealContexts[mealType][Math.floor(Math.random() * mealContexts[mealType].length)];
  
  // Add protein-specific context if it's high in protein
  if (recipe.protein >= 20) {
    context += ". High in protein";
    
    if (profile.fitness_goal === "gain") {
      context += ", supporting your muscle gain goals";
    } else {
      context += ", helping maintain muscle mass";
    }
  }
  
  // Add calorie-specific context if relevant
  if (profile.fitness_goal === "lose" && recipe.calories < 500) {
    context += ". Lower in calories to support your weight loss goals";
  } else if (profile.fitness_goal === "gain" && recipe.calories > 600) {
    context += ". Provides adequate calories to support your training goals";
  }
  
  return context;
}
