
import React from "react";
import { Button } from "@/components/ui/button";
import { Archive, Loader, RefreshCcw } from "lucide-react";

interface ImportControlsProps {
  file: File | null;
  importStatus: 'idle' | 'processing' | 'success' | 'error' | 'stalled';
  isLoadingRecipes: boolean;
  onImport: () => void;
  onReset: () => void;
}

const ImportControls: React.FC<ImportControlsProps> = ({ 
  file, 
  importStatus, 
  isLoadingRecipes,
  onImport,
  onReset
}) => {
  if (!file) return null;

  return (
    <div className="flex space-x-2">
      <Button
        onClick={onImport}
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
          onClick={onReset}
          variant="outline"
          className="w-full sm:w-auto mt-4"
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      )}
    </div>
  );
};

export default ImportControls;
