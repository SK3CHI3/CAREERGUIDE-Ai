import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import PaymentGate from "@/components/PaymentGate";
import { ThemeProvider } from "@/components/ThemeProvider";
import BrandedLoader from "@/components/BrandedLoader";
import ScrollToTop from "./components/ScrollToTop";
import FeedbackWidget from "./components/FeedbackWidget";
import CookieBanner from "./components/CookieBanner";
import InstallPrompt from "./components/InstallPrompt";
import SmartRoot from "./components/SmartRoot";

// Lazy load pages for performance
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const About = lazy(() => import("./pages/About"));
const FAQ = lazy(() => import("./pages/FAQ"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const StudentChatPage = lazy(() => import("./pages/StudentChatPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const TeacherDashboard = lazy(() => import("./pages/MentorDashboard"));
const StudentCounselingPage = lazy(() => import("./pages/StudentCounselingPage"));
const ClassDetail = lazy(() => import("./pages/ClassDetail"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Counselors = lazy(() => import("./pages/Counselors"));
const QuickAssessment = lazy(() => import("./pages/QuickAssessment"));
const Careers = lazy(() => import("./pages/Careers"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const BlogIndex = lazy(() => import("./pages/BlogIndex"));
const BlogPostPage = lazy(() => import("./pages/BlogPost"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
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
              <Route path="/auth" element={<Auth />} />
              <Route path="/about" element={<About />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/careers/:slug" element={<Careers />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/quick-assessment" element={<QuickAssessment />} />
              <Route path="/counselors" element={<Counselors />} />
              <Route
                path="/student"
                element={
                  <ProtectedRoute requiredRole="student">
                    <PaymentGate>
                      <StudentDashboard />
                    </PaymentGate>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/chat"
                element={
                  <ProtectedRoute requiredRole="student">
                    <PaymentGate>
                      <StudentChatPage />
                    </PaymentGate>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/counseling"
                element={
                  <ProtectedRoute requiredRole="student">
                    <PaymentGate>
                      <StudentCounselingPage />
                    </PaymentGate>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/counselors"
                element={
                  <ProtectedRoute requiredRole="student">
                    <PaymentGate>
                      <Counselors />
                    </PaymentGate>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mentor"
                element={
                  <ProtectedRoute requiredRole="mentor">
                    <TeacherDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mentor/class/:classId"
                element={
                  <ProtectedRoute requiredRole="mentor">
                    <ClassDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="/blog" element={<BlogIndex />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <FeedbackWidget />
          <CookieBanner />
          </BrowserRouter>
        </ThemeProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
