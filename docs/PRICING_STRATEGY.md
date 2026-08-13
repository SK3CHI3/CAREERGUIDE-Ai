# CareerGuide AI Pricing and Revenue Strategy

This document outlines the current technical implementation of pricing and the strategy for scaling the platform's revenue model.

## 1. Current Implementation

The platform manages two primary payment tracks:

| Category | Target | Price | Frequency | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Individual** | Students/Parents | **KES 499** | Termly | Full access to AI assessments and reports. |
| **Counselor Sessions** | Students | **KES 1,000** | Per Hour | 1-on-1 booking with verified career counselors. |

### Billing Logistics
- **Platform**: IntaSend handles all M-Pesa, Visa, and Mastercard transactions.
- **Verification**: Database status updates automate access control.
- **Free Trial**: Full access for the current academic term, with a 3-day grace period after expiry before access is locked.

---

## 2. Service Offerings

### A. Individual Subscription
- Full access to AI career assessments, recommendations, and reports
- RIASEC personality profiling
- AI career chat counselor
- Academic performance tracking
- Career directory access (500+ paths)

### B. Professional Counselor Bookings
Students can book 1-on-1 video calls with verified career counselors.
- **Pricing**: KSh 1,000/hr (set per counselor, admin approved).
- **Payment**: Processed upfront via the Counselor Directory.
- **Current Counselor**: Victor Omollo — KSh 1,000/hr
- **Integration**: Uses the existing IntaSend payment infrastructure with BOOK_ prefixed references

---

## 3. UI/UX Roadmap

### Dedicated Pricing Page
A high-conversion landing page that:
1.  Displays tiers side-by-side (Individual vs Counselor Sessions).
2.  Lists features clearly with detailed comparisons.
3.  Includes local payment indicators (M-Pesa logo) to lower friction.
4.  Provides an FAQ section addressing common billing and data safety questions.

---

## 4. Technical Constants

Developers should maintain these values in the following locations:
- **Student Pricing**: `src/components/PaymentWall.tsx` — `pricingInfo` state
- **Counselor Rates**: Managed via `counselor_profiles` table in Supabase; default displayed in `src/components/CounselorDirectory.tsx`
- **Payment References**:
  - Individual subscriptions: `PAY_{userId}_{timestamp}`
  - Quick assessments: `QA_{userName}_{timestamp}`
  - Counselor sessions: `BOOK_{studentId}_{counselorId}_{timestamp}`
