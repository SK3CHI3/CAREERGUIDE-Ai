import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TrendingUp, DollarSign, Search, ArrowRight, Filter, Sparkles } from "lucide-react";
import { dashboardService, CareerPath } from "@/lib/dashboard-service";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import BackgroundGradient from "@/components/BackgroundGradient";
import { motion, AnimatePresence } from "framer-motion";
import CareerDetailModal from "@/components/CareerDetailModal";
import { useAuth } from "@/contexts/AuthContext";
import { Helmet } from "react-helmet-async";

const Careers = () => {
  const [careers, setCareers] = useState<CareerPath[]>([]);
  const [filteredCareers, setFilteredCareers] = useState<CareerPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCareer, setSelectedCareer] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemsToShow, setItemsToShow] = useState(12);
   const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { slug } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  useEffect(() => {
     const loadCareers = async () => {
      try {
        setIsLoading(true);
        const paths = await dashboardService.getCareerPaths();
        setCareers(paths);
        setFilteredCareers(paths);

        // Handle direct linking via slug
        if (slug) {
          const matchedCareer = paths.find(c => c.slug === slug || c.id === slug);
          if (matchedCareer) {
            setSelectedCareer(matchedCareer);
            setIsModalOpen(true);
          }
        }
      } catch (err) {
        console.error("Failed to load career paths:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadCareers();
  }, [slug]);

  useEffect(() => {
    if (careers.length === 0) return; // Don't filter if no data yet
    
    const filtered = careers.filter(career => {
      const matchesSearch = career.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          career.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || career.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    setFilteredCareers(filtered);
    setItemsToShow(12); // Reset pagination when filters change
  }, [searchQuery, selectedCategory, careers]);

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setItemsToShow(prev => prev + 12);
      setIsLoadingMore(false);
    }, 400);
  };

  const categories = ["All", ...Array.from(new Set(careers.map(c => c.category)))];

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case "Very High": return "bg-success/20 text-success border-success/30";
      case "High": return "bg-primary/20 text-primary border-primary/30";
      case "Growing": return "bg-warning/20 text-warning border-warning/30";
      case "Emerging": return "bg-accent/20 text-accent border-accent/30";
      default: return "bg-foreground/20 text-foreground border-foreground/30";
    }
  };

  return (
    <div className="min-h-screen text-foreground relative overflow-x-hidden pt-20">
      <Helmet>
        <title>Career Library | AI-Powered Guidance for Kenya's CBE System</title>
        <meta name="description" content="Explore high-demand career paths in Kenya. Get AI-powered insights on salary ranges, growth rates, and skill requirements for modern CBE pathways." />
        <meta property="og:title" content="Kenya's Career Library | CareerGuide AI" />
        <meta property="og:description" content="Discover your perfect career path with AI-driven insights into Kenya's evolving job market." />
        
        {/* JSON-LD for AI & Search Discoverability */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Kenya's Career Library",
            "description": "Comprehensive library of high-demand career paths in Kenya.",
            "url": window.location.href,
            "itemListElement": filteredCareers.slice(0, 12).map((career, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "item": {
                "@type": "Occupation",
                "name": career.title,
                "description": career.description,
                "occupationalCategory": career.category,
                "estimatedSalary": {
                  "@type": "MonetaryAmount",
                  "currency": "KES",
                  "description": career.salary_range
                }
              }
            }))
          })}
        </script>
      </Helmet>
      <BackgroundGradient />
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 relative z-10">
        <div className="text-center mb-8 md:mb-16">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 bg-gradient-text bg-clip-text text-transparent px-2">
            Explore Your Future
          </h1>
          <p className="text-lg md:text-xl text-foreground-muted max-w-3xl mx-auto leading-relaxed px-4">
            Discover a comprehensive library of high-demand career paths in Kenya. 
            From technology to healthcare, find where your skills fit best.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-8 md:mb-12 items-center justify-between bg-card/50 backdrop-blur-sm p-4 md:p-6 rounded-2xl border border-card-border">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -transform -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <Input 
              placeholder="Search careers, skills, or industries..." 
              className="pl-10 bg-background border-card-border h-11 md:h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <Filter className="w-4 h-4 text-foreground-muted shrink-0" />
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap shadow-sm ${
                  selectedCategory === cat 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted/50 text-foreground-muted hover:bg-muted'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-gradient-surface border-card-border p-6 h-[300px] animate-pulse" />
            ))}
          </div>
        ) : filteredCareers.length > 0 ? (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {filteredCareers.slice(0, itemsToShow).map((career, index) => (
                <motion.div
                  key={career.id}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: (index % 12) * 0.05 }}
                  whileHover={{ y: -5 }}
                >
                <Card className="bg-gradient-surface border-card-border hover:shadow-card transition-all duration-300 h-full flex flex-col group overflow-hidden">
                  {/* Image Section */}
                  <div className="relative h-48 w-full overflow-hidden bg-muted">
                    <img 
                      src={career.image_url || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?fit=crop&w=800&q=80'} 
                      alt={career.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>

                  {/* Content Section */}
                  <div className="p-6 flex-1 flex flex-col space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <h3 
                        className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 cursor-pointer"
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

                    <p className="text-muted-foreground mb-6 flex-1 line-clamp-2 text-sm">
                      {career.description}
                    </p>
                  
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-foreground-muted" />
                          <span className="text-sm text-foreground-muted">Salary Range</span>
                        </div>
                        <span className="text-sm font-semibold text-foreground">{career.salary_range}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                           <TrendingUp className="w-4 h-4 text-foreground-muted" />
                          <span className="text-sm text-foreground-muted">Growth Rate</span>
                        </div>
                        <span className="text-sm font-semibold text-success">{career.growth_percentage}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 pt-2">
                       <Button 
                        variant="outline"
                        onClick={() => {
                          setSelectedCareer(career);
                          setIsModalOpen(true);
                        }}
                        className="bg-muted/50 border-border hover:bg-muted text-foreground transition-all font-bold"
                      >
                        Details
                      </Button>
                      <Button 
                        onClick={() => navigate(`/quick-assessment?career=${encodeURIComponent(career.title)}`)}
                        className="bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 transition-all font-bold"
                      >
                        Assess Fit
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {itemsToShow < filteredCareers.length && (
            <div className="flex justify-center mt-16">
              <Button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                size="lg"
                className="bg-card hover:bg-muted text-foreground border border-card-border px-12 py-6 rounded-2xl shadow-elevated hover:shadow-glow transition-all duration-300 font-bold text-lg group"
              >
                {isLoadingMore ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Load More Careers</span>
                    <TrendingUp className="w-5 h-5 group-hover:translate-y-[-2px] transition-transform" />
                  </div>
                )}
              </Button>
            </div>
          )}
        </div>
        ) : (
          <div className="text-center py-20 bg-card/30 rounded-3xl border border-dashed border-card-border">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-foreground-muted" />
            </div>
            <h3 className="text-xl font-bold mb-2">No careers found</h3>
            <p className="text-foreground-muted">Try adjusting your search or category filters.</p>
            <Button 
              variant="link" 
              onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
              className="mt-4 text-primary"
            >
              Reset all filters
            </Button>
          </div>
        )}
      </main>
      
      <div className="bg-primary/5 py-20 border-y border-primary/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <img 
            src="/logos/CareerGuide_Logo.webp" 
            alt="CareerGuide AI" 
            className="h-16 w-auto mx-auto mb-6" 
          />
          <h2 className="text-3xl font-bold mb-4 italic">"Not sure where to start?"</h2>
          <p className="text-lg text-foreground-muted mb-8">
            Tell our AI counselor about your interests and we'll map out the perfect path for you.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/quick-assessment')}
            className="bg-gradient-primary shadow-glow hover:scale-105 transition-transform"
          >
            Start AI Career Chat
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>

      <Footer />

      {selectedCareer && (
        <CareerDetailModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            if (slug) navigate("/careers", { replace: true });
          }}
          career={selectedCareer}
        />
      )}
    </div>
  );
};

export default Careers;
