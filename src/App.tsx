
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import AuthGuard from './components/Auth/AuthGuard';
import { AppProvider } from './context/AppContext';
import { ProfileProvider } from './context/ProfileContext';
import OnboardingCheck from './components/Auth/OnboardingCheck';
import { ShoppingListProvider } from './context/ShoppingListContext';
import WeeklyMealPlanner from './pages/WeeklyMealPlanner';
import Account from './pages/Account';
import ShoppingList from './pages/ShoppingList';
import ProfileSetup from './pages/ProfileSetup';
import RecipeImporterPage from './pages/RecipeImporter';
import SuggestedMeals from './pages/SuggestedMeals';
import PlannedRuns from './pages/PlannedRuns';
import RecipeDetail from './pages/RecipeDetail';
import Auth from './pages/Auth';
import { Toaster } from 'sonner';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <ProfileProvider>
            <AppProvider>
              <ShoppingListProvider>
                <div className="min-h-screen bg-background">
                  <Routes>
                    {/* Public auth route */}
                    <Route path="/auth" element={<Auth />} />
                    
                    {/* Protected routes */}
                    <Route
                      path="/"
                      element={
                        <AuthGuard>
                          <OnboardingCheck>
                            <WeeklyMealPlanner />
                          </OnboardingCheck>
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <AuthGuard>
                          <OnboardingCheck>
                            <Account />
                          </OnboardingCheck>
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/account"
                      element={
                        <AuthGuard>
                          <OnboardingCheck>
                            <Account />
                          </OnboardingCheck>
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <AuthGuard>
                          <OnboardingCheck>
                            <Account />
                          </OnboardingCheck>
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/meal-planner"
                      element={
                        <AuthGuard>
                          <OnboardingCheck>
                            <WeeklyMealPlanner />
                          </OnboardingCheck>
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/shopping-list"
                      element={
                        <AuthGuard>
                          <OnboardingCheck>
                            <ShoppingList />
                          </OnboardingCheck>
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/suggested-meals"
                      element={
                        <AuthGuard>
                          <OnboardingCheck>
                            <SuggestedMeals />
                          </OnboardingCheck>
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/planned-runs"
                      element={
                        <AuthGuard>
                          <OnboardingCheck>
                            <PlannedRuns />
                          </OnboardingCheck>
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/recipe/:id"
                      element={
                        <AuthGuard>
                          <OnboardingCheck>
                            <RecipeDetail />
                          </OnboardingCheck>
                        </AuthGuard>
                      }
                    />
                    <Route 
                      path="/onboarding" 
                      element={
                        <AuthGuard>
                          <ProfileSetup />
                        </AuthGuard>
                      } 
                    />
                    <Route
                      path="/recipe-importer"
                      element={
                        <AuthGuard>
                          <OnboardingCheck>
                            <RecipeImporterPage />
                          </OnboardingCheck>
                        </AuthGuard>
                      }
                    />
                  </Routes>
                </div>
                <Toaster />
              </ShoppingListProvider>
            </AppProvider>
          </ProfileProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
