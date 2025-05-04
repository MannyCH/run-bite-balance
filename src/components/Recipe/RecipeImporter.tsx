
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { extractRecipesFromZip } from "@/utils/zipUtils";
import { useToast } from "@/hooks/use-toast";
import { Archive, Check, File, FileUp, Loader, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

const RecipeImporter: React.FC = () => {
  const { importRecipes } = useApp();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      setFile(null);
      return;
    }
    
    if (!selectedFile.name.endsWith('.zip')) {
      toast({
        title: "Invalid file format",
        description: "Please select a ZIP file.",
        variant: "destructive"
      });
      setFile(null);
      event.target.value = '';
      return;
    }
    
    setFile(selectedFile);
    setImportStatus('idle');
    setImportMessage('');
    
    // Show toast when file is selected
    toast({
      title: "File selected",
      description: `${selectedFile.name} is ready to import.`,
    });
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a ZIP file first.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    setImportStatus('idle');
    setImportMessage('');
    
    try {
      console.log("Processing ZIP file:", file.name);
      const recipes = await extractRecipesFromZip(file);
      console.log("Extracted recipes:", recipes);
      
      if (recipes.length === 0) {
        setImportStatus('error');
        setImportMessage('No recipes found in the ZIP file.');
        toast({
          title: "No recipes found",
          description: "The ZIP file did not contain any valid recipe files.",
          variant: "destructive"
        });
        return;
      }
      
      importRecipes(recipes);
      setImportStatus('success');
      setImportMessage(`${recipes.length} recipes have been imported successfully.`);
      toast({
        title: "Import successful",
        description: `${recipes.length} recipes have been imported.`,
      });
    } catch (error) {
      console.error("Error extracting recipes:", error);
      setImportStatus('error');
      setImportMessage(error instanceof Error ? error.message : "Failed to import recipes.");
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import recipes.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetImporter = () => {
    setFile(null);
    setImportStatus('idle');
    setImportMessage('');
    const fileInput = document.getElementById('recipe-zip') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <div className="mb-6 border rounded-lg p-4 bg-white shadow-sm">
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
      
      <div className="space-y-4">
        {/* File Selection Area */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button
              variant="outline"
              disabled={isLoading}
              className="relative"
              onClick={() => document.getElementById('recipe-zip')?.click()}
            >
              <FileUp className="h-4 w-4 mr-2" />
              Select ZIP File
              <input
                id="recipe-zip"
                type="file"
                accept=".zip"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileChange}
                disabled={isLoading}
              />
            </Button>
            
            {file && (
              <div className="flex items-center gap-2 py-1 px-3 rounded-md bg-gray-100 text-sm">
                <File className="h-4 w-4 text-blue-500" />
                <span className="font-medium">{file.name}</span>
                <button 
                  onClick={resetImporter} 
                  className="p-1 hover:bg-gray-200 rounded-full"
                  aria-label="Remove file"
                >
                  <X className="h-3 w-3 text-gray-500" />
                </button>
              </div>
            )}
          </div>
          
          {/* Import Button */}
          {file && (
            <Button 
              onClick={handleImport} 
              disabled={isLoading || !file}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Importing...
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4 mr-2" />
                  Import Recipes
                </>
              )}
            </Button>
          )}
          
          {/* Loading Indicator */}
          {isLoading && (
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                Processing your ZIP file... This may take a moment.
              </div>
              <Progress value={33} className="h-2" />
            </div>
          )}
        </div>
        
        {/* Status Messages */}
        {importStatus === 'success' && (
          <Alert variant="default" className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-800">
              {importMessage}
            </AlertDescription>
          </Alert>
        )}
        
        {importStatus === 'error' && (
          <Alert variant="destructive">
            <X className="h-4 w-4" />
            <AlertDescription>
              {importMessage}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default RecipeImporter;
