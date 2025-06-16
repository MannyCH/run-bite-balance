
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { isSameDay } from "date-fns";
import { Run } from "@/context/types";

interface PlannedRunsCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  plannedRuns: Run[];
}

export const PlannedRunsCalendar: React.FC<PlannedRunsCalendarProps> = ({
  selectedDate,
  onSelectDate,
  plannedRuns
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar</CardTitle>
        <CardDescription>Select a date to view planned runs</CardDescription>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onSelectDate(date)}
          className="rounded-md border pointer-events-auto"
          modifiers={{
            hasRuns: (date) => plannedRuns.some(run => 
              isSameDay(new Date(run.date), date)
            )
          }}
          modifiersStyles={{
            hasRuns: { 
              backgroundColor: '#dbeafe', 
              color: '#1e40af',
              fontWeight: 'bold'
            }
          }}
        />
      </CardContent>
    </Card>
  );
};
