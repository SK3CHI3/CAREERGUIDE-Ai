import { Button } from "@/components/ui/button";
import { Mail, ArrowRight } from "lucide-react";

const StatsPartnersSection = () => {
  return (
    <section className="relative pt-2 pb-12 lg:py-12">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/A Junior Secondary Learner in the Phase Four Campus in Grade Seven learning.jpg.webp"
          alt=""
          className="w-full h-full object-cover"
        />
        {/* Subtle overlay for text readability */}
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Content Container - No card, just content on image */}
        <div className="min-h-[500px] flex flex-col">

          {/* Left side text */}
          <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
                Making an Impact Across Kenya
              </h2>
              <p className="text-lg md:text-xl text-white/90 leading-relaxed drop-shadow-md">
                Join thousands of Kenyan students who've found their path with CareerGuide AI
              </p>
            </div>
          </div>

          {/* Bottom right CTA */}
          <div className="p-8 md:p-12 flex justify-end">
            <div className="text-right space-y-4 max-w-md">
              <h3 className="text-xl md:text-2xl font-bold text-white drop-shadow-lg">Want to help shape our future?</h3>
              <p className="text-white/90 drop-shadow-md">Collaborate with CareerGuide AI to expand career guidance for students nationwide.</p>
              <Button
                onClick={() => window.location.href = 'mailto:hello@careerguideai.com'}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-6 text-lg font-bold shadow-glow group transition-all"
              >
                <Mail className="w-5 h-5 mr-2" />
                Partner With Us
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsPartnersSection;
