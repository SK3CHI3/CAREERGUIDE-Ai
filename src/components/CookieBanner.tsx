import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCookieConsent, setCookieConsent } from '@/lib/cache-utils';

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = getCookieConsent();
    if (consent === null) {
      // Show after a short delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    setCookieConsent(true);
    setIsVisible(false);
  };

  const handleDecline = () => {
    setCookieConsent(false);
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-6 right-6 z-[100] max-w-sm w-full"
        >
          <div className="bg-background/80 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden group">
            {/* Background Decoration */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors duration-500" />
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                  <Cookie className="w-6 h-6 text-primary animate-pulse" />
                </div>
                <button 
                  onClick={() => setIsVisible(false)}
                  aria-label="Close cookie notice"
                  className="text-foreground-muted hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                We use cookies! 🍪
              </h3>
              
              <p className="text-sm text-foreground-muted mb-6 leading-relaxed">
                Just to keep things fast and save your progress while you explore. No crumbs left behind, we promise!
              </p>

              <div className="flex items-center gap-3">
                <Button 
                  onClick={handleAccept}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20"
                >
                  Sounds good
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleDecline}
                  className="text-foreground-muted hover:text-foreground hover:bg-white/5"
                >
                  Not now
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;
