
import React from "react";
import MainLayout from "../components/Layout/MainLayout";
import ActivityTimeline from "../components/Dashboard/ActivityTimeline";
import { useApp } from "@/context/AppContext";
import { useMealPlan } from "@/hooks/useMealPlan";

const Index: React.FC = () => {
  const { runs } = useApp();
  const { mealPlanItems, recipes } = useMealPlan();

  // Filter for only imported runs
  const importedRuns = runs.filter(run => run.isImported);

  return (
    <MainLayout>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Track your nutrition and training all in one place
        </p>
      </div>

      <div className="mb-6">
        <ActivityTimeline 
          runs={importedRuns} 
          mealPlanItems={mealPlanItems} 
          recipes={recipes}
        />
      </div>
    </MainLayout>
  );
};

export default Index;
