
import React from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import NutritionSummary from "../components/Dashboard/NutritionSummary";
import RunSummary from "../components/Dashboard/RunSummary";
import WeeklyCalendar from "../components/Dashboard/WeeklyCalendar";
import ActivityTimeline from "../components/Dashboard/ActivityTimeline";
import { useApp } from "@/context/AppContext";

const Index: React.FC = () => {
  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Track your nutrition and training all in one place
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <WeeklyCalendar />
        <NutritionSummary />
        <RunSummary />
      </div>

      <div className="mb-6">
        <ActivityTimeline />
      </div>
    </MainLayout>
  );
};

export default Index;
