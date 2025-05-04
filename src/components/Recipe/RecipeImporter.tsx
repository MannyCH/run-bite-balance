
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { extractRecipesFromZip } from "@/utils/zipUtils";
import { useToast } from "@/hooks/use-toast";
import { Archive } from "lucide-react";

const RecipeImporter: React.FC = () => {
  const { importRecipes } = useApp();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.zip')) {
      toast({
        title: "Invalid file format",
        description: "Please select a ZIP file.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const recipes = await extractRecipesFromZip(file);
      if (recipes.length === 0) {
        toast({
          title: "No recipes found",
          description: "The ZIP file did not contain any valid recipe files.",
          variant: "destructive"
        });
        return;
      }
      
      importRecipes(recipes);
      toast({
        title: "Recipes imported successfully",
        description: `${recipes.length} recipes have been imported.`,
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import recipes.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Archive className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Import Recipes</h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">
        Upload a ZIP file containing recipe text files and images.
        Each text file should contain the recipe title on the first line,
        nutrition info on the second line (calories,protein,carbs,fat),
        ingredients, and instructions.
      </p>
      
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          disabled={isLoading}
          className="relative"
          onClick={() => document.getElementById('recipe-zip')?.click()}
        >
          {isLoading ? "Importing..." : "Select ZIP File"}
          <input
            id="recipe-zip"
            type="file"
            accept=".zip"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
            disabled={isLoading}
          />
        </Button>
      </div>
    </div>
  );
};

export default RecipeImporter;
