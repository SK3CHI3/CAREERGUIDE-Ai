# Changelog

## [4.0.0] - 2026-01-14

### Major: Career System Overhaul & CBC-Only Refactor

#### Workstream 1: Career Paths Cleanup & Course-Based Naming
- Merged 74 duplicate/near-duplicate career entries (535 → 461 careers)
- Consolidated 29 overlapping categories → 19 clean categories:
  - Arts + Arts & Creative + Creative Arts + Creative Economy → **Creative Arts**
  - Health + Healthcare → **Health Sciences**
  - Fitness + Sports → **Sports & Fitness**
  - Hospitality + Tourism → **Hospitality & Tourism**
  - Infrastructure → **Engineering**
  - Retail + Real Estate → **Business**
  - Religion → **Social Sciences**
- Renamed 30+ role-based titles to course-based names:
  - "Bank Manager" → "Banking & Finance"
  - "Public Relations Officer" → "Public Relations & Communication"
  - "Supply Chain Manager" → "Supply Chain Management"
  - "Tax Consultant" → "Taxation"
  - "Human Resource Manager" → "Human Resource Management"
- Added `related_roles` text array column to `career_paths` table
- Updated CareerPath TypeScript interface with `related_roles?: string[]`
- Added "Related Job Roles" input field to admin career management form
- Added "This Leads to Roles Like" section to career detail modal
- Updated AI career recommendations prompt to use course names instead of job titles

#### Workstream 2: KUCCPS Clusters & Subject Selection Guide
- Created `kuccps_clusters` database table with all 19 official KUCCPS degree clusters
- Populated all clusters with subject requirements, minimum grades, programmes, cutoff estimates, and universities
- Created `src/lib/kuccps-service.ts` for fetching clusters and matching subjects
- Built `src/components/SubjectSelectionGuide.tsx` — interactive 4-step guide:
  1. Choose CBC pathway (STEM/Arts/Social/TechVoc)
  2. Select subjects (min 7)
  3. Enter KCSE grades (optional)
  4. View matched clusters with qualification status
- Created `src/pages/SubjectGuide.tsx` at `/subject-guide` route
- Created `src/components/KUCCPSClustersManagement.tsx` for admin CRUD
- Added "Subject Selection Guide" card to student dashboard overview
- Added "KUCCPS Clusters" tab to admin dashboard

#### Workstream 3: University & Course Mapping
- Expanded `UNIVERSITY_DATA` from 6 → 20 Kenyan universities in `kuccps-reference.ts`
- Mapped universities to all 19 KUCCPS clusters in database
- Updated Subject Selection Guide to show universities for each matched cluster
- Added "Universities Matched to You" card to student dashboard overview (shows 6 universities based on student's subjects)

**The 20 Universities:** University of Nairobi, Kenyatta University, JKUAT, Moi University, Strathmore University, USIU-Africa, Egerton University, Maseno University, Masinde Muliro University, Technical University of Kenya, Technical University of Mombasa, University of Eldoret, Pwani University, Kisii University, Laikipia University, South Eastern Kenya University, Multimedia University, KCA University, Daystar University, Mount Kenya University

#### Workstream 4: Senior to University Transition Guide
- Created `src/components/PersonalizedPathway.tsx` — shows complete student journey:
  - Detects CBC pathway from subjects (STEM/Arts/Social/TechVoc)
  - Shows selected subjects with grades
  - Calculates KCSE aggregate with cutoff tier
  - Displays qualified KUCCPS clusters (green/amber/grey cards)
  - Aggregates universities from qualified clusters
  - Shows career outcomes based on clusters
  - Two CTAs: "Explore & Adjust" and "Discuss with AI"
- Integrated PersonalizedPathway at top of `/subject-guide` page (only shows for logged-in students with subjects)

#### Workstream 5: PWA Mobile Design & UX Improvements
- Added `viewport-fit=cover` to `index.html` for full-screen PWA
- Added mobile typography scale in `src/index.css`:
  - Base font: 16px on mobile
  - H1: 2rem, H2: 1.75rem, H3: 1.375rem
  - Body line-height: 1.6
- Added `.safe-area-top` and `.safe-area-bottom` CSS classes for notched devices
- Applied safe area padding to StudentDashboard header and Navigation
- Increased mobile hamburger menu touch target to 40x40px
- Hidden FeedbackWidget on mobile (added `hidden md:flex`)
- Removed 3 action cards from student dashboard overview:
  - "Take Assessment" card
  - "Subject Selection Guide" card
  - "Talk to a Counselor" card

### CBC-Only Refactor
- **QuickAssessment.tsx**: Removed curriculum selector, defaulted to CBC, grade options now only Grade 7/9/11, removed Form 4 Leaver sub-step and KCSE grade entry
- **ProfileSetup.tsx**: Removed curriculum selector step, schema requires `curriculum: 'cbc'`, removed IGCSE education levels, simplified subject filtering
- **GuestAIChat.tsx**: Removed legacy/8-4-4 auto-detection, removed KCSE scorecard form, updated welcome message to CBC-only
- **ai-service.ts**: Removed IGCSE branch from prompts, removed KCSE academic performance section, removed kcseGrade/kcsePoints/subjectGrades from UserContext
- **report-generator.ts**: Removed kcseGrade/kcsePoints/clusterSubjects/subjectGrades from GuestProfile, curriculum always displays "Kenya's Competency-Based Curriculum (CBC)", removed KCSE section and subjectGrades breakdown from PDF
- **cbc-pathways.ts** (new): Created unified CBC pathway definitions with 4 pathways (STEM, Arts & Sports, Social Sciences, Technical & Vocational), added Junior Secondary subjects, added CBC competency level mapping (Exceeding/Meeting/Approaching/Below) with KCSE points conversion

### Database Changes
- Added `related_roles` text array to `career_paths` table
- Created `kuccps_clusters` table with 19 official clusters
- Updated all 19 clusters with university mappings

### Code Quality
- Created `src/lib/cbc-pathways.ts` as single source of truth for CBC pathway data
- Removed unused imports (Select, ScrollArea, Label, GraduationCap)
- Simplified component state management (removed subjectGrades, kcseGrade, kcsePoints from multiple components)
- All builds passing, no TypeScript errors

---

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
