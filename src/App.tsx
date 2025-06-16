import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider, AuthGuard } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ProfileProvider, OnboardingCheck } from './context/ProfileContext';
import { ShoppingListProvider } from './context/ShoppingListContext';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import MealPlanner from './pages/MealPlanner';
import ShoppingList from './pages/ShoppingList';
import Onboarding from './pages/Onboarding';
import RecipeImporterPage from './pages/RecipeImporter';
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
                    <Route
                      path="/"
                      element={
                        <AuthGuard>
                          <OnboardingCheck>
                            <Home />
                          </OnboardingCheck>
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <AuthGuard>
                          <OnboardingCheck>
                            <Profile />
                          </OnboardingCheck>
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <AuthGuard>
                          <OnboardingCheck>
                            <Settings />
                          </OnboardingCheck>
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/meal-planner"
                      element={
                        <AuthGuard>
                          <OnboardingCheck>
                            <MealPlanner />
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
                    <Route path="/onboarding" element={<AuthGuard><Onboarding /></AuthGuard>} />
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
