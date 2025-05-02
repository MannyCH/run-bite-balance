
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";

import Index from "./pages/Index";
import PlannedMeals from "./pages/PlannedMeals";
import PastMeals from "./pages/PastMeals";
import SuggestedMeals from "./pages/SuggestedMeals";
import PlannedRuns from "./pages/PlannedRuns";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/planned-meals" element={<PlannedMeals />} />
            <Route path="/past-meals" element={<PastMeals />} />
            <Route path="/suggested-meals" element={<SuggestedMeals />} />
            <Route path="/planned-runs" element={<PlannedRuns />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
