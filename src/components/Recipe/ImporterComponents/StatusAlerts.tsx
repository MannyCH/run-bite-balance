
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCcw, Check, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StatusAlertsProps {
  importStatus: 'idle' | 'processing' | 'success' | 'error' | 'stalled';
  importMessage: string;
}

const StatusAlerts: React.FC<StatusAlertsProps> = ({ importStatus, importMessage }) => {
  if (importStatus === 'idle' || importStatus === 'processing') return null;

  if (importStatus === 'stalled') {
    return (
      <Alert variant="default" className="bg-amber-50 border-amber-200">
        <RefreshCcw className="h-4 w-4 text-amber-500" />
        <AlertDescription className="text-amber-800">
          The import process appears to be stalled. This might happen with larger ZIP files on Safari. 
          You can either wait longer or try with a smaller ZIP file (fewer images).
        </AlertDescription>
      </Alert>
    );
  }

  if (importStatus === 'success') {
    return (
      <Alert variant="default" className="bg-green-50 border-green-200">
        <Check className="h-4 w-4 text-green-500" />
        <AlertDescription className="text-green-800">
          {importMessage}
        </AlertDescription>
      </Alert>
    );
  }

  if (importStatus === 'error') {
    return (
      <Alert variant="destructive">
        <X className="h-4 w-4" />
        <AlertDescription className="flex flex-col gap-2">
          <div>{importMessage}</div>
          
          {importMessage.includes("No TXT recipe files found") && (
            <div className="text-sm mt-2 bg-gray-800 text-white p-3 rounded-md">
              <div className="font-bold mb-1">ZIP file format requirements:</div>
              <ul className="list-disc list-inside space-y-1">
                <li>Must contain at least one .txt file</li>
                <li>Each text file should have a title on the first line</li>
                <li>Sections should be marked with headers ending with a colon (Ingredients:, Instructions:, etc.)</li>
                <li>Image files should share the same name as text files</li>
              </ul>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default StatusAlerts;
