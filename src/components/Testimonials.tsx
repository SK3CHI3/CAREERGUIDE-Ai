import { useCallback, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Quote, CheckCircle2 } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useIsMobile } from '@/hooks/use-mobile';

const testimonials = [
  {
    name: "Sarah Omolo",
    role: "Secondary Student",
    quote: "The CBE pathway matching helped me realize that my passion for arts could lead to a career in Digital Design. Life-changing!",
    initials: "SO"
  },
  {
    name: "John Kamau",
    role: "Parent & Mentor",
    quote: "As a parent, this tool has made it easy to guide my child through their career choices. The AI insights are accurate and locally relevant to Kenyan trends.",
    initials: "JK"
  },
  {
    name: "Faith Mutua",
    role: "TVET Candidate",
    quote: "I was confused about diploma options. CareerGuide AI showed me the exact technical routes that pay well today.",
    initials: "FM"
  }
];

const Testimonials = () => {
  const isMobile = useIsMobile();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' }, [Autoplay({ delay: 5000 })]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  return (
    <section className="py-20 relative overflow-hidden bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-bold font-serif tracking-tight mb-4 text-center">
            Trusted by students, teachers & schools
          </h2>
          <p className="text-base sm:text-lg text-foreground-muted font-medium max-w-2xl mx-auto">
            Hear how Career Guide AI is making a difference across Kenya's CBE community.
          </p>
        </div>

        {/* Desktop Grid (3 columns) / Mobile Slider (Embla) */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <Card key={i} className="p-8 border-card-border bg-card/50 backdrop-blur-sm relative flex flex-col h-full shadow-sm hover:shadow-glow transition-all duration-500">
              <Quote className="w-8 h-8 text-primary/10 absolute top-6 right-6" />
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <blockquote className="text-lg leading-relaxed tracking-tight flex-1 font-bold italic text-foreground/90 mb-8">
                "{t.quote}"
              </blockquote>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/5 text-primary text-sm font-bold">{t.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold text-base tracking-tight">{t.name}</div>
                  <div className="text-xs text-foreground-muted font-bold tracking-wide uppercase">{t.role}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Mobile/Tablet Slider */}
        <div className="lg:hidden">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {testimonials.map((t, i) => (
                <div key={`mobile-${i}`} className="flex-[0_0_100%] min-w-0 pl-4 sm:flex-[0_0_50%]">
                  <Card className="p-8 border-card-border bg-card/60 backdrop-blur-sm relative flex flex-col h-full shadow-lg">
                    <Quote className="w-10 h-10 text-primary/10 absolute top-4 right-4" />
                    <div className="flex gap-1 mb-6">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <blockquote className="text-xl leading-relaxed tracking-tight mb-8 font-bold italic text-foreground/90">
                      "{t.quote}"
                    </blockquote>
                    <div className="mt-auto pt-6 border-t border-card-border flex items-center gap-4">
                      <Avatar className="h-12 w-12 border-2 border-primary/30">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">{t.initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-semibold text-base truncate">{t.name}</div>
                        <div className="text-xs text-foreground-muted font-bold truncate tracking-wide uppercase">{t.role}</div>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  selectedIndex === i ? 'w-8 bg-primary' : 'w-2 bg-primary/20'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
