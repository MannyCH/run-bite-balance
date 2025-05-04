
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { extractRecipesFromZip } from "@/utils/zipUtils";
import { useToast } from "@/hooks/use-toast";
import { Archive, Check, File, Loader, RefreshCcw, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

const RecipeImporter: React.FC = () => {
  console.log("✅ RecipeImporter mounted");

  const { importRecipes, isLoadingRecipes } = useApp();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error' | 'stalled'>('idle');
  const [importMessage, setImportMessage] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [lastProgressUpdate, setLastProgressUpdate] = useState<number>(Date.now());

  // Safari-specific stall detection
  useEffect(() => {
    // If we're processing and no update for 15 seconds, consider it stalled
    if (importStatus === 'processing') {
      const stallInterval = setInterval(() => {
        const now = Date.now();
        if (now - lastProgressUpdate > 15000) {
          setImportStatus('stalled');
          setImportMessage('Import appears to be stalled. You can try resetting and importing again.');
          clearInterval(stallInterval);
        }
      }, 5000);
      
      return () => clearInterval(stallInterval);
    }
  }, [importStatus, lastProgressUpdate]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("✅ File input change fired");

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
      return;
    }

    setFile(selectedFile);
    setImportStatus('idle');
    setImportMessage('');
    setProgressPercent(0);
    setLastProgressUpdate(Date.now());

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

    console.log("🔄 Starting import:", file.name);
    setImportStatus('processing');
    setImportMessage('Processing your ZIP file...');
    setProgressPercent(10);
    setLastProgressUpdate(Date.now());

    try {
      // Safari-compatible timeout to ensure UI updates before heavy processing
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgressPercent(20);

      // Extract recipes from ZIP with progress updates
      const updateProgress = (phase: string, percent: number) => {
        console.log(`Progress update: ${phase} - ${percent}%`);
        setImportMessage(phase);
        setProgressPercent(20 + percent * 0.6); // Scale to 20-80% range
        setLastProgressUpdate(Date.now());
      };

      const recipes = await extractRecipesFromZip(file, updateProgress);
      console.log("✅ Extracted recipes:", recipes.length);

      if (recipes.length === 0) {
        setImportStatus('error');
        setImportMessage('No recipes found in the ZIP file.');
        setProgressPercent(0);
        toast({
          title: "No recipes found",
          description: "The ZIP file did not contain any valid recipe files.",
          variant: "destructive"
        });
        return;
      }

      // Save recipes to Supabase
      setProgressPercent(80);
      setImportMessage('Uploading recipes to Supabase...');
      setLastProgressUpdate(Date.now());
      
      // Safari-compatible timeout to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 200));
      
      await importRecipes(recipes);
      setProgressPercent(100);
      
      // Final success state
      setImportStatus('success');
      setImportMessage(`${recipes.length} recipes have been imported successfully to Supabase.`);
      setLastProgressUpdate(Date.now());

      toast({
        title: "Import successful",
        description: `${recipes.length} recipes have been imported and stored in Supabase.`,
      });
    } catch (error) {
      console.error("❌ Error during import:", error);
      setImportStatus('error');
      setImportMessage(error instanceof Error ? error.message : "Failed to import recipes.");
      setProgressPercent(0);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import recipes.",
        variant: "destructive"
      });
    }
  };

  const resetImporter = () => {
    setFile(null);
    setImportStatus('idle');
    setImportMessage('');
    setProgressPercent(0);
    setLastProgressUpdate(Date.now());
    const fileInput = document.getElementById('recipe-zip') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <div className="mb-6 border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Archive className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Import Recipes to Supabase</h3>
      </div>

      <p className="text-sm text-gray-600 mb-3">
        Upload a ZIP file containing recipe text files and images.
        Each text file should follow this structure:
      </p>

      <div className="text-xs bg-gray-100 p-3 rounded mb-4 font-mono">
        Auberginensalat Mit Ohne Alles<br /><br />
        Ingredients:<br />
        Etwa 1/2 Aubergine feines Meersalz<br />
        etwa 100 g Naturjoghurt<br /><br />
        Instructions:<br />
        Step 1<br />
        Step 2<br /><br />
        Servings: (optional)<br />
        1 person<br /><br />
        Categories: (optional)<br />
        healthy, vegetarian<br /><br />
        Website: (optional)<br />
        https://example.com/recipe
      </div>

      <div className="space-y-4">
        {/* File input area */}
        <div className="flex flex-col gap-2">
          <label htmlFor="recipe-zip" className="text-sm font-medium">
            Select ZIP File:
          </label>
          <input
            id="recipe-zip"
            type="file"
            accept=".zip"
            onChange={handleFileChange}
            disabled={importStatus === 'processing' || isLoadingRecipes}
            className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Import button */}
        {file && (
          <div className="flex space-x-2">
            <Button
              onClick={handleImport}
              disabled={importStatus === 'processing' || isLoadingRecipes}
              className="w-full sm:w-auto mt-4"
            >
              {(importStatus === 'processing' || isLoadingRecipes) ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4 mr-2" />
                  Import Recipes
                </>
              )}
            </Button>
            
            {(importStatus === 'success' || importStatus === 'error' || importStatus === 'stalled') && (
              <Button
                onClick={resetImporter}
                variant="outline"
                className="w-full sm:w-auto mt-4"
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
        )}

        {/* Loading bar */}
        {(importStatus === 'processing' || progressPercent > 0) && (
          <div className="space-y-2 mt-2">
            <div className="text-sm text-gray-600 flex justify-between">
              <span>{importMessage}</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}

        {/* Stalled alert */}
        {importStatus === 'stalled' && (
          <Alert variant="default" className="bg-amber-50 border-amber-200">
            <RefreshCcw className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-800">
              The import process appears to be stalled. This might happen with larger ZIP files on Safari. 
              You can either wait longer or try with a smaller ZIP file (fewer images).
            </AlertDescription>
          </Alert>
        )}

        {/* Success alert */}
        {importStatus === 'success' && (
          <Alert variant="default" className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-800">
              {importMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Error alert */}
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
