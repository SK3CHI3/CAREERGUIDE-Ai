import { CheckCircle2, ShieldCheck, BarChart3, Bot, BookOpen, Target, ArrowRight, Building2, UserCircle2, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion, useInView, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const Counter = ({ value, duration = 2 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const controls = animate(0, value, {
        duration,
        onUpdate: (latest) => setCount(Math.floor(latest)),
      });
      return () => controls.stop();
    }
  }, [value, duration, isInView]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
};

const FeatureShowcase = () => {
  const navigate = useNavigate();

  return (
    <section id="features" className="py-24 bg-surface relative overflow-hidden font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-32">
        
        {/* For Students Section */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Dashboard Mockup (Students) */}
          <div className="order-2 lg:order-1 bg-card rounded-2xl shadow-elevated border border-border overflow-hidden h-auto min-h-[600px] flex flex-col group/dashboard">
            <div className="bg-primary px-6 py-6 flex-shrink-0 flex items-center gap-3.5 text-primary-foreground">
              <div className="bg-white/10 border border-white/20 p-2 rounded-lg shrink-0">
                <UserCircle2 className="w-6 h-6 text-primary-foreground/90" />
              </div>
              <div>
                <h3 className="font-semibold text-base leading-tight text-white/95">Amina's Progress</h3>
                <p className="text-primary-foreground/70 text-sm font-medium mt-0.5">Academic Potential</p>
              </div>
            </div>
            
            <div className="p-8 flex-1 flex flex-col justify-between relative">
              {/* Looping Graphic Background */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-64 opacity-[0.03] pointer-events-none overflow-hidden flex items-center justify-center">
                 <motion.div 
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.2, 1],
                  }}
                  transition={{ 
                    duration: 20, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                  className="w-[500px] h-[500px] border-8 border-dashed border-primary rounded-full"
                 />
              </div>

              <div className="relative z-10">
                <h4 className="text-[15px] font-bold text-foreground mb-6">Professional Alignment</h4>
                <div className="space-y-4 mb-4">
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ margin: "-50px" }}
                    className="flex justify-between items-center p-4 border border-border rounded-xl bg-card shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                        <Target className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-foreground text-[14px]">Software Engineer</span>
                    </div>
                    <span className="text-primary font-black text-[14px]"><Counter value={95} />% Match</span>
                  </motion.div>
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ margin: "-50px" }}
                    transition={{ delay: 0.1 }}
                    className="flex justify-between items-center p-4 border border-border rounded-xl bg-card shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-secondary/10 text-secondary rounded-full flex items-center justify-center">
                        <BarChart3 className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-foreground text-[14px]">Data Analyst</span>
                    </div>
                    <span className="text-primary font-black text-[14px]"><Counter value={88} />% Match</span>
                  </motion.div>
                </div>
              </div>
              
              <div className="pt-6 border-t border-border mt-auto relative z-10">
                <h4 className="text-[15px] font-bold text-foreground mb-4">Academic Mapping Guide</h4>
                <div className="p-5 bg-primary/5 border border-primary/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    <h5 className="font-bold text-foreground text-[14px]">STEM Pathway Recommended</h5>
                  </div>
                  <p className="text-sm text-foreground-muted font-medium mb-4 pl-4 leading-relaxed">Focus on Computer Science and Mathematics for your desired career.</p>
                  <Button variant="outline" className="w-full rounded-xl border-primary/20 text-primary hover:bg-primary/10 text-[13px] font-bold h-10 shadow-sm">View Mapping</Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="order-1 lg:order-2 space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold font-serif text-foreground leading-tight">
              What do students get?
            </h2>
            
            <p className="text-lg text-foreground-muted leading-relaxed max-w-lg font-medium">
              We help you find the perfect intersection between your passions and Kenya's emerging job market.
            </p>
            
            <div className="space-y-6 pt-4">
              <div className="flex items-start gap-5 bg-card p-5 rounded-2xl shadow-sm border border-border">
                <div className="bg-primary/10 p-2.5 rounded-full text-primary shrink-0 border border-primary/20">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="pt-0.5">
                  <h4 className="text-[15px] font-bold text-card-foreground mb-1">AI-Powered Career Matching</h4>
                  <p className="text-sm text-foreground-muted leading-snug font-medium">Career matches based on your interests, personality, academic strengths, and Kenya's job market trends.</p>
                </div>
              </div>

              {/* Career Days Highlighted Section */}
              <div className="flex items-start gap-5 bg-primary/5 p-6 rounded-2xl border border-primary/20 shadow-glow-sm relative overflow-hidden group hover:scale-[1.02] transition-all">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Sparkles className="w-12 h-12 text-primary" />
                </div>
                <div className="bg-primary/20 p-3 rounded-xl text-primary shrink-0 border border-primary/30">
                  <Target className="w-6 h-6" />
                </div>
                <div className="pt-0.5">
                  <h4 className="text-lg font-bold text-card-foreground mb-1.5 flex items-center gap-2">
                    Career Days & Scholarships
                  </h4>
                  <p className="text-sm text-foreground-muted leading-relaxed font-medium">
                    Spend a day with professionals in your target field and unlock exclusive scholarship opportunities to fund your dreams.
                  </p>
                </div>
              </div>

              {/* Career Counseling Section */}
              <div className="flex items-start gap-5 bg-card p-5 rounded-2xl shadow-sm border border-border group hover:border-primary/30 transition-colors">
                <div className="bg-primary/10 p-2.5 rounded-full text-primary shrink-0 border border-primary/20">
                  <UserCircle2 className="w-5 h-5" />
                </div>
                <div className="pt-0.5">
                  <h4 className="text-[15px] font-bold text-card-foreground mb-1">Career Counseling</h4>
                  <p className="text-sm text-foreground-muted leading-snug font-medium">Book 1-on-1 sessions with certified career experts to refine your path.</p>
                </div>
              </div>
            </div>
            
            <div className="pt-6">
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-6 text-[15px] font-semibold border-none shadow-sm transition-all shadow-glow"
                onClick={() => navigate('/auth')}
              >
                Start your journey <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

        </div>

        {/* For Mentors Section */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left Content */}
          <div className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold font-serif text-foreground leading-tight">
              What do mentors get?
            </h2>

            <p className="text-lg text-foreground-muted leading-relaxed max-w-lg font-medium">
              Empower your mentees with data-driven insights to support their unique career journey through the CBE curriculum.
            </p>

            <div className="space-y-6 pt-4">
              <div className="flex items-start gap-5 bg-card p-5 rounded-2xl shadow-sm border border-border">
                <div className="bg-secondary/10 p-2.5 rounded-full text-secondary shrink-0 border border-secondary/20">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="pt-0.5">
                  <h4 className="text-[15px] font-bold text-card-foreground mb-1">AI Academic Synchronization</h4>
                  <p className="text-sm text-foreground-muted leading-snug font-medium">Use precision AI insights to help students synchronize their educational journey with future opportunities.</p>
                </div>
              </div>

              {/* Mentor Career Days Sync */}
              <div className="flex items-start gap-5 bg-secondary/5 p-6 rounded-2xl border border-secondary/20 shadow-glow-sm relative overflow-hidden group hover:scale-[1.02] transition-all">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Building2 className="w-12 h-12 text-secondary" />
                </div>
                <div className="bg-secondary/20 p-3 rounded-xl text-secondary shrink-0 border border-secondary/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="pt-0.5">
                  <h4 className="text-lg font-bold text-card-foreground mb-1.5">Career Days Sync</h4>
                  <p className="text-sm text-foreground-muted leading-relaxed font-medium">
                    Connect students with industry experts and organize immersive experiences that enhance their career preparation.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 pt-6">
              <Button
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-full px-7 py-6 text-[15px] font-semibold shadow-sm transition-all border-none"
                onClick={() => navigate('/auth?role=mentor')}
              >
                Become a mentor <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Right Dashboard Mockup */}
          <div className="bg-card rounded-2xl shadow-elevated border border-border overflow-hidden h-[540px] flex flex-col group/school relative">
            {/* Header */}
            <div className="bg-secondary px-6 py-[18px] flex-shrink-0 flex items-center gap-3.5 text-secondary-foreground relative z-20">
              <div className="bg-white/10 border border-white/20 p-2 rounded-lg shrink-0">
                <UserCircle2 className="w-5 h-5 text-secondary-foreground/90" />
              </div>
              <div>
                <h3 className="font-semibold text-[15px] leading-tight text-white/95">Mentor Dashboard</h3>
                <p className="text-secondary-foreground/70 text-[13px] font-medium mt-0.5">Guiding Students</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-8 flex-1 flex flex-col justify-between overflow-hidden relative z-10">
              {/* Looping Graphic Background */}
              <div className="absolute inset-x-0 bottom-0 h-64 opacity-[0.04] pointer-events-none overflow-hidden flex items-center justify-center">
                 <motion.div
                  animate={{
                    scale: [1, 1.5, 1],
                    y: [0, -20, 0]
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-[600px] h-[600px] bg-secondary rounded-full blur-[100px]"
                 />
              </div>

              <div className="flex justify-between items-center pb-6 border-b border-border relative z-20">
                <div className="text-center w-1/3">
                  <div className="text-2xl font-bold text-foreground leading-none mb-1"><Counter value={247} /></div>
                  <div className="text-[12px] text-foreground-muted font-medium">Students</div>
                </div>
                <div className="text-center w-1/3">
                  <div className="text-2xl font-bold text-foreground leading-none mb-1"><Counter value={1842} /></div>
                  <div className="text-[12px] text-foreground-muted font-medium">Chats</div>
                </div>
                <div className="text-center w-1/3 border-r-0">
                  <div className="text-2xl font-bold text-foreground leading-none mb-1"><Counter value={89} />%</div>
                  <div className="text-[12px] text-foreground-muted font-medium">Success</div>
                </div>
              </div>

              <div className="py-6 border-b border-border relative z-20">
                <div className="flex justify-between items-end mb-4">
                  <h4 className="text-[13px] font-bold text-foreground">Student Progress</h4>
                  <span className="text-[11px] text-foreground-muted font-medium">Active now</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "G10", val: 75, width: "75%" },
                    { label: "G11", val: 60, width: "60%" }
                  ].map((row, i) => (
                    <div key={i} className="flex items-center text-[11px]">
                      <span className="w-10 text-foreground-muted font-medium">{row.label}</span>
                      <div className="flex-1 h-2 bg-surface-light rounded-full mx-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: row.width }}
                          transition={{ duration: 1, delay: i * 0.2 }}
                          className="bg-secondary h-full rounded-full"
                        ></motion.div>
                      </div>
                      <span className="w-8 text-right font-bold text-foreground"><Counter value={row.val} />%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 relative z-20">
                <h4 className="text-[13px] font-bold text-foreground mb-3">Recent Insights</h4>
                <ul className="text-[12px] space-y-2 text-foreground-muted font-medium italic">
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary shrink-0"></div>
                    Interests in STEM quantified
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-secondary shrink-0"></div>
                    Subject selection trending
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>


      </div>
    </section>
  );
};

export default FeatureShowcase;

