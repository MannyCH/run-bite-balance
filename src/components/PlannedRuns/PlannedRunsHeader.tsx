
import React from "react";

interface PlannedRunsHeaderProps {
  importedRunsCount: number;
  manualRunsCount: number;
  totalRuns: number;
}

export const PlannedRunsHeader: React.FC<PlannedRunsHeaderProps> = ({
  importedRunsCount,
  manualRunsCount,
  totalRuns
}) => {
  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Planned Runs</h1>
          <p className="text-gray-600">
            View your upcoming runs and how they align with your meal schedule
          </p>
          <div className="flex gap-4 mt-2 text-sm text-gray-500">
            <span>📅 {importedRunsCount} imported runs</span>
            <span>✏️ {manualRunsCount} manual runs</span>
            <span>🍽️ Total: {totalRuns} planned runs</span>
          </div>
        </div>
      </div>
    </div>
  );
};
