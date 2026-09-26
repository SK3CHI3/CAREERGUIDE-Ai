# CareerGuide AI: Developer Documentation

This document serves as the source of truth for the current architecture of the CareerGuide AI platform.

## 1. Platform Overview

CareerGuide AI is a **free, public career guidance platform** for Kenyan students using the Competency-Based Curriculum (CBC). No authentication required.

**Stack:**
- **Frontend**: React 19, Vite 8, Tailwind CSS 4, shadcn/ui, Framer Motion
- **Backend/BaaS**: Supabase (PostgreSQL, Edge Functions)
- **AI**: Qwen via ModelScope API
- **Payments**: IntaSend (counselor bookings only)
- **Deployment**: Netlify

## 2. Core Features

### 2.1 Quick Assessment (`/quick-assessment`)
- 5-step assessment: Grade & Subjects → Interests → Parent Expectations (Grades 7-9 only) → Vision → Results
- Supports all CBC grades 7-12
- Results show 3 career fields with CBC pathway mapping, subjects to prioritize, and action items
- Results are paginated (3 pages)
- Downloadable PDF report

### 2.2 AI Chat (`/chat`)
- ChatGPT-style interface with floating input
- AI has access to all 47 career fields from database, grouped by CBC pathway
- Concise responses (2-4 sentences) with one follow-up question
- Suggested questions on empty state
- No authentication required

### 2.3 Career Directory (`/careers`)
- 461+ career paths with detailed information
- "Access fit" button on each career card → takes student to targeted assessment
- Filterable by category

### 2.4 Counselor Booking
- Public directory at `/counselors`
- 1-on-1 video sessions with verified counselors
- Payment via IntaSend (KSh 1,000/hr)

### 2.5 Subject Guide (`/subject-guide`)
- Interactive guide for CBC subject selection
- Aligns subjects with CBC pathways and career fields

## 3. Database Schema

### Core Tables
- `career_fields` — 47 career fields with CBC pathway, track, example roles, subjects to prioritize
- `career_paths` — 461+ career paths with detailed descriptions
- `kuuccps_clusters` — KUCCPS degree clusters and requirements
- `cbe_subjects` — CBC subject reference data
- `blog_posts` — Platform blog content

### Anonymous Tracking Tables
- `anonymous_sessions` — Visitor session tracking (no auth)
- `page_visits` — Page visit analytics
- `quick_assessment_completions` — Assessment completion tracking
- `ai_chat_interactions` — Chat session tracking
- `ai_chat_messages` — Chat message storage

### Counselor Tables
- `counselor_profiles` — Counselor information and rates
- `counselor_sessions` — Booking records
- `counselor_messages` — Session messages
- `payments` — Payment records (counselor bookings only)

### Legacy Tables (unused but preserved)
- `profiles` — User profiles (no longer used)
- `student_grades` — Student grades (no longer used)
- `classes` — Class management (no longer used)
- `user_activities`, `user_stats` — Dashboard analytics (no longer used)

## 4. AI Integration

### System Prompt
The AI receives:
1. Full career fields database (47 fields grouped by CBC pathway)
2. CBC structure reference (grades 7-12, core vs elective subjects, pathways)
3. Student context from quick assessment (if available)

### Response Guidelines
- Concise and conversational (2-4 sentences max)
- Only references careers from our database
- Asks one follow-up question per response
- Uses CBC terminology (Exceeding/Meeting/Approaching/Below Expectation)
- No invented cluster points, salaries, or university requirements

### Netlify Function
`netlify/functions/ai-chat.js` handles:
- Anonymous rate limiting (10 requests per 10 minutes)
- Request validation
- ModelScope API calls
- Error handling

## 5. Routing

### Public Routes (no auth)
- `/` — Landing page
- `/quick-assessment` — Assessment flow
- `/chat` — AI chat
- `/careers` — Career directory
- `/careers/:slug` — Career detail
- `/subject-guide` — Subject selection guide
- `/counselors` — Counselor directory
- `/blog` — Blog listing
- `/blog/:slug` — Blog post
- `/about` — About page
- `/faq` — FAQ page
- `/terms` — Terms of service
- `/privacy` — Privacy policy

### Admin Routes (basic auth via Netlify)
- `/admin` — Admin dashboard (protected by Netlify basic auth)

## 6. Key Components

### Assessment
- `QuickAssessment.tsx` — Main assessment flow
- `QuickAssessmentSection.tsx` — Landing page preview
- `QuickAssessmentDirectionBrief.tsx` — Results display (paginated)

### Chat
- `Chat.tsx` — Chat page wrapper
- `AIChat.tsx` — Chat interface (ChatGPT-style)
- `ChatInput.tsx` — Input component
- `MessageContent.tsx` — Message rendering

### Careers
- `Careers.tsx` — Career directory page
- `CareerDetailModal.tsx` — Career detail modal
- `CareerPaths.tsx` — Career paths section

### Shared
- `Navigation.tsx` — Site navigation
- `Footer.tsx` — Site footer
- `ThemeToggle.tsx` — Dark/light mode toggle

## 7. State Management

- **No global state** — Each feature manages its own state
- **localStorage** — Assessment progress, chat history (anonymous)
- **React useState** — Component-level state
- **React Query** — Data fetching (installed but not heavily used)

## 8. Development Guidelines

### Code Style
- TypeScript strict mode
- Avoid `any` — use proper types from `src/types/`
- Use Tailwind CSS for styling
- Use shadcn/ui components where appropriate
- Framer Motion for animations

### Typography
- **Inter** — Body text (self-hosted via @fontsource)
- **Libre Baskerville** — Headings (self-hosted via @fontsource)
- No system fonts — consistent across all devices

### Testing
- Manual testing on multiple devices
- Build verification (`npm run build`)
- Browser console checks

## 9. Deployment

### Netlify Configuration
- Build command: `npm run build`
- Publish directory: `dist`
- SPA fallback: All routes → `index.html`
- Edge functions: `netlify/functions/`
- Environment variables: Supabase keys, ModelScope API key, IntaSend keys

### Database
- Supabase PostgreSQL
- Migrations in `supabase/migrations/`
- RLS policies on all tables
- Anonymous tracking tables allow public inserts

## 10. Key Files

### Entry Points
- `src/App.tsx` — Main app component with routing
- `src/main.tsx` — React entry point
- `index.html` — HTML template

### Services
- `src/lib/ai-service.ts` — AI integration with ModelScope
- `src/lib/dashboard-service.ts` — Career fields and paths data
- `src/lib/tracking-service.ts` — Anonymous usage tracking
- `src/lib/supabase.ts` — Supabase client

### Types
- `src/types/database.ts` — Database type definitions
- `src/types/roles.ts` — Role types (legacy)

## 11. Performance

- **Code splitting** — Lazy-loaded routes
- **Image optimization** — WebP format, lazy loading
- **Font subsetting** — Self-hosted fonts with only needed character sets
- **PWA** — Installable progressive web app
- **Caching** — Browser caching for static assets

## 12. Security

- **No authentication** — Platform is fully public
- **Rate limiting** — Netlify function limits AI requests
- **RLS policies** — Database tables protected but allow anonymous inserts for tracking
- **Environment variables** — Sensitive keys stored server-side only
- **HTTPS only** — All traffic encrypted

## 13. Future Enhancements

Potential improvements:
- Enhanced counselor booking system (more counselors, reviews)
- Student account system for saving progress
- Expanded career fields database
- Integration with KUCCPS official data
- Mobile app (React Native)
- Advanced analytics dashboard
