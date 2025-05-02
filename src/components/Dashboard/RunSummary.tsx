
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useApp } from "@/context/AppContext";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";

const RunSummary: React.FC = () => {
  const { runs, selectedDate } = useApp();

  // Get the start and end of the current week
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });

  // Filter runs for the current week
  const thisWeekRuns = runs.filter(run => {
    const runDate = new Date(run.date);
    return runDate >= weekStart && runDate <= weekEnd;
  });

  // Calculate weekly totals
  const totalDistance = thisWeekRuns.reduce((sum, run) => sum + run.distance, 0);
  const totalDuration = thisWeekRuns.reduce((sum, run) => sum + run.duration, 0) / 60; // convert to minutes
  const totalActivities = thisWeekRuns.length;

  // Prepare data for the bar chart
  const chartData = [];
  for (let i = 0; i < 7; i++) {
    const day = addDays(weekStart, i);
    const dayRuns = thisWeekRuns.filter(run => {
      const runDate = new Date(run.date);
      return (
        runDate.getDate() === day.getDate() &&
        runDate.getMonth() === day.getMonth() &&
        runDate.getFullYear() === day.getFullYear()
      );
    });
    
    const dayDistance = dayRuns.reduce((sum, run) => sum + run.distance, 0);
    
    chartData.push({
      name: format(day, "EEE"),
      distance: dayDistance,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Running Summary</CardTitle>
        <CardDescription>
          {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-500 text-sm">Distance</div>
            <div className="text-2xl font-semibold">{totalDistance.toFixed(1)} km</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-500 text-sm">Duration</div>
            <div className="text-2xl font-semibold">{Math.round(totalDuration)} min</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-500 text-sm">Activities</div>
            <div className="text-2xl font-semibold">{totalActivities}</div>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis
                label={{ 
                  value: 'Distance (km)', 
                  angle: -90, 
                  position: 'insideLeft'
                }}
              />
              <Tooltip 
                formatter={(value, name) => [`${value} km`, 'Distance']}
              />
              <Bar dataKey="distance" fill="#2DD4BF" name="Distance (km)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RunSummary;
