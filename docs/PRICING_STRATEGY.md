# CareerPath AI Pricing and Revenue Strategy

This document outlines the current technical implementation of pricing and the strategy for scaling the platform's revenue model.

## 1. Current Implementation

The platform manages three primary payment tracks:

| Category | Target | Price | Frequency | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Individual Pro** | Students/Parents | **KES 499** | Termly | Full access to AI assessments and reports. |
| **Institutional** | Schools | **KES 100** / student | Termly | Management dashboard for mentors and student roster. |
| **Counselor Sessions**| Students | **Variable** | Per Session | Direct booking with verified career experts (KES 500 - 3,000). |

### Billing Logistics
- **Platform**: IntaSend handles all M-Pesa, Visa, and Mastercard transactions.
- **Verification**: Database status updates automate access control.
- **Institutional Billing**: Calculated based on the total enrollment in the School Admin dashboard.

---

## 2. New Service Offerings

### A. Professional Counselor Bookings
Students can book 1-on-1 video calls with verified career experts.
- **Pricing**: Set by individual counselors (Admin approved).
- **Payment**: Processed upfront via the Counselor Directory.
- **Session Types**: 
  - Career Path Planning: KSh 1,500 (45 min)
  - University Guidance: KSh 1,000 (30 min)
  - Subject Selection: KSh 800 (30 min)
- **Integration**: Uses the existing IntaSend payment infrastructure with BOOK_ prefixed references

### B. Career Field Day Requests
Schools and student groups can request organized industrial visits.
- **Pricing**: Managed via quotations based on group size and location.
- **Process**: Requests are submitted via the student dashboard and managed by the Admin.

---

## 3. UI/UX Roadmap

### Dedicated Pricing Page
A high-conversion landing page that:
1.  Displays tiers side-by-side (Individual vs School).
2.  Lists features clearly with detailed comparisons.
3.  Includes local payment indicators (M-Pesa logo) to lower friction.
4.  Provides an FAQ section addressing common billing and data safety questions.

---

## 4. Technical Constants

Developers should maintain these values in the following locations:
- **School Pricing**: `src/lib/school-service.ts` -> `PRICE_PER_STUDENT_PER_TERM`
- **Student Pricing**: `src/components/PaymentWall.tsx` -> `pricingInfo` state
- **Counselor Rates**: Managed via `counselor_profiles` table in Supabase.
- **Payment References**: 
  - Individual subscriptions: PAY_{userId}_{timestamp}
  - Quick assessments: QA_{userName}_{timestamp}
  - Counselor sessions: BOOK_{studentId}_{counselorId}_{timestamp}
