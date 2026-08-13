import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Video, Shield, Clock, Users, CheckCircle2, BookOpen, GraduationCap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const CounselorBookingSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCTA = () => {
    if (user) {
      navigate("/student/counselors");
    } else {
      navigate("/auth?mode=signup&role=student");
    }
  };

  return (
    <section className="relative min-h-[700px] overflow-hidden">
      <div className="flex h-full">
        {/* Left side - Image with slant */}
        <div className="absolute inset-0 w-full">
          <img
            src="/images/career-couclior page.jpg"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right side - Dark overlay with slant */}
        <div
          className="absolute top-0 right-0 w-full h-full bg-background"
          style={{
            clipPath: 'polygon(40% 0, 100% 0, 100% 100%, 25% 100%)'
          }}
        />

        {/* Content */}
        <div className="relative z-10 w-full h-full">
          {/* Top left text on image */}
          <div className="absolute top-8 left-8 md:top-16 md:left-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg text-left">
              Book a Live Career Call
            </h2>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed drop-shadow-md text-left max-w-md">
              Connect with verified career counselors for personalized 1-on-1 guidance.
            </p>
          </div>

          {/* Bottom right CTA on dark side */}
          <div className="absolute bottom-8 right-8 md:bottom-16 md:right-16 text-right">
            <div className="space-y-4 max-w-sm">
              <p className="text-foreground/90">Starting from KSh 800 per session</p>
              <Button
                size="lg"
                onClick={handleCTA}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-6 text-lg font-bold shadow-glow group transition-all"
              >
                View Counselors
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CounselorBookingSection;
