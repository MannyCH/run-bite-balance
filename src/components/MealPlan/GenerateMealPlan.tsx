import { generateMealPlanForUser } from "@/utils/mealPlan/generateMealPlanForUser";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/context/ProfileContext";
import { useAuth } from "@/context/AuthContext";

// Add to existing props:
interface GenerateMealPlanProps {
  onMealPlanGenerated: () => Promise<void>;
}

export const GenerateMealPlan: React.FC<GenerateMealPlanProps> = ({
  onMealPlanGenerated
}) => {
  const { user, session } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!user?.id || !session?.access_token) return;

    try {
      const startDate = new Date().toISOString().slice(0, 10);
      const endDate = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

      // STEP 1 — Call your Supabase Edge Function to generate AI recipes
      const res = await fetch("/functions/v1/generate-meal-plan", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          aiRecipeRatio: profile?.ai_recipe_ratio ?? 30,
          startDate,
          endDate,
        }),
      });

      const { aiRecipes, error } = await res.json();

      if (error || !aiRecipes) {
        toast({
          title: "Error",
          description: error ?? "Could not generate recipes.",
          variant: "destructive",
        });
        return;
      }

      // STEP 2 — Generate full plan with AI + saved recipes
      await generateMealPlanForUser(user.id, startDate, endDate, aiRecipes);

      toast({
        title: "Meal Plan Generated",
        description: `Your new plan includes ${aiRecipes.length} AI recipes.`,
      });

      await onMealPlanGenerated(); // reload state in parent

    } catch (err) {
      console.error("Meal plan error", err);
      toast({
        title: "Error",
        description: "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  return (
    <button onClick={handleGenerate} className="btn btn-primary">
      Generate New Plan
    </button>
  );
};
