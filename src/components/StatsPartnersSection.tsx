import { Button } from "@/components/ui/button";
import { Mail, ArrowRight } from "lucide-react";

const StatsPartnersSection = () => {
  return (
    <section className="pt-2 pb-12 lg:py-12 bg-gradient-hero">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main Card Container with theme colors */}
        <div className="bg-card/80 backdrop-blur-sm rounded-3xl border border-card-border overflow-hidden shadow-card hover:shadow-elevated transition-shadow duration-500">

          {/* Stats Section with Images */}
          <div className="p-8 md:p-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-text bg-clip-text text-transparent mb-4">
                Making an Impact Across Kenya
              </h2>
              <p className="text-foreground-muted max-w-2xl mx-auto">
                Join thousands of Kenyan students who've found their path with CareerGuide AI
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">

              {/* Card 1 - Students Guided */}
              <div className="group relative rounded-2xl overflow-hidden bg-surface/50 border border-card-border hover:border-primary/30 hover:shadow-glow transition-all duration-500">
                {/* Image Container with Blue Gradient Overlay */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src="/images/students.webp"
                    alt="Students"
                    width="400"
                    height="192"
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  {/* Blue gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/40 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <div className="text-4xl font-bold text-foreground drop-shadow-lg">500K+</div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="text-sm font-semibold text-primary uppercase tracking-wide mb-2">STUDENTS GUIDED</div>
                  <p className="text-foreground-muted text-sm">
                    Helping Kenyan students discover careers aligned with the CBE framework
                  </p>
                </div>
              </div>

              {/* Card 2 - Mentors Supporting */}
              <div className="group relative rounded-2xl overflow-hidden bg-surface/50 border border-card-border hover:border-primary/30 hover:shadow-glow transition-all duration-500">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src="/images/mentors.webp"
                    alt="Mentors"
                    width="400"
                    height="192"
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  {/* Blue gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/40 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <div className="text-4xl font-bold text-foreground drop-shadow-lg">25K+</div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="text-sm font-semibold text-primary uppercase tracking-wide mb-2">MENTORS SUPPORTING</div>
                  <p className="text-foreground-muted text-sm">
                    Parents, guardians, and community members guiding students through career decisions
                  </p>
                </div>
              </div>

              {/* Card 3 - Counties Covered */}
              <div className="group relative rounded-2xl overflow-hidden bg-surface/50 border border-card-border hover:border-primary/30 hover:shadow-glow transition-all duration-500">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src="/images/counties.webp"
                    alt="Kenya Counties"
                    width="400"
                    height="192"
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  {/* Blue gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/40 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <div className="text-4xl font-bold text-foreground drop-shadow-lg">47</div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="text-sm font-semibold text-primary uppercase tracking-wide mb-2">COUNTIES COVERED</div>
                  <p className="text-foreground-muted text-sm">
                    Nationwide reach serving students across all counties in Kenya
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section - Replaces Partners Section */}
          <div className="border-t border-card-border bg-gradient-surface py-10 px-8 md:px-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left space-y-2">
                <h3 className="text-2xl font-bold text-foreground">Want to help shape our future?</h3>
                <p className="text-foreground-muted max-w-md">Collaborate with CareerGuide AI to expand career guidance for students nationwide.</p>
              </div>
              
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
