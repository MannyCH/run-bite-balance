
import React from "react";
import { Button } from "@/components/ui/button";
import { format, isSameDay } from "date-fns";

interface DaySelectorProps {
  days: Date[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export const DaySelector: React.FC<DaySelectorProps> = ({ 
  days, 
  selectedDate, 
  onSelectDate 
}) => {
  return (
    <div className="flex overflow-x-auto space-x-2 py-2 mb-6 scrollbar-hide">
      {days.map((date, i) => (
        <Button
          key={i}
          onClick={() => onSelectDate(date)}
          variant={isSameDay(date, selectedDate) ? "default" : "outline"}
          className={`min-w-[80px] sm:min-w-[100px] flex-shrink-0 ${isSameDay(date, selectedDate) ? "" : "bg-white"}`}
        >
          <div className="text-center">
            <div className="text-xs">{format(date, "EEE")}</div>
            <div className="font-bold text-xs sm:text-sm">{format(date, "MMM d")}</div>
          </div>
        </Button>
      ))}
    </div>
  );
};
