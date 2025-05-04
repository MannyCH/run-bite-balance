
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
        Upload a ZIP file containing recipe text files and matching images.
        The first line of each text file will be used as the title.
      </p>

      <div className="text-xs bg-gray-100 p-3 rounded mb-2 font-mono">
        <div className="font-semibold mb-1">Recipe text file format:</div>
        Broad Beans With Coriander (Cilantro)<br /><br />
        Ingredients:<br />
        1.2 kg/21/2 lb broad beans (unshelled)<br />
        2 spring onions (scallions), chopped<br /><br />
        Instructions:<br />
        Shell the broad beans and cook until tender<br /><br />
        Servings:<br />
        4 people<br /><br />
        Categories:<br />
        healthy, Vegetable<br /><br />
        Website:<br />
        https://example.com/recipe
      </div>
      
      <div className="text-xs text-gray-600 mb-4">
        <strong>File naming tips:</strong>
        <ul className="list-disc ml-4 mt-1">
          <li>Name your image files to match the recipe text files (e.g., broad_beans_with_coriander.txt and broad_beans_with_coriander.jpg)</li>
          <li>For best results, avoid spaces and special characters in filenames</li>
          <li>Use underscores instead of spaces (e.g., beef_stroganoff.txt instead of "beef stroganoff.txt")</li>
          <li>The importer will try to match files even with different naming, but exact matches work best</li>
        </ul>
      </div>
    </>
  );
};

export default ImporterHeader;
