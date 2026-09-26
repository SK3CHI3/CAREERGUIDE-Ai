import { useEffect } from "react";
import { useLocation } from "react-router-dom";
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
import CounselorBookingSection from "@/components/CounselorBookingSection";

const Index = () => {
  const location = useLocation();

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
        <title>CareerGuide AI | Free Career Guidance for Kenyan Students</title>
        <meta name="description" content="Discover your ideal career path with AI-powered guidance aligned to Kenya's CBC education system. Free assessment, trending careers, and personalized recommendations." />
        <meta name="keywords" content="career guidance Kenya, CBC careers, AI career assessment, free career test, Kenyan students, career paths, university programmes" />
        <link rel="canonical" href="https://careerguideai.co.ke/" />
        {/* Open Graph / LLM indexing support */}
        <meta property="og:title" content="CareerGuide AI - Free Career Guidance for Kenyan Students" />
        <meta property="og:description" content="AI-powered career guidance aligned with Kenya's Competency-Based Education framework. Take our free assessment and discover your path." />
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
            },
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "CareerGuide AI",
              "url": "https://careerguideai.co.ke",
              "logo": "https://careerguideai.co.ke/logos/CareerGuide_Logo.webp",
              "description": "Free AI-powered career guidance for Kenyan students, aligned with the CBC education system.",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Nairobi",
                "addressCountry": "Kenya"
              }
            },
            {
              "@context": "https://schema.org",
              "@type": "Service",
              "name": "Career Assessment",
              "provider": {
                "@type": "Organization",
                "name": "CareerGuide AI"
              },
              "description": "Free AI-driven career assessment and guidance for Kenyan students."
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
          <FeatureShowcase />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <CareerPaths />
        </motion.div>

        <div id="quick-assessment" className="quick-assessment-section">
          <QuickAssessmentSection />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <CounselorBookingSection />
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
          <StatsPartnersSection />
        </motion.div>

      </main>
      <Footer />
    </div>
  );
};

export default Index;
