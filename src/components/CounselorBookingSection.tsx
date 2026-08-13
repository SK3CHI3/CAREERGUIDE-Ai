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
    <section className="relative py-16 sm:py-24">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/career-counselor-page.jpg"
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative z-10 w-full">
        {/* Content Container - Full width */}
        <div className="min-h-[700px] relative w-full">

          {/* Top left text */}
          <div className="absolute top-4 left-4 sm:top-8 sm:left-8 md:top-16 md:left-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg text-left">
              Book a Live Career Call
            </h2>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed drop-shadow-md text-left max-w-lg">
              Connect with verified career counselors for personalized 1-on-1 guidance.
            </p>
          </div>

          {/* Bottom right CTA */}
          <div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 md:bottom-16 md:right-16">
            <div className="text-right space-y-4 max-w-md">
              <p className="text-white/90 drop-shadow-md">Starting from KSh 800 per session</p>
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

        {/* Bottom fade gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>
    </section>
  );
};

export default CounselorBookingSection;
