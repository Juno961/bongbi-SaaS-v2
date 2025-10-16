import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Calculator from "./pages/Calculator";
import OrderHistory from "./pages/OrderHistory";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { sendPageView, initGA4 } from "./lib/analytics";

const queryClient = new QueryClient();

const RouteChangeHandler = () => {
  const location = useLocation();
  const DEBUG = (import.meta as any).env?.VITE_GA4_DEBUG === 'true';

  // 1) 앱 최초 진입 시 1회 page_view 보장
  useEffect(() => {
    try { initGA4(); } catch {}
    try {
      if (DEBUG) console.info('[GA4] page_view', window.location.pathname);
      sendPageView(window.location.pathname);
    } catch {}
  }, []);

  // 2) 경로 변경마다 page_view 전송
  useEffect(() => {
    try { initGA4(); } catch {}
    try {
      if (DEBUG) console.info('[GA4] page_view', location.pathname);
      sendPageView(location.pathname + location.search);
    } catch {}
  }, [location.pathname, location.search]);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <RouteChangeHandler />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/help" element={<Help />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
