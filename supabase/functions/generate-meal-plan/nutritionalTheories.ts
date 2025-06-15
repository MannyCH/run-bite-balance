
// Nutritional theory guidance
import type { NutritionalGuidance } from "./types.ts";

// Get nutritional theory guidance
export function getNutritionalTheoryGuidance(theory: string | null): NutritionalGuidance {
  const guidance = {
    tim_spector: {
      focus: "Prioritize gut microbiome diversity with 30+ different plants per week",
      guidelines: [
        "Include fermented foods (yogurt, kefir, sauerkraut, kimchi)",
        "Emphasize fiber-rich foods and diverse vegetables",
        "Include nuts, seeds, and legumes for microbiome health",
        "Limit ultra-processed foods",
        "Focus on polyphenol-rich foods (berries, dark leafy greens, herbs, spices)"
      ]
    },
    mediterranean: {
      focus: "Mediterranean diet emphasizing whole foods, healthy fats, and moderate portions",
      guidelines: [
        "Use olive oil as primary fat source",
        "Include fish and seafood regularly",
        "Emphasize vegetables, fruits, whole grains, and legumes",
        "Include moderate amounts of dairy (especially yogurt and cheese)",
        "Limit red meat and processed foods"
      ]
    },
    keto: {
      focus: "Very low carbohydrate, high fat diet for ketosis",
      guidelines: [
        "Keep carbs under 20-25g net carbs per day",
        "High fat content (70-80% of calories)",
        "Moderate protein (20-25% of calories)",
        "Focus on meat, fish, eggs, low-carb vegetables, nuts, and healthy fats",
        "Avoid grains, sugar, most fruits, and starchy vegetables"
      ]
    },
    paleo: {
      focus: "Whole foods diet based on presumed ancient human diet",
      guidelines: [
        "Focus on meat, fish, eggs, vegetables, fruits, nuts, and seeds",
        "Avoid grains, legumes, dairy, and processed foods",
        "Emphasize grass-fed and organic when possible",
        "Include healthy fats from avocados, nuts, and olive oil"
      ]
    },
    balanced: {
      focus: "Traditional balanced approach with all major food groups",
      guidelines: [
        "Include all major food groups in moderation",
        "Balance proteins, carbohydrates, and fats",
        "Focus on whole, minimally processed foods",
        "Include variety to ensure nutrient adequacy"
      ]
    }
  };

  return guidance[theory as keyof typeof guidance] || guidance.balanced;
}
