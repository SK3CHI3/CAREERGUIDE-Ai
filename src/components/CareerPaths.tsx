import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Clock, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { dashboardService, CareerPath } from "@/lib/dashboard-service";
import CareerDetailModal from "./CareerDetailModal";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

const getDemandColor = (demand: string) => {
  switch (demand) {
    case "Very High": return "bg-success/20 text-success border-success/30";
    case "High": return "bg-primary/20 text-primary border-primary/30";
    case "Growing": return "bg-warning/20 text-warning border-warning/30";
    case "Emerging": return "bg-accent/20 text-accent border-accent/30";
    default: return "bg-foreground/20 text-foreground border-foreground/30";
  }
};

const CareerPaths = () => {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [dynamicCareerPaths, setDynamicCareerPaths] = useState<CareerPath[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCareer, setSelectedCareer] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { profile } = useAuth()

  useEffect(() => {
    const loadCareerPaths = async () => {
      try {
        setIsLoading(true)
        const paths = await dashboardService.getCareerPaths()
        // Filter for featured items and limit to 3
        const featuredPaths = paths.filter(p => p.is_featured).slice(0, 3)
        setDynamicCareerPaths(featuredPaths)
      } catch (err) {
        console.error('Failed to load career paths:', err)
        setError('Real-time career paths are currently unavailable. Showing last available data.')
        // dynamicCareerPaths will remain whatever it was from the DB (handled by service)
      } finally {
        setIsLoading(false)
      }
    }

    loadCareerPaths()
  }, [])

  if (isLoading) {
    return (
      <section id="careers" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-center">
            Trending{" "}
            <span className="bg-gradient-text bg-clip-text text-transparent">
              Careers in Kenya
            </span>
          </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Explore high-demand career paths in Kenya's evolving job market, 
              with real-time insights on demand, salaries, and growth projections.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="bg-gradient-surface border-card-border p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-muted rounded animate-pulse"></div>
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse"></div>
                    <div className="h-4 bg-muted rounded animate-pulse"></div>
                  </div>
                  <div className="h-10 bg-muted rounded animate-pulse"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section id="careers" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-destructive">{error}</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="careers" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold font-serif mb-6 text-center">
            Trending{" "}
            <span className="bg-gradient-text bg-clip-text text-transparent">
              Careers in Kenya
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Explore high-demand career paths in Kenya's evolving job market, 
            with real-time insights on demand, salaries, and growth projections.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {(isMobile ? dynamicCareerPaths.slice(0, 3) : dynamicCareerPaths).map((career) => (
            <Card 
              key={career.id}
              className="bg-gradient-surface border-card-border hover:shadow-card transition-all duration-300 group overflow-hidden flex flex-col"
            >
              <div className="relative h-48 w-full overflow-hidden bg-muted">
                <img 
                  src={career.image_url ? `${career.image_url}${career.image_url.includes('?') ? '&' : '?'}auto=format&fit=crop&w=600&q=80` : 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80'} 
                  alt={career.title}
                  width="400"
                  height="192"
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>

              <div className="p-6 space-y-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start gap-4">
                  <h3 
                    className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 cursor-pointer"
                    onClick={() => {
                      setSelectedCareer(career);
                      setIsModalOpen(true);
                    }}
                  >
                    {career.title}
                  </h3>
                  <Badge className={`whitespace-nowrap ${getDemandColor(career.demand_level)} border-none shadow-sm`}>
                    {career.demand_level}
                  </Badge>
                </div>

                <p className="text-muted-foreground text-sm line-clamp-2">
                  {career.description}
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Salary Range</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">{career.salary_range}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Growth Rate</span>
                    </div>
                    <span className="text-sm font-medium text-success">{career.growth_percentage}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Key Skills:</span>
                  <div className="flex flex-wrap gap-2">
                    {career.skills_required.map((skill, skillIndex) => (
                      <Badge 
                        key={skillIndex}
                        variant="outline"
                        className="text-xs border-card-border"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="mt-auto pt-4">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between hover:bg-surface group-hover:text-primary font-bold"
                    onClick={() => {
                      setSelectedCareer(career);
                      setIsModalOpen(true);
                    }}
                  >
                    View Details
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button 
            onClick={() => navigate('/careers')}
            size="lg"
            className="bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-glow px-10"
          >
            Explore All Careers
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>

      {selectedCareer && (
        <CareerDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          career={selectedCareer}
        />
      )}
    </section>
  );
};

export default CareerPaths;
