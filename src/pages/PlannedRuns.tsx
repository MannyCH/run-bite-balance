
import React, { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { useApp } from "@/context/AppContext";
import { RunImportActions } from "@/components/RunManagement/RunImportActions";
import { PlannedRunsHeader } from "@/components/PlannedRuns/PlannedRunsHeader";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { MapPin, Route, Clock } from "lucide-react";

const PlannedRuns: React.FC = () => {
  const { 
    runs, 
    importRunsFromIcal, 
    isLoadingImportedRuns 
  } = useApp();

  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // Filter for planned runs only
  const plannedRuns = runs.filter((run) => run.isPlanned);

  // Count imported vs manual runs
  const importedRunsCount = plannedRuns.filter(run => run.isImported).length;
  const manualRunsCount = plannedRuns.filter(run => !run.isImported).length;

  return (
    <MainLayout>
      <div className="flex justify-between items-start mb-6 sm:mb-8 pt-16 lg:pt-0">
        <PlannedRunsHeader 
          importedRunsCount={importedRunsCount}
          manualRunsCount={manualRunsCount}
          totalRuns={plannedRuns.length}
        />
        
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Runs</DialogTitle>
            </DialogHeader>
            <RunImportActions 
              onImportRuns={importRunsFromIcal}
              isLoading={isLoadingImportedRuns}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-8">
        {plannedRuns.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No planned runs found</p>
            <p className="text-gray-400 text-sm mt-2">Use the settings icon above to import runs from your calendar</p>
          </div>
        ) : (
          plannedRuns.map((run) => (
            <div key={run.id} className="space-y-3">
              {/* Prominent date header */}
              <div className="flex items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {format(new Date(run.date), "EEEE, MMMM d, yyyy")}
                </h2>
                <div className="ml-4 flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  <span className="font-medium">
                    {format(new Date(run.date), "h:mm a")}
                  </span>
                </div>
              </div>
              
              {/* Run details card */}
              <div
                className={`flex flex-col md:flex-row bg-white rounded-lg shadow overflow-hidden ${
                  run.isImported ? 'border-l-4 border-blue-500' : 'border-l-4 border-green-500'
                }`}
              >
                {run.imgUrl && (
                  <div className="md:w-1/3">
                    <img
                      src={run.imgUrl}
                      alt={run.title}
                      className="h-48 w-full md:h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4 flex-1">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                    <div className="flex items-center">
                      {run.isImported ? (
                        <Route className="mr-2 h-5 w-5 text-blue-500" />
                      ) : (
                        <MapPin className="mr-2 h-5 w-5 text-green-500" />
                      )}
                      <h3 className="text-lg font-semibold">
                        {run.title} 
                        {run.isImported && (
                          <span className="text-xs text-blue-500 ml-2 bg-blue-100 px-2 py-1 rounded-full">
                            Imported
                          </span>
                        )}
                      </h3>
                    </div>
                  </div>
                  {run.route && (
                    <p className="text-gray-600 mb-2">
                      <span>Route: {run.route}</span>
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">
                      {run.distance} km
                    </span>
                    <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded">
                      {Math.floor(run.duration / 60)} min
                    </span>
                    <span className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded">
                      {run.pace}/km pace
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </MainLayout>
  );
};

export default PlannedRuns;
