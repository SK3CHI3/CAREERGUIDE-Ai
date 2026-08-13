// @ts-nocheck
import { HTMLRewriter } from "https://ghuc.cc/worker-tools/html-rewriter/index.ts";

export default async (request: Request, context: any) => {
  const url = new URL(request.url);
  const path = url.pathname;

  // Paths to handle for SEO injection
  const isHome = path === "/";
  const isBlog = path.startsWith("/blog/");
  const isCareers = path === "/careers" || path.startsWith("/careers/");
  
  if (!isHome && !isBlog && !isCareers) {
    return context.next();
  }

  try {
    const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL");
    const supabaseKey = Deno.env.get("VITE_SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase credentials in Edge Function");
      return context.next();
    }

    let seoData = null;

    if (isHome) {
      seoData = {
        title: "CareerGuide AI | AI-Powered Career Guidance for Kenya's CBE System",
        description: "Empower Kenyan students with CareerGuide AI. We offer RIASEC assessments, career matching, and pathway synchronization for Junior and Senior secondary schools under the CBE curriculum.",
        image: "https://careerguideai.co.ke/logos/CareerGuide_Logo.png",
        type: "website",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "CareerGuide AI",
          "url": "https://careerguideai.co.ke",
          "logo": "https://careerguideai.co.ke/logos/CareerGuide_Logo.png",
          "description": "Kenya's leading AI-powered career guidance platform for the Competency-Based Curriculum.",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Nairobi",
            "addressCountry": "Kenya"
          },
          "sameAs": [
            "https://twitter.com/CareerGuideAI",
            "https://linkedin.com/company/careerguideai"
          ]
        }
      };
    } else if (isBlog) {
      const slug = path.split("/").pop();
      if (slug && slug !== "blog") {
        const response = await fetch(
          `${supabaseUrl}/rest/v1/blog_posts?slug=eq.${slug}&published=eq.true&select=*`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
          }
        );
        const data = await response.json();
        if (data && data.length > 0) {
          const post = data[0];
          const cleanBody = post.content ? post.content.replace(/<[^>]*>?/gm, "").substring(0, 5000) : "";
          seoData = {
            title: post.seo_title || `${post.title} | CareerGuide AI Blog`,
            description: post.seo_description || post.excerpt || "Career guidance and insights for Kenyan students.",
            image: post.cover_image_url || "https://careerguideai.co.ke/logos/CareerGuide_Logo.png",
            type: "article",
            jsonLd: {
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              "headline": post.title,
              "description": post.seo_description || post.excerpt,
              "articleBody": cleanBody,
              "image": post.cover_image_url,
              "datePublished": post.published_at,
              "dateModified": post.updated_at || post.published_at,
              "author": {
                "@type": "Organization",
                "name": "CareerGuide AI",
                "url": "https://careerguideai.co.ke"
              }
            }
          };
        }
      }
    } else if (isCareers) {
      const slug = path.split("/").pop();
      if (slug && slug !== "careers") {
        // Fetch specific career
        const response = await fetch(
          `${supabaseUrl}/rest/v1/career_paths?slug=eq.${slug}&select=*`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
          }
        );
        const data = await response.json();
        if (data && data.length > 0) {
          const career = data[0];
          seoData = {
            title: `${career.title} Career in Kenya | Salaries, Skills & Universities | CareerGuide AI`,
            description: career.one_liner || `Learn how to become a ${career.title} in Kenya. Explore skills, education pathways, and salary expectations.`,
            image: "https://careerguideai.co.ke/logos/CareerGuide_Logo.png",
            type: "article",
            jsonLd: {
              "@context": "https://schema.org",
              "@type": "Occupation",
              "name": career.title,
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": `https://careerguideai.co.ke/careers/${career.slug}`
              },
              "description": career.one_liner,
              "estimatedSalary": [
                {
                  "@type": "MonetaryAmountDistribution",
                  "name": "base salary",
                  "currency": "KES",
                  "duration": "P1M",
                  "description": career.salary_range
                }
              ],
              "educationRequirements": career.education_requirements,
              "skills": career.skills_required,
              "occupationLocation": {
                "@type": "Country",
                "name": "Kenya"
              }
            }
          };
        } else {
          // Fallback to general careers metadata
          seoData = {
            title: "Explore Trending Careers in Kenya | CareerGuide AI",
            description: "Discover high-demand career paths in Kenya's evolving job market. Get real-time insights on salaries, growth, and required skills for the CBE system.",
            image: "https://careerguideai.co.ke/logos/CareerGuide_Logo.png",
            type: "website",
            jsonLd: {
              "@context": "https://schema.org",
              "@type": "SearchResultsPage",
              "name": "Trending Careers in Kenya"
            }
          };
        }
      } else {
        // General Careers Page
        seoData = {
          title: "Career Library | 500+ Kenyan Career Pathways | CareerGuide AI",
          description: "Browse Kenya's most comprehensive library of 500+ career paths. From STEM to Arts, explore salaries, universities, and localized guidance.",
          image: "https://careerguideai.co.ke/logos/CareerGuide_Logo.png",
          type: "website",
          jsonLd: {
            "@context": "https://schema.org",
            "@type": "SearchResultsPage",
            "name": "Kenya Career Library"
          }
        };
      }
    }

    // If we have SEO data, inject it into the HTML
    if (seoData) {
      const response = await context.next();
      
      return new HTMLRewriter()
        .on("title", {
          element(el: any) {
            el.setInnerContent(seoData.title);
          }
        })
        .on("head", {
          element(el: any) {
            // Remove existing meta tags that we are replacing to avoid duplicates
            // HTMLRewriter doesn't easily support removing by selector while appending, 
            // but appending at the end of head is usually safe as later tags override earlier ones for some properties.
            // Better to append most critical ones.
            
            el.append(`<meta name="description" content="${seoData.description.replace(/"/g, '&quot;')}" />`, { html: true });
            el.append(`<meta property="og:title" content="${seoData.title.replace(/"/g, '&quot;')}" />`, { html: true });
            el.append(`<meta property="og:description" content="${seoData.description.replace(/"/g, '&quot;')}" />`, { html: true });
            el.append(`<meta property="og:image" content="${seoData.image}" />`, { html: true });
            el.append(`<meta property="og:type" content="${seoData.type}" />`, { html: true });
            el.append(`<meta name="twitter:card" content="summary_large_image" />`, { html: true });
            el.append(`<link rel="canonical" href="${url.origin}${url.pathname}" />`, { html: true });
            
            // Add JSON-LD
            el.append(`<script type="application/ld+json">${JSON.stringify(seoData.jsonLd)}</script>`, { html: true });
          }
        })
        .transform(response);
    }

  } catch (error) {
    console.error("SEO Injection Error:", error);
  }

  return context.next();
};

// Netlify Edge Function config
export const config = {
  path: ["/", "/blog/*", "/careers*"]
};

