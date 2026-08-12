import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import BackgroundGradient from "@/components/BackgroundGradient";
import { CheckCircle2, Play, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";

export default function HowItWorks() {
  return (
    <div className="min-h-screen text-foreground overflow-x-hidden relative flex flex-col bg-background">
      <Helmet>
        <title>How It Works | CareerGuide AI Journey</title>
        <meta name="description" content="Discover the step-by-step process of CareerGuide AI. From synchronizing your profile to matching with your dream career and mapping your academic potential." />
      </Helmet>
      
      <BackgroundGradient />
      <Navigation />
      
      <main className="flex-1 pt-32 pb-24 text-center">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
          <div className="max-w-4xl mx-auto">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-8xl font-black mb-8 leading-[0.95] tracking-tight"
            >
              From Potential <br />
              <span className="bg-gradient-text bg-clip-text text-transparent italic font-serif">to Profession</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-foreground-muted font-medium leading-relaxed max-w-2xl mx-auto"
            >
              An end-to-end framework designed to eliminate career uncertainty for every Kenyan student in the CBE system.
            </motion.p>
          </div>
        </div>

        {/* Video Feature */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-40">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative p-12 md:p-24 rounded-[3rem] overflow-hidden shadow-3xl border border-card-border bg-card group flex items-center justify-center text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
            
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                <Play className="w-8 h-8 text-primary ml-1 relative z-10" />
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-75" />
              </div>
              <h3 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">
                Platform Walkthrough
              </h3>
              <p className="text-xl text-foreground-muted font-medium mb-8">
                Our complete deep-dive video demonstrating exactly how the CareerGuide AI engine interfaces with the CBC framework is currently in post-production.
              </p>
              <div className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-full bg-surface border border-card-border shadow-sm text-sm font-bold text-primary uppercase tracking-widest hover:scale-105 transition-transform cursor-default">
                <Clock className="w-4 h-4" /> Coming Soon
              </div>
            </div>
          </motion.div>
        </div>

        {/* Final CTA Full Width */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-60">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-primary rounded-[3.5rem] p-12 md:p-24 text-center overflow-hidden relative shadow-shadow-glow"
          >
            <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
              <CheckCircle2 className="w-64 h-64 text-white" />
            </div>
            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">
                Ready to discover your career path?
              </h2>
              <p className="text-xl text-primary-foreground/80 font-medium">
                Join thousands of students already using AI to unlock their potential and build their future.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <a href="/auth" className="bg-white text-primary px-10 py-5 rounded-full font-black text-lg shadow-xl hover:scale-105 transition-transform">
                  Get Started Today
                </a>
                <a href="/faq" className="bg-transparent border-2 border-white/20 text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-white/10 transition-colors">
                  Check FAQs
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
