import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import BackgroundGradient from "@/components/BackgroundGradient";
import { 
  Users, Target, BookOpen, Sparkles, Building2, ShieldCheck, 
  ArrowRight, Linkedin, Twitter, ExternalLink 
} from "lucide-react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";

export default function About() {
  return (
    <div className="min-h-screen text-foreground overflow-x-hidden relative flex flex-col bg-background">
      <Helmet>
        <title>About Us | CareerGuide AI Mission</title>
        <meta name="description" content="Learn about our mission to synchronize Kenya's academic potential with global success through precision educational mapping and AI intelligence." />
        <link rel="canonical" href="https://careerguideai.co.ke/about" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AboutPage",
            "mainEntity": {
              "@type": "Organization",
              "name": "CareerGuide AI",
              "description": "Leading AI-powered educational mapping platform in Kenya.",
              "mission": "Synchronizing academic potential with professional success."
            }
          })}
        </script>
      </Helmet>
      
      <BackgroundGradient />
      <Navigation />
      
      <main className="flex-1 pt-32 pb-24">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32 text-center">
          <div className="max-w-4xl mx-auto">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-8xl font-black mb-8 leading-[0.95] tracking-tight"
            >
              Synchronizing Kenya's <br />
              <span className="bg-gradient-text bg-clip-text text-transparent italic font-serif">Academic Potential</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-foreground-muted font-medium leading-relaxed max-w-2xl mx-auto"
            >
              CareerGuide AI is the intelligence layer bridging the gap between national educational curricula and the modern professional world.
            </motion.p>
          </div>
        </div>

        {/* Story Section - Modern Card */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-40">
           <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative p-8 md:p-20 rounded-[3rem] overflow-hidden border border-card-border bg-gradient-surface shadow-3xl text-center"
          >
            <div className="absolute top-0 left-0 p-10 opacity-5">
              <Sparkles className="w-64 h-64 text-primary" />
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-8">Why we exist</h2>
            <div className="max-w-3xl mx-auto space-y-6 text-lg md:text-xl text-foreground-muted font-medium leading-relaxed">
              <p>
                In many Kenyan schools, the ratio of students to career counselors is staggeringly high. We built CareerGuide AI as a free, 24/7 solution that every student can access directly.
              </p>
              <p>
                By leveraging AI trained specifically on the Kenyan economic landscape and CBC system, we provide the personalized experience of a high-end mentor to every student with a smartphone.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Team Section Redesign */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-60 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black mb-16"
          >
            The Minds Behind <br /> <span className="text-primary italic font-serif">the Mission</span>
          </motion.h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-12">
            {[
              { 
                name: "Omollo Victor", 
                role: "Founder & Lead Dev", 
                image: "/images/victor.jpg",
                linkedin: "https://www.linkedin.com/in/omollo-victor-28b942356/",
                twitter: "https://x.com/omollo_20",
                bio: "Full-stack engineer with a vision to democratize elite career guidance."
              },
              { 
                name: "Christabel Nekesa", 
                role: "Data Systems", 
                image: "/images/christabel.jpg",
                linkedin: "https://www.linkedin.com/in/christabel-nekesa-a18534292/",
                bio: "Expert in CBE educational structures and student performance datasets."
              },
              { 
                name: "Precious Diana", 
                role: "Operations Strategy", 
                image: "/images/precious.jpg",
                linkedin: "https://www.linkedin.com/in/precious-diana-b322b3315/",
                bio: "Scaling our reach across East Africa and managing institutional relations."
              }
            ].map((member, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group relative bg-card hover:bg-surface border border-card-border p-10 rounded-[3rem] transition-all hover:shadow-2xl text-center"
              >
                <div className="w-32 h-32 rounded-3xl overflow-hidden mx-auto mb-6 border-2 border-primary/20 shadow-xl group-hover:scale-105 transition-transform duration-500">
                  {member.image ? (
                    <img 
                      src={member.image} 
                      alt={member.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-black text-2xl">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                </div>
                <h3 className="text-2xl font-bold mb-2">{member.name}</h3>
                <p className="text-primary font-bold text-sm uppercase tracking-tighter mb-4">{member.role}</p>
                <p className="text-foreground-muted text-sm font-medium leading-relaxed mb-6">{member.bio}</p>
                
                <div className="flex justify-center gap-4">
                  {member.linkedin && (
                    <a 
                      href={member.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-muted hover:bg-primary hover:text-white transition-all text-foreground-muted"
                    >
                      <Linkedin className="w-5 h-5" />
                    </a>
                  )}
                  {member.twitter && (
                    <a 
                      href={member.twitter} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-muted hover:bg-black hover:text-white transition-all text-foreground-muted"
                    >
                      <Twitter className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-60">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="bg-primary rounded-[3.5rem] p-12 md:p-24 text-center text-white relative overflow-hidden"
          >
            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <h2 className="text-4xl md:text-5xl font-black leading-tight">Ready to discover your career path?</h2>
              <div className="flex justify-center">
                <a href="/quick-assessment" className="bg-white text-primary px-12 py-5 rounded-full font-black text-lg flex items-center gap-2 hover:scale-105 transition-transform">
                  Take Free Assessment <ArrowRight className="w-6 h-6" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
