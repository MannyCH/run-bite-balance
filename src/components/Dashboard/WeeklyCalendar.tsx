
import React from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, MapPin, UtensilsCrossed } from 'lucide-react';

const WeeklyCalendar: React.FC = () => {
  const { meals, runs, selectedDate, setSelectedDate } = useApp();
  const startOfTheWeek = startOfWeek(selectedDate, { weekStartsOn: 1 });

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(startOfTheWeek, i);
    const dayMeals = meals.filter(meal => isSameDay(new Date(meal.date), date));
    const dayRuns = runs.filter(run => isSameDay(new Date(run.date), date));
    
    return {
      date,
      meals: dayMeals,
      runs: dayRuns,
      isSelected: isSameDay(date, selectedDate)
    };
  });

  const handlePrevWeek = () => {
    setSelectedDate(addDays(startOfTheWeek, -7));
  };

  const handleNextWeek = () => {
    setSelectedDate(addDays(startOfTheWeek, 7));
  };

  const handleDaySelect = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Weekly Overview</CardTitle>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrevWeek}
            className="p-1 rounded hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium">
            {format(startOfTheWeek, 'MMM d')} - {format(addDays(startOfTheWeek, 6), 'MMM d, yyyy')}
          </span>
          <button
            onClick={handleNextWeek}
            className="p-1 rounded hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, i) => (
            <div
              key={i}
              className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition-colors ${
                day.isSelected 
                  ? 'bg-teal-100 border-2 border-teal-500' 
                  : isSameDay(day.date, new Date())
                    ? 'bg-blue-50'
                    : 'hover:bg-gray-50'
              }`}
              onClick={() => handleDaySelect(day.date)}
            >
              <div className="text-xs text-center mb-1">{format(day.date, 'EEE')}</div>
              <div 
                className={`flex items-center justify-center h-8 w-8 rounded-full ${
                  day.isSelected 
                    ? 'bg-teal-500 text-white' 
                    : ''
                }`}
              >
                {format(day.date, 'd')}
              </div>
              <div className="mt-2 flex gap-1">
                {day.meals.length > 0 && (
                  <div className="flex items-center">
                    <UtensilsCrossed className="w-3 h-3 text-teal-600" />
                    <span className="text-xs ml-1">{day.meals.length}</span>
                  </div>
                )}
                {day.runs.length > 0 && (
                  <div className="flex items-center">
                    <MapPin className="w-3 h-3 text-blue-600" />
                    <span className="text-xs ml-1">{day.runs.length}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyCalendar;
