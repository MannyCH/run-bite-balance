
import React from "react";
import { format, isSameDay } from "date-fns";
import { MapPin, Route, Calendar as CalendarIcon, Clock } from "lucide-react";
import { Run } from "@/context/types";

interface RunListProps {
  runs: Run[];
  selectedDate: Date;
}

export const RunList: React.FC<RunListProps> = ({ runs, selectedDate }) => {
  const selectedDateRuns = runs.filter((run) => 
    isSameDay(new Date(run.date), selectedDate)
  );

  if (selectedDateRuns.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No runs planned for this date</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {selectedDateRuns.map((run) => (
        <div
          key={run.id}
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
              <span className="text-gray-500 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {format(new Date(run.date), "h:mm a")}
              </span>
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
      ))}
    </div>
  );
};
