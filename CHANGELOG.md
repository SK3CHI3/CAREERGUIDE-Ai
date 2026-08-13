# Changelog

## [3.0.0] - 2026-08-13

### Major: School System Removal
- Removed all school-related pages, components, and services (SchoolDashboard, SchoolTeachers, SchoolClasses, SchoolStudents, SchoolInsightsPage, SchoolOnboarding, InviteTeacher, SchoolInsights, SubscriptionCard)
- Deleted `school-service.ts` and all school-related imports
- Removed institutional subscription path — only individual and trial plans remain
- Removed 4 school user accounts and 1 school record from the database
- `classes.school_id` changed from NOT NULL to nullable

### Mentor Role
- Renamed "Teacher" role to "Mentor" to include parents, guardians, and other student guides
- Updated signup form to offer Student and Mentor options
- MentorDashboard no longer depends on `school_id`; mentors create independent classes
- ClassService `school_id` parameter removed from `createClass()`

### AI Career Chat
- New full-page AI career chat at `/student/chat` with markdown rendering
- Dedicated `StudentChatPage.tsx` component replacing embedded chat
- Improved AI response parsing and error handling
- Empty state with retry button for career recommendations

### Counselor Booking
- Public `/counselors` route accessible without authentication
- Single hardcoded counselor (Victor Omollo) at KSh 1,000/hr
- CounselorDirectory component with booking via IntaSend
- AdminCounselorManager for future multi-counselor support

### Assessment Overhaul
- Split Future Aspirations and Your Interests into separate assessment steps
- Removed redundant Work Styles step
- Removed duplicate RIASEC activities from Quick Assessment Phase 2
- Added expandable interest categories with custom entry
- RIASEC scores now calculated from interest categories instead of removed activities step
- Updated assessment content to be more professional and aspirational

### Landing Page Redesign
- Hero section with local STUDENT.svg animation replacing Lottie
- Counselor section with background image and diagonal slant design
- AI-Powered Career Matching section with clarified description (interests, grades, personality, market demand)
- Smart root route — redirects authenticated users to dashboard, shows homepage for visitors
- Removed "How It Works" steps, updated CTA to student-focused messaging

### PDF Report Redesign
- 3-page layout: Candidate profile, Diagnostic summary, Institutional placement roadmap

### Mobile Improvements
- Compact header (h-14 mobile, h-16 desktop)
- Welcome greeting hidden on mobile
- Stacked trial/expiry banners with full-width buttons
- Compact stats cards, chart grid stacking, truncated career cards
- CareerDetailModal optimized for mobile with better padding and stacking
- Tab labels shortened ("AI Chat" to "Chat")

### Performance & Caching
- Parallelized `loadDashboardData` with `Promise.all`
- localStorage 2-minute session cache for dashboard stats
- sessionStorage cache for AI insights (skips DeepSeek API on re-mount)
- Non-blocking course recommendations and AI insights (fire-and-forget)
- Auto-retry for career recommendations when no data exists
- Course cache now always checks Supabase L2 even when hash mismatches

### Bug Fixes
- Replaced `window.location.href` with `navigate()` in 6 locations
- Fixed AI career recommendations not loading on app open
- Fixed career titles not showing on Careers page reload
- Fixed JSON extraction from AI insights response
- Passed personality_type as array to AI service
- Careers reload when profile changes
- Unified color scheme using primary color
- Professional DNA card properly memoized and reactive to profile changes

### Deployment
- Node.js upgraded to v22 for Netlify compatibility
- Mentor signup converted to 4-step wizard
- School pricing section removed from signup flow

---

## [2.0.0] - 2026-03-14

### Major Features & Improvements
- **Unified Brand Identity**: Complete replacement of generic placeholders with the official CareerGuide AI logo across all touchpoints (Auth, Dashboards, Header, and Loading states).
- **Dashboard Analytics Reimagined**: Optimized Ecosystem Growth chart with refined timeline density (5-day intervals). Polished Admin Dashboard sidebar with improved logo visibility and spacing.
- **Premium User Experience**: Redesigned 404 Page with brand-consistent gradients, smooth floating animations, and improved navigation options.

### Technical Fixes & Security
- Fixed critical RLS policies for `school_members` and `teacher_invites` tables.
- Enhanced Invite Acceptance security with mandatory password confirmation validation.
- Resolved auto-sign-in race conditions; immediate redirect to dashboards upon invite acceptance.
- Implemented site-wide Feedback Widget for user-to-admin communication.
- Fixed TypeScript definition mismatch for the `feedbacks` table.

### Maintenance
- Removed temporary build artifacts, test files, and legacy vite config timestamps.
- Improved ESLint configuration for better development environment stability.
- Enhanced error handling and loading feedback across authentication and dashboard modules.
