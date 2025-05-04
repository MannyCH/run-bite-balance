
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BasicInfoForm } from "./BasicInfoForm";
import { FitnessInfoForm } from "./FitnessInfoForm";
import { DietaryInfoForm } from "./DietaryInfoForm";
import { PreferencesForm } from "./PreferencesForm";
import { Button } from "@/components/ui/button";

interface ProfileEditTabsProps {
  onSave: () => void;
}

export function ProfileEditTabs({ onSave }: ProfileEditTabsProps) {
  return (
    <>
      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="fitness">Fitness</TabsTrigger>
          <TabsTrigger value="dietary">Diet</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic">
          <BasicInfoForm />
        </TabsContent>
        
        <TabsContent value="fitness">
          <FitnessInfoForm />
        </TabsContent>
        
        <TabsContent value="dietary">
          <DietaryInfoForm />
        </TabsContent>
        
        <TabsContent value="preferences">
          <PreferencesForm />
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end mt-6">
        <Button onClick={onSave}>
          Save Changes
        </Button>
      </div>
    </>
  );
}
