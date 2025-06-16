
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { generateMealPlanForUser } from "@/utils/mealPlan";
import { format, addDays, isSameDay, isWithinInterval } from "date-fns";
import { Cloud, Thermometer, Calendar, Info, Activity } from "lucide-react";
import { useRunDebug } from "@/hooks/useRunDebug";

interface GenerateMealPlanProps {
  onMealPlanGenerated: () => Promise<void>;
}

export const GenerateMealPlan: React.FC<GenerateMealPlanProps> = ({
  onMealPlanGenerated
}) => {
  const { user } = useAuth();
  const { runs } = useApp();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [weatherInfo, setWeatherInfo] = useState<string | null>(null);
  
  // Debug hook to monitor runs
  const runDebug = useRunDebug();

  // Get current season for display
  const getCurrentSeason = () => {
    const month = new Date().getMonth() + 1; // 1-12
    if (month >= 3 && month <= 5) return 'Spring';
    if (month >= 6 && month <= 8) return 'Summer';
    if (month >= 9 && month <= 11) return 'Autumn';
    return 'Winter';
  };

  // Generate a new meal plan
  const handleGenerateMealPlan = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You need to be signed in to generate a meal plan.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setWeatherInfo("Fetching weather data for Bern, Switzerland...");
    
    try {
      // Calculate the meal plan date range (7 days starting from today)
      const today = new Date();
      const startDate = today;
      const endDate = addDays(today, 6); // 7 days total including today
      
      console.log(`Meal plan date range: ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);
      console.log(`Total runs available: ${runs.length}`);
      
      // Filter runs to only include planned runs within the meal plan date range
      const plannedRunsInRange = runs.filter(run => {
        const runDate = new Date(run.date);
        const isPlanned = run.isPlanned;
        const isInRange = isWithinInterval(runDate, { start: startDate, end: endDate });
        
        console.log(`Run "${run.title}" on ${format(runDate, 'yyyy-MM-dd')}: planned=${isPlanned}, inRange=${isInRange}`);
        
        return isPlanned && isInRange;
      });

      console.log(`Generating meal plan with ${plannedRunsInRange.length} planned runs in date range`);
      setWeatherInfo(`Found ${plannedRunsInRange.length} planned runs. Generating seasonal meal plan with pre/post-run snacks...`);
      
      // Log details of each run being passed
      plannedRunsInRange.forEach(run => {
        console.log(`- Run: ${run.title}, Date: ${format(new Date(run.date), 'yyyy-MM-dd')}, Distance: ${run.distance}km, Duration: ${Math.round(run.duration / 60)}min`);
      });

      const result = await generateMealPlanForUser(user.id, plannedRunsInRange);

      if (result) {
        setWeatherInfo("Meal plan generated successfully with seasonal considerations and run-specific snacks!");
        toast({
          title: "Success",
          description: `Your seasonal meal plan has been generated with ${plannedRunsInRange.length} run days included!`,
        });
        // Refresh data
        await onMealPlanGenerated();
      } else {
        toast({
          title: "Error",
          description: "Failed to generate a meal plan. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating meal plan:', error);
      toast({
        title: "Error",
        description: "Something went wrong while generating your meal plan.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setTimeout(() => setWeatherInfo(null), 5000); // Clear weather info after 5 seconds
    }
  };

  return (
    <div className="space-y-4">
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Generate Seasonal Meal Plan
              </h3>
              <p className="text-muted-foreground">
                Generate a personalized plan based on your profile, planned runs, and current weather
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Thermometer className="h-4 w-4" />
                  <span>Current season: {getCurrentSeason()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Cloud className="h-4 w-4" />
                  <span>Location: Bern, Switzerland</span>
                </div>
                <div className="flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  <span>{runDebug.runsThisWeek} runs this week</span>
                </div>
              </div>
            </div>
            <Button 
              onClick={handleGenerateMealPlan}
              disabled={isGenerating}
              size="lg"
            >
              {isGenerating ? 'Generating...' : 'Generate New Plan'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {weatherInfo && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            {weatherInfo}
          </AlertDescription>
        </Alert>
      )}

      <Alert className="border-orange-200 bg-orange-50">
        <Info className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <div className="space-y-1">
            <div className="font-medium">Run-Aware Meal Planning</div>
            <div className="text-sm">
              Found {runDebug.runsThisWeek} runs planned for this week. Your meal plan will include 
              pre-run snacks (light carbs) and post-run snacks (protein + carbs) for optimal performance 
              and recovery. Make sure your runs are marked as "planned" in the Planned Runs page.
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};
