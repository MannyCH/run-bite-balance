
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { AuthProvider } from "./context/AuthContext";
import AuthGuard from "./components/Auth/AuthGuard";
import { ShoppingListProvider } from "./context/ShoppingListContext";

import Index from "./pages/Index";
import PlannedMeals from "./pages/PlannedMeals";
import PastMeals from "./pages/PastMeals";
import SuggestedMeals from "./pages/SuggestedMeals";
import RecipeDetail from "./pages/RecipeDetail"; 
import PlannedRuns from "./pages/PlannedRuns";
import Auth from "./pages/Auth";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";
import ProfileSetup from "./pages/ProfileSetup";
import WeeklyMealPlanner from "./pages/WeeklyMealPlanner";
import ShoppingList from "./pages/ShoppingList";

// Create a QueryClient for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <ShoppingListProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={<AuthGuard><Index /></AuthGuard>} />
                <Route path="/planned-meals" element={<AuthGuard><PlannedMeals /></AuthGuard>} />
                <Route path="/past-meals" element={<AuthGuard><PastMeals /></AuthGuard>} />
                <Route path="/suggested-meals" element={<AuthGuard><SuggestedMeals /></AuthGuard>} />
                <Route path="/recipe/:id" element={<AuthGuard><RecipeDetail /></AuthGuard>} />
                <Route path="/planned-runs" element={<AuthGuard><PlannedRuns /></AuthGuard>} />
                <Route path="/account" element={<AuthGuard><Account /></AuthGuard>} />
                <Route path="/profile-setup" element={<AuthGuard><ProfileSetup /></AuthGuard>} />
                <Route path="/meal-planner" element={<AuthGuard><WeeklyMealPlanner /></AuthGuard>} />
                <Route path="/shopping-list" element={<AuthGuard><ShoppingList /></AuthGuard>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </ShoppingListProvider>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
