import OpenAI from "openai";
import { Recipe } from "@/context/types";
import { UserProfile } from "@/types/profile";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface RecipeWithMealType extends Recipe {
  meal_type: "breakfast" | "lunch" | "dinner";
}

export async function assignMealTypesWithAI(
  recipes: Recipe[],
  profile: UserProfile
): Promise<RecipeWithMealType[]> {
  const prompt = `
You are a nutritionist. Assign a meal type ("breakfast", "lunch", or "dinner") to each recipe based on its title and ingredients.
Avoid assigning sweet or light meals (like granola or muesli) to dinner.

Input:
${JSON.stringify(recipes.map(r => ({
    title: r.title,
    ingredients: r.ingredients,
  })), null, 2)}

Return JSON:
[
  { "title": "Muesli Bowl", "meal_type": "breakfast" },
  ...
]
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: "Assign meal types." }
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("No response from OpenAI");

  const parsed = JSON.parse(content);
  return recipes.map(r => {
    const found = parsed.find((p: any) => p.title === r.title);
    return { ...r, meal_type: found?.meal_type || "lunch" };
  });
}
