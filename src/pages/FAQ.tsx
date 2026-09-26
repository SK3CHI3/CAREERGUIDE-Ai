import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import BackgroundGradient from "@/components/BackgroundGradient";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Helmet } from "react-helmet-async";

const faqs = [
  {
    question: "How does CareerGuide AI figure out the best career for me?",
    answer: "Our AI uses a blend of your academic performance, interests, and career aspirations to match you with suitable career fields aligned to Kenya's CBC system. The Quick Assessment asks about your subjects, performance, interests, and future vision to generate personalized recommendations."
  },
  {
    question: "Is this platform suitable for Junior Secondary students?",
    answer: "Yes! CareerGuide AI supports all CBC grades from Grade 7 to Grade 12. Junior Secondary students (Grades 7-9) get career field exploration and pathway guidance, while Senior Secondary students (Grades 10-12) receive more detailed career matching with specific subject and university recommendations."
  },
  {
    question: "Do I need an internet connection to use this?",
    answer: "Yes, you need an internet connection to take the AI assessment and chat with our AI counselor. However, once you download your career report PDF, you can reference it offline anytime."
  },
  {
    question: "How does it align with the Kenyan CBC system?",
    answer: "Our AI is trained on Kenya's Competency-Based Curriculum framework. We recommend career fields by matching your strengths to CBC pathways (STEM, Social Sciences, Arts & Sports Science, or Technical & Vocational) and the specific subjects available in each pathway."
  },
  {
    question: "How can parents use this platform?",
    answer: "Parents can take the assessment alongside their child and download the detailed PDF career report. This report provides clear, actionable career recommendations and pathway guidance that parents can use to support their child's educational decisions."
  },
  {
    question: "Is CareerGuide AI really free?",
    answer: "Yes! Everything is completely free. Take the Quick Assessment, chat with our AI counselor, check if a career fits you, explore career fields, and download your personalized PDF report—all at zero cost, no sign-up required."
  },
  {
    question: "Do I need to create an account?",
    answer: "No! You can take the Quick Assessment, use the AI chat, and download your report without creating an account. Just enter your name and email when prompted, and we'll send your report to your inbox."
  },
  {
    question: "How is my data protected?",
    answer: "We take privacy seriously. Your assessment answers are processed anonymously and only used to generate your personalized report. We do not sell or share your data with third parties, and we comply with the Kenya Data Protection Act of 2019."
  },
  {
    question: "What's the difference between the Quick Assessment and the AI Chat?",
    answer: "The Quick Assessment is a structured 5-step questionnaire that generates a detailed career report with 3 matched career fields, CBC pathway recommendations, and a downloadable PDF. The AI Chat is a freeform conversation where you can ask any career-related questions and get instant personalized advice."
  },
  {
    question: "What does 'Access Fit' mean on career cards?",
    answer: "When you see 'Access Fit' on a career card, you can click it to take a quick assessment focused specifically on that career. It tells you whether that career field aligns with your subjects, interests, and performance, and what you should focus on to pursue it."
  },
  {
    question: "Can I talk to a real career counselor?",
    answer: "Yes! We offer live 1-on-1 career counseling sessions with certified counselors. You can book a session through our counselors page for personalized guidance that goes beyond what AI can provide."
  }
];

const FAQ = () => {
  return (
    <div className="min-h-screen text-foreground relative overflow-x-hidden pt-20">
      <Helmet>
        <title>FAQ | CareerGuide AI - Frequently Asked Questions</title>
        <meta name="description" content="Find answers to common questions about CareerGuide AI, CBC alignment, free assessment, AI chat, and how we help Kenyan students." />
        
        {/* FAQ Structured Data for Google/AI Rich Results */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(faq => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
              }
            }))
          })}
        </script>
      </Helmet>
      <BackgroundGradient />
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative z-10">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Frequently Asked{" "}
            <span className="bg-gradient-text bg-clip-text text-transparent">
              Questions
            </span>
          </h1>
          <p className="text-lg text-foreground-muted max-w-2xl mx-auto">
            Everything you need to know about CareerGuide AI, how it works, and how it helps students in Kenya.
          </p>
        </div>

        <div className="bg-gradient-surface border border-card-border rounded-2xl p-6 sm:p-10 shadow-elevated">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={"item-" + index} className="border-card-border">
                <AccordionTrigger className="text-left font-semibold text-lg hover:text-primary transition-colors">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-foreground-muted leading-relaxed pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;
