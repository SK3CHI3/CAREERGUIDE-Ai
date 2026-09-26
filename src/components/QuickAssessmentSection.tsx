// Optimized Mobile/PC Hybrid Assessment Section - Finalized v1.0
import { useState, useRef, useEffect, Suspense, lazy } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Bot, 
  Sparkles, 
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

// Lazy load Lottie for performance
const DotLottieReact = lazy(() => import('@lottiefiles/dotlottie-react').then(mod => ({ default: mod.DotLottieReact })));

const MOCK_CHAT_SEQUENCE = [
  { role: 'bot', text: "Karibu! I'm CareerGuide AI. Let's find your perfect professional synchrony. What subjects do you find most engaging?" },
  { role: 'user', text: "I really enjoy Computer Science and Art & Design." },
  { role: 'bot', text: "That's a powerful combination! You could explore Software Engineering, Digital Design, or Animation." },
  { role: 'user', text: "Digital Design sounds interesting! What academic potential do I need to show?" },
  { role: 'bot', text: "For Digital Design, focus on excelling in Mathematics, Art, and Computer Studies. Would you like to see a full academic mapping?" }
];

const QuickAssessmentSection = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Animation state for the PC teaser chat
  const [teaserMessages, setTeaserMessages] = useState<{ role: 'ai' | 'user', content: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-playing animation for PC view (Restored exactly from GitHub)
  useEffect(() => {
    if (isMobile) return;

    let currentIdx = 0;
    let isMounted = true;

    const playSequence = async () => {
      if (!isMounted) return;
      
      if (currentIdx >= MOCK_CHAT_SEQUENCE.length) {
        setTimeout(() => {
          if (isMounted) {
            setTeaserMessages([]);
            currentIdx = 0;
            playSequence();
          }
        }, 5000);
        return;
      }

      setIsTyping(true);
      await new Promise(r => setTimeout(r, 1500));
      if (!isMounted) return;
      
      setIsTyping(false);
      
      const nextMsg = MOCK_CHAT_SEQUENCE[currentIdx];
      setTeaserMessages(prev => [...prev, {
        role: nextMsg.role === 'bot' ? 'ai' : 'user',
        content: nextMsg.text
      }]);
      
      currentIdx++;
      setTimeout(playSequence, 2500);
    };

    playSequence();
    return () => { isMounted = false; };
  }, [isMobile]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [teaserMessages, isTyping]);

  return (
    <section id="quick-assessment" className="py-20 relative overflow-hidden bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 sm:gap-16 items-center">
          
          {/* Left Side: Content (Exact Restoration for PC) */}
          <div className="space-y-8 sm:space-y-10 text-center lg:text-left">

            <h2 className="text-3xl sm:text-5xl lg:text-7xl font-bold font-serif tracking-tight leading-[1.1]">
              Discover paths your <br />
              <span className="bg-gradient-text bg-clip-text text-transparent italic pr-2">future self</span> 
              will thank you for.
            </h2>
            
            <p className="text-lg sm:text-xl text-foreground-muted font-bold max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Take a 2-minute chat-based assessment to uncover careers that match your unique personality and CBE learning areas.
            </p>

            {/* Benefits List (Original PC Feature) */}
            <div className="hidden lg:grid grid-cols-1 gap-4 py-4">
              {[
                "Clear CBE pathway recommendations",
                "Downloadable personalized career PDF",
                "Real-time Kenyan market demand insights"
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-foreground/80 font-semibold text-sm">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Visual Element - MOBILE ONLY */}
            <div className="lg:hidden space-y-6">
              <div className="relative aspect-video sm:aspect-square w-full max-w-[500px] mx-auto rounded-[2rem] overflow-hidden border border-card-border/30 bg-card shadow-2xl">
                {isMobile ? (
                  <img 
                    src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&q=80&w=800"
                    alt="AI Quick Assessment"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Suspense fallback={<div className="w-full h-full bg-surface animate-pulse" />}>
                    <DotLottieReact
                      src="https://lottie.host/809c99ec-2f16-419b-9807-68b209e86015/Gv4Z2kYh4N.lottie"
                      loop
                      autoplay
                      className="w-full h-full scale-105"
                    />
                  </Suspense>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" />
              </div>
            </div>

            {/* ACTION BUTTON - PC specific text vs Mobile specific text */}
            <div className="flex justify-center lg:justify-start">
              <Button 
                size="lg"
                className="h-14 sm:h-16 px-10 sm:px-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-glow text-lg rounded-2xl group"
                onClick={() => navigate("/chat")}
              >
                <span className="hidden lg:inline">Start Chatting Now</span>
                <span className="lg:hidden">Chat with AI</span>
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>

          {/* Right Side: Automated Teaser Chat - Hidden on Mobile to stay compact as requested */}
          <div className="relative hidden lg:block">
            <Card className="border-card-border bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col h-[500px] sm:h-[600px] rounded-[2.5rem]">
              {/* Automated Chat Messages */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 scroll-smooth"
              >
                {teaserMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] p-4 sm:p-5 rounded-[1.5rem] text-[15px] sm:text-base font-bold leading-relaxed tracking-tight shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-tr-none shadow-md' 
                        : 'bg-surface border border-card-border rounded-tl-none text-foreground'
                    }`}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                
                {isTyping && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-surface border border-card-border p-5 rounded-2xl rounded-tl-none flex gap-1">
                      <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-primary rounded-full"></motion.div>
                      <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary rounded-full"></motion.div>
                      <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary rounded-full"></motion.div>
                    </div>
                  </motion.div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default QuickAssessmentSection;
