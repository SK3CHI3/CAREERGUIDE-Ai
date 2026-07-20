# CareerGuide AI

A student-first career guidance platform that helps Kenyan students make informed decisions about their academic paths and future careers. Powered by AI assessments and backed by verified professional counselors.

## Overview

CareerGuide AI bridges the gap between academic choices and career opportunities in Kenya's Competency-Based Education (CBE) system. Students get personalized career recommendations based on their personality profile, academic performance, and real Kenyan labour market data. Teachers get tools to help guide students toward better career outcomes.

## Roles

### Students
- Take a RIASEC personality assessment
- Get AI-generated career recommendations with match percentages
- Track academic performance and see how grades affect career fit
- Chat 1-on-1 with an AI career counselor
- Browse an extensive career pathways directory
- Book sessions with verified professional counselors
- Download a personalized PDF career report

### Teachers
- Create and manage student groups
- Track student academic performance
- View AI-generated career insights per student
- Help students understand how their grades align with career goals

## Key Features

**AI Career Recommendations** — DeepSeek-powered analysis combines RIASEC personality scores, academic performance, subject strengths, and Kenya Vision 2030 labour market data to generate ranked career matches with actionability scores.

**RIASEC Assessment** — Six-dimension personality profiling (Realistic, Investigative, Artistic, Social, Enterprising, Conventional) with radar chart visualization and archetype descriptions.

**Academic Performance Tracking** — Grade management with term-by-term analysis, subject strength/weakness identification, and automatic recalculation of career match scores when grades change.

**AI Career Chat** — Full-page conversational interface where students can ask about subject choices, university prerequisites, TVET options, and job market trends in East Africa.

**Career Pathways Directory** — 500+ career paths with salary ranges, growth projections, education requirements, and skills needed — all contextualized for the Kenyan market.

**Verified Counselor Access** — Students can book 1-on-1 sessions with professional career counselors for human validation of AI recommendations.

**Two-Tier Caching** — L1 (localStorage + cookie fingerprint) for instant load, L2 (Supabase) for persistence across devices. AI recommendations are cached for 24 hours with context-hash invalidation.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 8 |
| Styling | Tailwind CSS 4, shadcn/ui |
| State | React Context API |
| Routing | React Router v6 |
| Backend | Supabase (PostgreSQL, Auth, RLS, Storage) |
| AI | DeepSeek V3.1 (streaming + JSON mode) |
| Charts | Recharts (pie, radar, bar) |
| Payments | IntaSend (M-Pesa) |
| PDF | html2pdf.js |
| Deployment | Netlify (SPA redirects) |

## Getting Started

### Prerequisites
- Node.js 18+
- npm or bun

### Setup

```bash
# Clone the repository
git clone https://github.com/SK3CHI3/CAREERGUIDE-Ai.git
cd CAREERGUIDE-Ai

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_DEEPSEEK_API_KEY

# Start development server
npm run dev
```

### Build

```bash
npm run build
npm run preview  # preview the production build
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `VITE_DEEPSEEK_API_KEY` | DeepSeek API key for AI features |

## Project Structure

```
src/
├── App.tsx                 # Routes + lazy loading
├── contexts/
│   └── AuthContext.tsx      # Auth + profile state
├── pages/
│   ├── StudentDashboard.tsx # Main student interface
│   ├── StudentChatPage.tsx  # Full-page AI chat
│   ├── TeacherDashboard.tsx # Teacher interface
│   ├── Careers.tsx          # Career directory
│   └── AdminDashboard.tsx   # Platform admin
├── components/
│   ├── AIChat.tsx           # Embedded chat (legacy)
│   ├── CareerDetailModal.tsx
│   ├── GradesManager.tsx
│   ├── CourseRecommendations.tsx
│   ├── TrialActivationModal.tsx
│   └── PaymentWall.tsx
├── lib/
│   ├── ai-service.ts       # DeepSeek API integration
│   ├── ai-cache-service.ts # L1/L2 cache management
│   ├── dashboard-service.ts
│   ├── subscription-service.ts
│   └── class-service.ts
└── types/
    ├── roles.ts            # UserRole enum
    └── supabase.ts         # Generated DB types
```

## Database

The platform uses Supabase PostgreSQL with Row Level Security (RLS) enabled on all tables.

**Core tables:** `profiles`, `classes`, `class_enrollments`, `student_grades`, `career_paths`, `career_recommendations`

**Cache tables:** `cached_career_recommendations`, `cached_career_details`, `cached_course_recommendations`, `cache_invalidation`

**Content tables:** `blog_posts`, `feedbacks`, `counselor_profiles`, `counselor_sessions`, `counselor_messages`

## Subscription Model

- **Free Trial** — Full access for the remainder of the current academic term (first-time students)
- **Individual** — KSh 499/term via M-Pesa
- **Grace Period** — 3-day grace after expiry before access is locked

## Changelog

### v3.0 (July 2026)
- Removed school system entirely — platform is now student + teacher focused
- Teachers can self-register (no school invite required)
- AI Chat moved to dedicated full-page view at `/student/chat`
- New TrialActivationModal replaces inline trial banner
- Fixed navigation bugs (window.location → React Router navigate)
- Fixed AI recommendations not loading on app reload
- Fixed career titles not showing on Careers page reload
- Parallelized dashboard data loading (Promise.all)
- Added 2-minute localStorage session cache for stats
- Added sessionStorage cache for AI insights
- Improved mobile UI across all dashboard sections

## License

Proprietary. All rights reserved.

---

Built with ❤️ for Kenyan students navigating their career journeys.
