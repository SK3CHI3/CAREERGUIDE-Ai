import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Clock, Calendar, ArrowLeft } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Helmet } from 'react-helmet-async';
import { BlogPost } from './BlogIndex';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPost() {
      if (!slug) return;
      
      const { data, error } = await supabase
        .from('blog_posts' as any)
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single();

      if (!error && data) {
        setPost(data as any);
      }
      setLoading(false);
    }
    loadPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-6xl font-black text-white mb-4">404</h1>
          <p className="text-xl text-slate-400 mb-8">Article not found or has been removed.</p>
          <Link to="/blog" className="px-8 py-4 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-all">
            Back to Blog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const readingTime = post.content ? Math.ceil(post.content.replace(/<[^>]*>?/gm, '').split(/\s+/).length / 200) : 1;

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30 selection:text-white flex flex-col overflow-x-hidden relative">
      <Helmet>
        <title>{post.seo_title || `${post.title} | CareerGuide AI Blog`}</title>
        <meta name="description" content={post.seo_description || post.excerpt} />
        <meta property="og:title" content={post.seo_title || post.title} />
        <meta property="og:description" content={post.seo_description || post.excerpt} />
        <meta property="og:type" content="article" />
        {post.cover_image_url && <meta property="og:image" content={post.cover_image_url} />}
        <meta name="twitter:card" content="summary_large_image" />
        
        {/* JSON-LD Structured Data for AI & Google */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "description": post.seo_description || post.excerpt,
            "articleBody": post.content ? post.content.replace(/<[^>]*>?/gm, '').substring(0, 5000) : "",
            "image": post.cover_image_url,
            "datePublished": post.published_at,
            "dateModified": post.updated_at || post.published_at,
            "author": {
              "@type": "Organization",
              "name": "CareerGuide AI",
              "url": window.location.origin
            },
            "publisher": {
              "@type": "Organization",
              "name": "CareerGuide AI",
              "logo": {
                "@type": "ImageObject",
                "url": `${window.location.origin}/logos/CareerGuide_Logo.webp`
              }
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": window.location.href
            }
          })}
        </script>
      </Helmet>
      
      <Navigation />

      <main className="flex-1 relative z-10 w-full overflow-x-hidden">
        {/* Header Hero Section */}
        <div className="relative pt-40 pb-32 text-center px-4 overflow-hidden">
          <div className="absolute inset-0 z-0">
             {post.cover_image_url ? (
               <>
                 <img src={post.cover_image_url} alt="" className="w-full h-full object-cover opacity-30 dark:opacity-20 blur-sm" />
                 <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/95 to-background" />
               </>
             ) : (
                 <div className="w-full h-full bg-muted/30" />
             )}
          </div>
          
          <div className="max-w-4xl mx-auto relative z-10 px-4">
            <Link to="/blog" className="inline-flex items-center text-primary font-bold text-sm uppercase tracking-widest hover:text-foreground transition-colors mb-12">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to all articles
            </Link>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-4xl md:text-6xl font-black font-serif text-foreground tracking-tight leading-tight mb-8 break-words uppercase">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                <div className="flex items-center gap-2 bg-card/50 backdrop-blur-md py-2 px-4 rounded-full border border-card-border shadow-sm shrink-0">
                  <Calendar className="w-4 h-4 text-primary" />
                  {new Date(post.published_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="flex items-center gap-2 bg-card/50 backdrop-blur-md py-2 px-4 rounded-full border border-card-border shadow-sm shrink-0">
                  <Clock className="w-4 h-4 text-primary" />
                  {readingTime} min read
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Featured Image */}
        {post.cover_image_url && (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 -mt-16 relative z-20">
              <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ delay: 0.2 }}
                 className="rounded-3xl overflow-hidden shadow-2xl border border-card-border aspect-[21/9] bg-muted"
              >
                  <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
              </motion.div>
            </div>
        )}

        {/* Article Body */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 w-full">
          <motion.article 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="prose dark:prose-invert prose-lg md:prose-xl max-w-none break-words
              prose-headings:font-black prose-headings:tracking-tight prose-headings:text-foreground
              prose-a:text-primary prose-a:font-semibold hover:prose-a:text-primary/80 prose-a:transition-colors
              prose-img:rounded-3xl prose-img:shadow-2xl prose-img:border prose-img:border-border
              prose-p:leading-relaxed prose-p:text-muted-foreground
              prose-li:text-muted-foreground prose-ul:font-medium
              prose-strong:text-foreground prose-strong:font-bold
              prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:font-medium prose-blockquote:italic
            "
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
