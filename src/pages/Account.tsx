
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import AccountSettings from "@/components/Auth/AccountSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfile } from "@/context/ProfileContext";
import { useAuth } from "@/context/AuthContext";
import { ProfileForm } from "@/components/Profile/ProfileForm";
import { RecipeSeasonalClassifier } from "@/components/Recipe/RecipeSeasonalClassifier";
import { RecipeMealTypeClassifier } from "@/components/Recipe/RecipeMealTypeClassifier";

const Account = () => {
  const { user } = useAuth();
  
  console.log('Account page: Rendering with user:', user?.email);
  
  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-semibold mb-6">Account Settings</h1>
        
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="recipes">Recipe Management</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>
          
          <TabsContent value="account">
            <AccountTab />
          </TabsContent>
          
          <TabsContent value="recipes">
            <RecipeManagementTab />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

const ProfileTab = () => {
  const { profile, isLoading } = useProfile();
  
  console.log('ProfileTab: Rendering with profile:', profile, 'isLoading:', isLoading);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>Loading your profile information...</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Profile</CardTitle>
        <CardDescription>
          Update your nutrition and fitness profile information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ProfileForm />
      </CardContent>
    </Card>
  );
};

const AccountTab = () => {
  console.log('AccountTab: Rendering');
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
        <CardDescription>
          Manage your account settings and authentication
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AccountSettings />
      </CardContent>
    </Card>
  );
};

const RecipeManagementTab = () => {
  console.log('RecipeManagementTab: Rendering');
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Recipe Classification Tools</CardTitle>
          <CardDescription>
            Manage and classify your recipe database for better meal planning
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecipeSeasonalClassifier />
        <RecipeMealTypeClassifier />
      </div>
    </div>
  );
};

export default Account;
