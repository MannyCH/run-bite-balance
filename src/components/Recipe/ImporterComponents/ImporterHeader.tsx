
import React from "react";
import { Archive } from "lucide-react";

const ImporterHeader: React.FC = () => {
  return (
    <>
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
    </>
  );
};

export default ImporterHeader;
