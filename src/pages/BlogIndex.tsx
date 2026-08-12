import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Clock, Calendar, ChevronRight, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string;
  published_at: string;
  updated_at: string;
  seo_title: string;
  seo_description: string;
}

const calculateReadingTime = (text: string) => {
  const wordsPerMinute = 200;
  const words = text.replace(/<[^>]*>?/gm, '').split(/\s+/).length;
  const time = Math.ceil(words / wordsPerMinute);
  return time;
};

export default function BlogIndex() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadPosts() {
      const { data, error } = await supabase
        .from('blog_posts' as any)
        .select('*')
        .eq('published', true)
        .order('published_at', { ascending: false });

      if (!error && data) {
        setPosts(data as any);
      }
      setLoading(false);
    }
    loadPosts();
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30 selection:text-white flex flex-col overflow-x-hidden relative">
      <Helmet>
        <title>Insights & News | CareerGuide AI Blog</title>
        <meta name="description" content="Stay updated with the latest in Kenya's Competency-Based Education (CBE), career guidance trends, and AI-powered educational insights." />
        <meta property="og:title" content="CareerGuide AI Blog | Shaping the Future of Kenyan Careers" />
        <meta property="og:description" content="Deep dives into CBE, career strategy, and student success stories in the modern Kenyan workforce." />
        
        {/* JSON-LD for Blog Listing */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": "CareerGuide AI Blog",
            "description": "Insights on Kenya's Competency-Based Education and career guidance.",
            "url": window.location.href,
            "publisher": {
              "@type": "Organization",
              "name": "CareerGuide AI",
              "logo": {
                "@type": "ImageObject",
                "url": `${window.location.origin}/logos/CareerGuide_Logo.webp`
              }
            }
          })}
        </script>
      </Helmet>
      
      <Navigation />

      <main className="flex-1 pt-32 pb-24 relative z-10 w-full">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto mb-20 px-4"
          >
            <h1 className="text-4xl md:text-6xl font-black font-serif tracking-tight text-foreground mb-6 break-words">
              The Path <span className="text-primary">Forward</span>
            </h1>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed break-words">
              Explore our latest insights, success stories, and deep-dives into the future of education and career guidance under CBC.
            </p>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="rounded-2xl bg-surface border border-card-border h-96 animate-pulse" />
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => navigate(`/blog/${post.slug}`)}
                  className="group cursor-pointer flex flex-col bg-surface/40 backdrop-blur-sm border border-card-border rounded-3xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20"
                >
                  <div className="relative h-56 overflow-hidden">
                    {post.cover_image_url ? (
                      <img 
                        src={post.cover_image_url} 
                        alt={post.title} 
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-violet-900/40 flex items-center justify-center">
                        <span className="text-foreground/20 font-black text-4xl">CGAI</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 dark:bg-black/40 group-hover:bg-transparent transition-colors duration-300" />
                  </div>
                  
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        {new Date(post.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        {calculateReadingTime(post.content)} min read
                      </div>
                    </div>

                    <h2 className="text-2xl font-black text-foreground mb-3 line-clamp-2 leading-tight group-hover:text-primary transition-colors break-words">
                      {post.title}
                    </h2>
                    
                    <p className="text-muted-foreground leading-relaxed mb-8 line-clamp-3 text-sm flex-1 break-words">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center text-primary font-bold text-sm uppercase tracking-widest mt-auto">
                      Read Article <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-card border border-card-border rounded-3xl">
              <h3 className="text-2xl font-black text-foreground mb-2">No Articles Yet</h3>
              <p className="text-muted-foreground">Check back soon for our newest content and updates!</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
