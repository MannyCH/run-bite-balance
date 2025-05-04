
import React from "react";
import { useToast } from "@/hooks/use-toast";

interface FileUploaderProps {
  disabled: boolean;
  setFile: (file: File | null) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ disabled, setFile }) => {
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("✅ File input change fired");

    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Check if it's a ZIP file
    if (!selectedFile.name.toLowerCase().endsWith('.zip')) {
      toast({
        title: "Invalid file format",
        description: "Please select a ZIP file containing recipe text files.",
        variant: "destructive"
      });
      setFile(null);
      return;
    }

    console.log(`Selected file: ${selectedFile.name}, size: ${selectedFile.size} bytes`);
    setFile(selectedFile);
    toast({
      title: "File selected",
      description: `${selectedFile.name} is ready to import.`,
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="recipe-zip" className="text-sm font-medium">
        Select ZIP File:
      </label>
      <input
        id="recipe-zip"
        type="file"
        accept=".zip"
        onChange={handleFileChange}
        disabled={disabled}
        className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      <p className="text-sm text-gray-500 mt-1">
        Upload a ZIP file containing recipe text files (.txt). Each text file should include a recipe title and sections for ingredients, instructions, etc.
        Matching image files will be automatically linked to recipes.
      </p>
    </div>
  );
};

export default FileUploader;
