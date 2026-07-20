import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import CareerPaths from "@/components/CareerPaths";
import QuickAssessmentSection from "@/components/QuickAssessmentSection";
import Footer from "@/components/Footer";
import FeatureShowcase from "@/components/FeatureShowcase";
import Testimonials from "@/components/Testimonials";
import BackgroundGradient from "@/components/BackgroundGradient";
import StatsPartnersSection from "@/components/StatsPartnersSection.tsx";
import CallingCard from "@/components/CallingCard";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardPathForRole } from "@/types/roles";

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user && profile) {
      const dashboardPath = getDashboardPathForRole(profile.role as "student" | "admin" | "school" | "mentor");
      navigate(dashboardPath, { replace: true });
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (location.state && (location.state as any).scrollTo) {
      const sectionId = (location.state as any).scrollTo;
      // Add a small delay to ensure the page has rendered
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
      // Clear the state so it doesn't scroll again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  return (
    <div className="min-h-screen text-foreground overflow-x-hidden relative">
      <Helmet>
        <title>CareerGuide AI | Kenya's Most Advanced AI Academic Synchronizer</title>
        <meta name="description" content="Synchronize your academic potential with professional success. CareerGuide AI provides precision educational mapping and specialized AI guidance for all Kenyan students." />
        <meta name="keywords" content="Academic potential mapping, educational synchronization, AI career counseling Kenya, professional roadmaps, university transition guidance" />
        <link rel="canonical" href="https://careerguideai.co.ke/" />
        {/* Open Graph / LLM indexing support */}
        <meta property="og:title" content="CareerGuide AI - The Future of Career Guidance in Kenya" />
        <meta property="og:description" content="AI-powered career guidance aligned with Kenya's Competency-Based Education framework." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://careerguideai.co.ke/" />
        <meta property="og:image" content="https://careerguideai.co.ke/logos/CareerGuide_Logo.webp" />
        
        {/* Organization JSON-LD for AI & Google Brand Recognition */}
        <script type="application/ld+json">
          {JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "CareerGuide AI",
              "url": "https://careerguideai.co.ke",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://careerguideai.co.ke/auth?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            },
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "CareerGuide AI",
              "url": "https://careerguideai.co.ke",
              "logo": "https://careerguideai.co.ke/logos/CareerGuide_Logo.webp",
              "description": "The intelligence layer for Kenyan higher education, synchronizing academic potential with global career success.",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Nairobi",
                "addressCountry": "Kenya"
              }
            },
            {
              "@context": "https://schema.org",
              "@type": "Service",
              "name": "Academic Potential Mapping",
              "provider": {
                "@type": "Organization",
                "name": "CareerGuide AI"
              },
              "description": "Professional AI-driven mapping of school results to university degrees and global career paths."
            }
          ])}
        </script>
      </Helmet>
      
      <BackgroundGradient />
      <Navigation />
      <main>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Hero />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <StatsPartnersSection />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <FeatureShowcase />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <Testimonials />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <CareerPaths />
        </motion.div>

        <div id="guest-chat" className="guest-chat-section">
          <QuickAssessmentSection />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <CallingCard />
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
