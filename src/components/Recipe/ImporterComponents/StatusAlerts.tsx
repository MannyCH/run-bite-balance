
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCcw, Check, X } from "lucide-react";

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
        <AlertDescription>
          {importMessage}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default StatusAlerts;
