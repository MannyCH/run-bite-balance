
import React from "react";
import { Progress } from "@/components/ui/progress";

interface ProgressIndicatorProps {
  importStatus: 'idle' | 'processing' | 'success' | 'error' | 'stalled';
  progressPercent: number;
  importMessage: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ 
  importStatus, 
  progressPercent, 
  importMessage 
}) => {
  if (importStatus !== 'processing' && progressPercent === 0) return null;
  
  return (
    <div className="space-y-2 mt-2">
      <div className="text-sm text-gray-600 flex justify-between">
        <span>{importMessage}</span>
        <span>{Math.round(progressPercent)}%</span>
      </div>
      <Progress value={progressPercent} className="h-2" />
    </div>
  );
};

export default ProgressIndicator;
