import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Bot, ChevronDown } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";

const scrollToSection = (id: string) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
};

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (sectionId: string) => {
    setIsOpen(false);
    if (location.pathname !== "/") {
      navigate("/", { state: { scrollTo: sectionId } });
    } else {
      scrollToSection(sectionId);
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-card-border safe-area-top">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => navigate("/")}
              className="flex-shrink-0 flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <img
                src="/logos/CareerGuide_Logo.webp"
                alt="CareerGuide AI"
                width="160"
                height="40"
                fetchpriority="high"
                className="h-10 w-auto"
              />
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">

              <div className="relative group py-4">
                <button className="text-foreground-muted group-hover:text-foreground transition-colors flex items-center gap-1 font-medium">
                  Product <ChevronDown className="w-4 h-4 opacity-70 group-hover:rotate-180 transition-transform duration-200" />
                </button>
                <div className="absolute top-full left-0 mt-[-0.5rem] w-48 bg-background/95 backdrop-blur-xl border border-card-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                  <div className="py-2 flex flex-col">
                    <button onClick={() => navigate('/quick-assessment')} className="px-4 py-2.5 text-left text-sm hover:bg-muted text-foreground-muted hover:text-foreground transition-colors">Quick Assessment</button>
                    <button onClick={() => navigate('/chat')} className="px-4 py-2.5 text-left text-sm hover:bg-muted text-foreground-muted hover:text-foreground transition-colors">AI Chat</button>
                    <button onClick={() => handleNavClick('careers')} className="px-4 py-2.5 text-left text-sm hover:bg-muted text-foreground-muted hover:text-foreground transition-colors">Career Paths</button>
                    <button onClick={() => navigate('/subject-guide')} className="px-4 py-2.5 text-left text-sm hover:bg-muted text-foreground-muted hover:text-foreground transition-colors">Subject Guide</button>
                  </div>
                </div>
              </div>

              <div className="relative group py-4">
                <button className="text-foreground-muted group-hover:text-foreground transition-colors flex items-center gap-1 font-medium">
                  Company <ChevronDown className="w-4 h-4 opacity-70 group-hover:rotate-180 transition-transform duration-200" />
                </button>
                <div className="absolute top-full left-0 mt-[-0.5rem] w-48 bg-background/95 backdrop-blur-xl border border-card-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                  <div className="py-2 flex flex-col">
                    <button onClick={() => navigate('/about')} className="px-4 py-2.5 text-left text-sm hover:bg-muted text-foreground-muted hover:text-foreground transition-colors">About Us</button>
                    <button onClick={() => navigate('/faq')} className="px-4 py-2.5 text-left text-sm hover:bg-muted text-foreground-muted hover:text-foreground transition-colors">FAQ</button>
                    <button onClick={() => navigate('/blog')} className="px-4 py-2.5 text-left text-sm hover:bg-muted text-foreground-muted hover:text-foreground transition-colors">Blog</button>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            <Button
              className="bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-glow"
              onClick={() => navigate('/quick-assessment')}
            >
              Start Assessment
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="text-foreground-muted h-10 w-10"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="md:hidden overflow-hidden"
            >
              <div className="px-2 pt-2 pb-6 space-y-1 bg-surface/95 backdrop-blur-xl rounded-2xl mt-2 border border-card-border shadow-2xl mx-1 mb-4">
                <button onClick={() => { navigate('/quick-assessment'); setIsOpen(false); }} className="block w-full text-left px-4 py-3 text-foreground-muted hover:text-foreground hover:bg-muted/50 rounded-xl transition-all">
                  Quick Assessment
                </button>
                <button onClick={() => { navigate('/chat'); setIsOpen(false); }} className="block w-full text-left px-4 py-3 text-foreground-muted hover:text-foreground hover:bg-muted/50 rounded-xl transition-all">
                  AI Chat
                </button>
                <button onClick={() => handleNavClick('careers')} className="block w-full text-left px-4 py-3 text-foreground-muted hover:text-foreground hover:bg-muted/50 rounded-xl transition-all">
                  Career Paths
                </button>
                <button onClick={() => { navigate('/subject-guide'); setIsOpen(false); }} className="block w-full text-left px-4 py-3 text-foreground-muted hover:text-foreground hover:bg-muted/50 rounded-xl transition-all">
                  Subject Guide
                </button>
                <button onClick={() => { navigate('/about'); setIsOpen(false); }} className="block w-full text-left px-4 py-3 text-foreground-muted hover:text-foreground hover:bg-muted/50 rounded-xl transition-all">
                  About
                </button>
                <button onClick={() => { navigate('/faq'); setIsOpen(false); }} className="block w-full text-left px-4 py-3 text-foreground-muted hover:text-foreground hover:bg-muted/50 rounded-xl transition-all">
                  FAQ
                </button>
                <button onClick={() => { navigate('/blog'); setIsOpen(false); }} className="block w-full text-left px-4 py-3 text-foreground-muted hover:text-foreground hover:bg-muted/50 rounded-xl transition-all">
                  Blog
                </button>
                <div className="pt-4 mt-2 border-t border-card-border/50 px-2">
                  <Button
                    className="w-full bg-gradient-primary text-primary-foreground shadow-glow h-12 rounded-xl"
                    onClick={() => {
                      navigate('/quick-assessment');
                      setIsOpen(false);
                    }}
                  >
                    Start Assessment
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navigation;
