
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { extractRecipesFromZip } from "@/utils/zipUtils";
import { useToast } from "@/hooks/use-toast";
import { Archive, Loader } from "lucide-react";

const RecipeImporter: React.FC = () => {
  const { importRecipes } = useApp();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    
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
      console.log("Processing ZIP file:", file.name);
      const recipes = await extractRecipesFromZip(file);
      console.log("Extracted recipes:", recipes);
      
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
      console.error("Error extracting recipes:", error);
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
        Each text file should follow this structure:
      </p>
      
      <div className="text-xs bg-gray-100 p-3 rounded mb-4 font-mono">
        Auberginensalat Mit Ohne Alles<br />
        <br />
        Ingredients:<br />
        Etwa 1/2 Aubergine feines Meersalz<br />
        etwa 100 g Naturjoghurt<br />
        <br />
        Instructions:<br />
        Step 1<br />
        Step 2<br />
        <br />
        Servings: (optional)<br />
        1 person<br />
        <br />
        Categories: (optional)<br />
        healthy, vegetarian<br />
        <br />
        Website: (optional)<br />
        https://example.com/recipe
      </div>
      
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            disabled={isLoading}
            className="relative"
            onClick={() => document.getElementById('recipe-zip')?.click()}
          >
            {isLoading ? (
              <>
                <Loader className="h-4 w-4 animate-spin mr-2" />
                Importing...
              </>
            ) : (
              "Select ZIP File"
            )}
            <input
              id="recipe-zip"
              type="file"
              accept=".zip"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
              disabled={isLoading}
            />
          </Button>
          {fileName && !isLoading && (
            <span className="text-sm text-gray-600">Selected: {fileName}</span>
          )}
        </div>
        
        {isLoading && (
          <div className="text-sm text-gray-600 mt-2">
            Processing... This may take a moment depending on the size of your ZIP file.
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeImporter;
