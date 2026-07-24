# Counselor Booking System

## Overview
The counselor booking system allows students to book 1-on-1 career guidance sessions with verified professional counselors. This feature provides personalized support beyond the AI chat functionality.

## Implementation Details

### Component Structure
The system is implemented through the `CounselorBookingSection.tsx` component which includes:
- Visual display of counselor availability and session types
- Flexible scheduling options
- Secure video calls
- Pricing information for different session types
- CTA buttons to view counselors or learn more

### Features
- **Verified Professionals**: All counselors are verified professionals
- **Flexible Scheduling**: Students can choose from available time slots
- **Secure Video Calls**: Encrypted video sessions for privacy
- **Personalized Roadmaps**: Customized career guidance sessions
- **Multiple Session Types**: Different durations and focus areas

### Pricing Structure
- Career Path Planning: KSh 1,500 (45 min)
- University Guidance: KSh 1,000 (30 min)
- Subject Selection: KSh 800 (30 min)

### User Flow
1. Student visits the landing page or dashboard
2. Sees counselor booking section with available sessions
3. Clicks "View Counselors" to see available counselors
4. Selects a counselor and session type
5. Proceeds with booking and payment via IntaSend
6. Receives confirmation and scheduling details

## Integration Points

### Authentication
- Students must be authenticated to book sessions
- Unauthenticated users are redirected to signup/login

### Payment Processing
- Uses existing IntaSend payment infrastructure
- Session-specific payment references (BOOK_ prefix)
- Integration with the existing payments table

### Database Integration
- Creates entries in `counselor_sessions` table
- Links student and counselor IDs
- Records session status and payment details

## Technical Implementation

### Frontend Components
- `CounselorBookingSection.tsx` - Main booking section
- `CounselorCard.tsx` - Individual counselor display
- `BookingModal.tsx` - Session scheduling modal

### Backend Integration
- Supabase functions for counselor availability
- Payment webhook handling for session bookings
- Session management in database

## Security Considerations
- All counselor sessions are secured with encrypted video calls
- Payment processing through verified IntaSend infrastructure
- Session data stored securely in Supabase
- User authentication required for all booking interactions

## Testing Scenarios
1. Unauthenticated user accessing booking section
2. Authenticated student viewing available counselors
3. Successful booking and payment processing
4. Session cancellation and rescheduling
5. Payment failure handling