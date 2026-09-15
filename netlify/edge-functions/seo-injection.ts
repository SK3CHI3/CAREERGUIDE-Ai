// @ts-nocheck
import { HTMLRewriter } from "https://ghuc.cc/worker-tools/html-rewriter/index.ts";

export default async (request: Request, context: any) => {
  const url = new URL(request.url);
  const path = url.pathname;

  // Paths to handle for SEO injection
  const isHome = path === "/";
  const isBlog = path.startsWith("/blog/");
  const isCareers = path === "/careers" || path.startsWith("/careers/");
  const staticPages: Record<string, { title: string; description: string }> = {
    '/about': { title: 'About CareerGuide AI | Career Guidance for Kenya', description: 'Learn how CareerGuide AI helps Kenyan students explore education and career options with practical, evidence-aware guidance.' },
    '/how-it-works': { title: 'How CareerGuide AI Works | Career Guidance for Kenyan Students', description: 'See how CareerGuide AI helps students explore careers, reflect on subjects and take practical next steps.' },
    '/faq': { title: 'CareerGuide AI FAQ | Help for Kenyan Students and Schools', description: 'Answers about CareerGuide AI, student guidance, assessments, careers and school support.' },
    '/blog': { title: 'Career Guidance Insights | CareerGuide AI Blog', description: 'Practical career and education guidance for Kenyan students, families and schools.' },
    '/quick-assessment': { title: 'Quick Career Direction Assessment | CareerGuide AI', description: 'Explore practical career directions and next steps based on your current school stage, subjects and interests.' },
    '/subject-guide': { title: 'Subject and Pathway Guide | CareerGuide AI', description: 'Explore how school subjects and pathways can keep future career options open.' },
    '/counselors': { title: 'Career Counsellors | CareerGuide AI', description: 'Find career guidance support for your education and career planning journey.' },
    '/privacy': { title: 'Privacy Policy | CareerGuide AI', description: 'Learn how CareerGuide AI handles student and account information.' },
    '/terms': { title: 'Terms of Use | CareerGuide AI', description: 'CareerGuide AI terms of use.' },
  };
  const staticPage = staticPages[path];
  const isPrivate = /^(?:\/auth|\/student(?:\/|$)|\/admin(?:\/|$)|\/mentor(?:\/|$)|\/dashboard(?:\/|$))/.test(path);
  
  if (isPrivate) {
    const response = await context.next();
    return new HTMLRewriter().on('head', { element(el: any) { el.append('<meta name="robots" content="noindex, nofollow, noarchive" />', { html: true }); } }).transform(response);
  }

  if (!isHome && !isBlog && !isCareers && !staticPage) {
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
    } else if (staticPage) {
      seoData = {
        ...staticPage,
        image: 'https://careerguideai.co.ke/logos/CareerGuide_Logo.png',
        type: 'website',
        jsonLd: { '@context': 'https://schema.org', '@type': 'WebPage', name: staticPage.title, url: `${url.origin}${path}` },
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
        } else {
          const response = await context.next();
          return new Response(response.body, { status: 404, headers: response.headers });
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
          const response = await context.next();
          return new Response(response.body, { status: 404, headers: response.headers });
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
      
      const escapeHtml = (value: unknown) => String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      const safeJsonLd = JSON.stringify(seoData.jsonLd).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
      return new HTMLRewriter()
        .on('meta[name="description"]', { element(el: any) { el.remove(); } })
        .on('meta[property="og:title"]', { element(el: any) { el.remove(); } })
        .on('meta[property="og:description"]', { element(el: any) { el.remove(); } })
        .on('meta[property="og:image"]', { element(el: any) { el.remove(); } })
        .on('meta[property="og:type"]', { element(el: any) { el.remove(); } })
        .on('meta[name="twitter:card"]', { element(el: any) { el.remove(); } })
        .on('link[rel="canonical"]', { element(el: any) { el.remove(); } })
        .on("title", {
          element(el: any) {
            el.setInnerContent(seoData.title);
          }
        })
        .on("head", {
          element(el: any) {
            el.append(`<meta name="description" content="${escapeHtml(seoData.description)}" />`, { html: true });
            el.append(`<meta property="og:title" content="${escapeHtml(seoData.title)}" />`, { html: true });
            el.append(`<meta property="og:description" content="${escapeHtml(seoData.description)}" />`, { html: true });
            el.append(`<meta property="og:image" content="${escapeHtml(seoData.image)}" />`, { html: true });
            el.append(`<meta property="og:type" content="${escapeHtml(seoData.type)}" />`, { html: true });
            el.append(`<meta name="twitter:card" content="summary_large_image" />`, { html: true });
            el.append(`<link rel="canonical" href="${escapeHtml(`${url.origin}${url.pathname}`)}" />`, { html: true });
            
            // Add JSON-LD
            el.append(`<script type="application/ld+json">${safeJsonLd}</script>`, { html: true });
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
export const config = { path: "/*" };

