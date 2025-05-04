
import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { extractRecipesFromZip } from "@/utils/zipUtils";
import { useToast } from "@/hooks/use-toast";
import ImporterHeader from "./ImporterComponents/ImporterHeader";
import FileUploader from "./ImporterComponents/FileUploader";
import ImportControls from "./ImporterComponents/ImportControls";
import ProgressIndicator from "./ImporterComponents/ProgressIndicator";
import StatusAlerts from "./ImporterComponents/StatusAlerts";

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
      <ImporterHeader />

      <div className="space-y-4">
        <FileUploader 
          disabled={importStatus === 'processing' || isLoadingRecipes} 
          setFile={setFile} 
        />

        <ImportControls 
          file={file}
          importStatus={importStatus}
          isLoadingRecipes={isLoadingRecipes}
          onImport={handleImport}
          onReset={resetImporter}
        />

        <ProgressIndicator 
          importStatus={importStatus}
          progressPercent={progressPercent}
          importMessage={importMessage}
        />

        <StatusAlerts 
          importStatus={importStatus}
          importMessage={importMessage}
        />
      </div>
    </div>
  );
};

export default RecipeImporter;
