import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Video, Shield, Clock, Users, CheckCircle2, BookOpen, GraduationCap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const CounselorBookingSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCTA = () => {
    navigate("/counselors");
  };

  return (
    <section className="relative min-h-[500px] overflow-hidden">
      <div className="flex flex-col md:flex-row h-full min-h-[500px]">
        {/* Left side - Image at natural size */}
        <div className="relative w-full md:w-1/2 flex items-center justify-center bg-background">
          <img
            src="/images/career-couclior_page-removebg-preview.png"
            alt="Career counseling session"
            className="w-full max-w-[649px] h-auto object-contain"
          />
        </div>

        {/* Right side - Content with slant */}
        <div
          className="relative w-full md:w-1/2 flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, hsl(221.2 83.2% 53.3%) 0%, hsl(142.1 76.2% 36.3%) 100%)'
          }}
        >
          {/* Slant overlay from left */}
          <div
            className="absolute top-0 left-0 w-full h-full bg-background"
            style={{
              clipPath: 'polygon(0 0, 15% 0, 0 100%)'
            }}
          />

          <div className="relative z-10 p-8 md:p-16 text-center md:text-left max-w-md">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Book a Live Career Call
            </h2>
            <p className="text-lg text-white/90 leading-relaxed mb-6">
              Connect with verified career counselors for personalized 1-on-1 guidance.
            </p>
            <p className="text-sm text-white/70 mb-6">Starting from KSh 800 per session</p>
            <Button
              size="lg"
              onClick={handleCTA}
              className="bg-white text-primary hover:bg-white/90 rounded-full px-8 py-6 text-lg font-bold shadow-lg group transition-all"
            >
              View Counselors
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CounselorBookingSection;
