import { Button } from "@/components/ui/button";
import { ArrowRight, GraduationCap, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardPathForRole } from "@/types/roles";
import { useState, lazy, Suspense } from "react";
import BrandedLoader from "@/components/BrandedLoader";

// Lazy load the heavy Lottie player
const DotLottieReact = lazy(() => import("@lottiefiles/dotlottie-react").then(module => ({ default: module.DotLottieReact })));

const Hero = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<"student" | "mentor" | null>(null);
  const [showRoleOptions, setShowRoleOptions] = useState(true);

  const dashboardPath =
    user && profile
      ? getDashboardPathForRole(
        profile.role as "student" | "admin" | "mentor"
      )
      : "/student";

  const handleRoleSelect = (role: "student" | "mentor") => {
    setSelectedRole(role);
    setShowRoleOptions(false);
  };

  const handleGetStarted = () => {
    if (user) navigate(dashboardPath);
    else if (selectedRole) navigate(`/auth?mode=signup&role=${selectedRole}`);
  };

  const resetRoleSelection = () => {
    setSelectedRole(null);
    setShowRoleOptions(true);
  };

  return (
    <section className="min-h-screen flex items-center pt-16 relative overflow-hidden">
      {/* Background - Pure Gradient (Exact Restoration) */}
      <div className="absolute inset-0 -z-10 bg-surface">
        <div className="absolute inset-0 bg-gradient-to-br from-surface via-surface/95 to-primary/5" />
        
        {/* Mobile-only background image with brand-color shade */}
        <div className="absolute inset-0 lg:hidden opacity-[0.35] pointer-events-none">
          <img 
            src="/images/kenyan-student-graduating.png" 
            alt="Kenyan student graduation background" 
            className="w-full h-full object-cover"
          />
          {/* Brand-color "Shade" overlay from below */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-surface/40 to-surface/20" />
        </div>

        {/* Brand color accents */}
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-secondary/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/3" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 lg:py-20 w-full relative text-center lg:text-left">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* LEFT CONTENT */}
          <div className="space-y-6 sm:space-y-8">
            <h1 className="text-[2.85rem] sm:text-6xl lg:text-7xl font-bold font-serif leading-[1.05] tracking-tight text-foreground">
              Helping You Discover Your{" "}
              <span className="bg-gradient-text bg-clip-text text-transparent">
                Ideal Career Path.
              </span>
            </h1>

            <p className="text-lg text-foreground-muted leading-relaxed max-w-xl font-medium mx-auto lg:mx-0">
              Synchronize your academic potential with global career success. We map your educational journey from school pathways to university with absolute precision.
            </p>

            {/* Role selection - Exact Labels and Layout */}
            <div className="flex flex-col gap-4">
              {showRoleOptions ? (
                <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 sm:gap-4 items-center justify-center lg:justify-start">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-glow h-14 sm:h-16 text-base sm:text-lg px-4 sm:px-8 font-bold"
                    onClick={() => handleRoleSelect("student")}
                  >
                    <GraduationCap className="w-5 h-5 mr-1.5 sm:mr-2 flex-shrink-0" />
                    <span className="hidden sm:inline">I'm a Student</span>
                    <span className="sm:hidden">Student</span>
                  </Button>
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-glow h-14 sm:h-16 text-base sm:text-lg px-4 sm:px-8 font-bold"
                    onClick={() => handleRoleSelect("mentor")}
                  >
                    <BookOpen className="w-5 h-5 mr-1.5 sm:mr-2 flex-shrink-0" />
                    <span className="hidden sm:inline">I'm a Mentor</span>
                    <span className="sm:hidden">Mentor</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="col-span-2 sm:w-auto border-card-border hover:bg-surface h-14 sm:h-16 text-base sm:text-lg px-8 font-bold"
                    onClick={() => navigate("/quick-assessment")}
                  >
                    Quick Assessment
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start text-center lg:text-left">
                  <Button
                    size="lg"
                    className="w-full sm:flex-1 bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-glow h-14 sm:h-16 text-base sm:text-lg px-8 font-bold"
                    onClick={handleGetStarted}
                  >
                    {selectedRole === "student" ? "Start your journey" : "Start guiding students"}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto border-card-border hover:bg-surface h-14 sm:h-16 text-base sm:text-lg px-8 font-bold"
                    onClick={() => navigate("/quick-assessment")}
                  >
                    Quick Assessment
                  </Button>
                </div>
              )}

              {/* Back button to change role */}
              {selectedRole && !showRoleOptions && (
                <button
                  onClick={resetRoleSelection}
                  className="text-xs text-muted-foreground hover:text-foreground underline text-left sm:text-center w-full"
                >
                  Switching from {selectedRole}? Click here to reset.
                </button>
              )}
            </div>
          </div>


          {/* RIGHT CONTENT - Optimized LCP */}
          <div className="relative hidden lg:flex items-center justify-center lg:justify-end select-none min-h-[400px]">
            {/* Animation container - Optimized for LCP */}
            <div
              className="relative z-10 w-[110%] lg:w-[600px] xl:w-[700px] pointer-events-none"
              style={{
                marginRight: '-5%', // Slight overflow to the right
              }}
              aria-hidden="true"
            >
              <div className="aspect-[4/3] w-full flex items-center justify-center">
                {/* Using local STUDENT.svg animation file */}
                <img 
                  src="/images/STUDENT.svg" 
                  alt="Student career animation"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Subtle background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-primary/5 rounded-full blur-[140px] -z-0 pointer-events-none"></div>

            {/* Gentle decorative elements */}
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
            <div
              className="absolute -bottom-24 -left-24 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>
          </div>
        </div>
      </div>
    </section>

  );
};

export default Hero;
