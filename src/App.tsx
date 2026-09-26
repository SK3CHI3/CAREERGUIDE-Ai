import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import BrandedLoader from "@/components/BrandedLoader";
import ScrollToTop from "./components/ScrollToTop";
import FeedbackWidget from "./components/FeedbackWidget";
import CookieBanner from "./components/CookieBanner";
import InstallPrompt from "./components/InstallPrompt";
import SmartRoot from "./components/SmartRoot";
import AdminGuard from "./components/AdminGuard";
import { initializeTracking } from "@/lib/tracking-service";

// Lazy load pages for performance
const Index = lazy(() => import("./pages/Index"));
const About = lazy(() => import("./pages/About"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Chat = lazy(() => import("./pages/Chat"));
const QuickAssessment = lazy(() => import("./pages/QuickAssessment"));
const SubjectGuide = lazy(() => import("./pages/SubjectGuide"));
const Careers = lazy(() => import("./pages/Careers"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const BlogIndex = lazy(() => import("./pages/BlogIndex"));
const BlogPostPage = lazy(() => import("./pages/BlogPost"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Initialize anonymous tracking on app load
    initializeTracking();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <Toaster />
          <Sonner />
          <InstallPrompt />
          <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<BrandedLoader fullScreen />}>
            <Routes>
              <Route path="/" element={<SmartRoot />} />
              <Route path="/about" element={<About />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/careers/:slug" element={<Careers />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/quick-assessment" element={<QuickAssessment />} />
              <Route path="/subject-guide" element={<SubjectGuide />} />
              <Route path="/blog" element={<BlogIndex />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <FeedbackWidget />
          <CookieBanner />
          </BrowserRouter>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
