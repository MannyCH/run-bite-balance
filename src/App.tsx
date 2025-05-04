
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { AuthProvider } from "./context/AuthContext";
import AuthGuard from "./components/Auth/AuthGuard";

import Index from "./pages/Index";
import PlannedMeals from "./pages/PlannedMeals";
import PastMeals from "./pages/PastMeals";
import SuggestedMeals from "./pages/SuggestedMeals";
import PlannedRuns from "./pages/PlannedRuns";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<AuthGuard><Index /></AuthGuard>} />
              <Route path="/planned-meals" element={<AuthGuard><PlannedMeals /></AuthGuard>} />
              <Route path="/past-meals" element={<AuthGuard><PastMeals /></AuthGuard>} />
              <Route path="/suggested-meals" element={<AuthGuard><SuggestedMeals /></AuthGuard>} />
              <Route path="/planned-runs" element={<AuthGuard><PlannedRuns /></AuthGuard>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AppProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
