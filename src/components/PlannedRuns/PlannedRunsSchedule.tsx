
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format, isSameDay } from "date-fns";
import { RunList } from "@/components/RunManagement/RunList";
import { Run } from "@/context/types";

interface PlannedRunsScheduleProps {
  selectedDate: Date;
  plannedRuns: Run[];
}

export const PlannedRunsSchedule: React.FC<PlannedRunsScheduleProps> = ({
  selectedDate,
  plannedRuns
}) => {
  const runsForDate = plannedRuns.filter(run => 
    isSameDay(new Date(run.date), selectedDate)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Schedule for {format(selectedDate, "MMMM d, yyyy")}
        </CardTitle>
        <CardDescription>
          {runsForDate.length} runs planned
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RunList runs={plannedRuns} selectedDate={selectedDate} />
      </CardContent>
    </Card>
  );
};
