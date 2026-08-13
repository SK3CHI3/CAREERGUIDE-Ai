# Counselor Booking System

## Overview
The counselor booking system allows students to book 1-on-1 career guidance sessions with verified professional counselors. This feature provides personalized support beyond the AI chat functionality.

## Current Implementation

### Counselor
- **Victor Omollo** — Career Counselor, KSh 1,000/hr
- Single counselor currently hardcoded in `CounselorDirectory.tsx`
- Admin interface available via `AdminCounselorManager.tsx` for adding more counselors

### User Flow
1. Student visits the public `/counselors` page (no authentication required to browse)
2. Sees available counselor(s) with hourly rate and specialties
3. Selects a counselor and initiates booking
4. Must be authenticated to complete booking — redirected to login if not
5. Proceeds with payment via IntaSend (M-Pesa, Visa, Mastercard)
6. Receives confirmation and scheduling details

### Pricing
- Flat rate of **KSh 1,000/hr** per counselor session
- Rate is set per counselor in the `counselor_profiles` table (admin approved)

## Integration Points

### Authentication
- Browsing the counselor directory is public (`/counselors` route)
- Students must be authenticated to book and pay for sessions
- Unauthenticated users are redirected to signup/login when attempting to book

### Payment Processing
- Uses existing IntaSend payment infrastructure
- Payment references use `BOOK_{studentId}_{counselorId}_{timestamp}` format
- Integration with the existing payments table

### Database Integration
- Creates entries in `counselor_sessions` table
- Links student and counselor IDs
- Records session status and payment details
- RLS policies on `counselor_profiles`, `counselor_sessions`, and related tables (migration: `20260710000000_enable_rls_counselor_tables`)

## Technical Implementation

### Frontend Components
- `CounselorBookingSection.tsx` — Marketing section on landing page with background image design
- `CounselorDirectory.tsx` — Public directory page with booking flow and payment integration
- `AdminCounselorManager.tsx` — Admin dashboard component for managing counselors

### Backend Integration
- Counselor data stored in `counselor_profiles` table in Supabase
- Payment webhook handling for session bookings
- Session management in `counselor_sessions` table

## Security Considerations
- All counselor sessions secured with encrypted video calls
- Payment processing through verified IntaSend infrastructure
- Session data stored securely in Supabase with RLS policies
- User authentication required for booking interactions

## Future Enhancements
- Multiple counselors with varying specialties and rates
- Session type selection (career planning, university guidance, subject selection)
- Session cancellation and rescheduling flow
- Counselor availability calendar
- Rating and review system
