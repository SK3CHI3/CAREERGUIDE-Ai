# IntaSend Payment Integration

## Overview
This document outlines the implementation of the IntaSend Payment integration for the AI Career Finder application, requiring students to pay KSh 499 per term and schools KSh 100 per student.

## Implementation Details

### 1. Database Schema Updates
The system uses two layers for payment tracking:

#### profiles table (State Management)
- `payment_status`: 'pending', 'completed', 'failed'
- `subscription_expires_at`: Calculated timestamp based on academic term
- `subscription_type`: 'individual' or 'institutional'

#### payments table (New Audit Log)
A dedicated `payments` table acts as the source of truth for all financial transactions:
- `id`: Unique transaction ID
- `user_id`: Reference to user
- `school_id`: Reference to school (for institutional payments)
- `amount`: KES value
- `status`: 'completed' or 'failed'
- `intasend_transaction_id`: External reference
- `payment_type`: 'subscription', 'quick_assessment', or 'counselor_session'
- `api_ref`: Reference for tracking (starts with 'PAY_', 'QA_', or 'BOOK_')
- `payload`: Full JSON payload from IntaSend for auditing

### 2. Components Created

#### Dashboard Verification
The UI now includes a "Verifying..." state that polls the database after the payment popup closes. This ensures the user only gains access after the background webhook has successfully processed the transaction and verified the signature.

### 3. User Flow

```
Registration → Profile Setup → Payment Wall → Full Access
     ↓              ↓              ↓            ↓
   Sign Up → Complete Profile → Pay KSh 1,000 → Dashboard
```

Add to Supabase / Environment:
```bash
VITE_INTASEND_PUBLIC_KEY=ISPubKey_live_...
VITE_INTASEND_LIVE=true
INTASEND_WEBHOOK_SECRET=ISSecretKey_live_... (Supabase Secret)
```

### 5. IntaSend Configuration

#### Test Environment
- Use sandbox key from https://sandbox.intasend.com/
- No sign-up required for testing
- Test with sandbox payment methods

#### Production Environment
- Get live API key from IntaSend dashboard
- Set `VITE_INTASEND_LIVE=true`
- Configure webhook endpoints for payment notifications

### 6. Payment Button Features

The payment button includes:
- Amount: KSh 1,000 (fixed)
- Currency: KES
- Customer details pre-filled from profile
- All payment methods enabled (M-Pesa, Cards, etc.)
- Business pays all charges
- Custom reference for tracking

### 7. Security (Production Level)

- **HMAC Verification**: The `intasend-webhook` Edge Function performs SHA-256 HMAC verification on every request using the `X-IntaSend-Signature` header.
- **Idempotency**: The webhook checks the `payments` table for existing `intasend_transaction_id` before processing to prevent double-crediting.
- **Service Role**: Database updates are performed via the Supabase Service Role to bypass RLS for payment auditing.

### 8. Term-Based Subscription Logic

The platform aligns access with the Kenyan academic calendar:
- **Calculation**: Expiry is set to the `end_date` of the current active term found in `global_settings`.
- **Grace Period**: A **3-day grace period** is automatically added to the term end date.
- **Fail-safe**: If no term is found in settings, the system defaults to a 90-day subscription window.
- **Institutional Payments**: When a school rep pays, the entire school subscription is updated to 'premium', allowing students to access features without individual payments.

### 8. Testing

#### Test Payment Methods
- M-Pesa: Use test phone numbers
- Cards: Use test card numbers from IntaSend docs
- Verify payment status updates correctly

#### Test Scenarios
1. Complete profile → Payment wall appears
2. Successful payment → Dashboard access granted
3. Failed payment → Retry option available
4. Payment processing → Loading state shown

### 9. Error Handling

- Payment failure: Show retry button
- Network errors: Graceful fallback
- Invalid API key: Clear error message
- Payment timeout: Retry mechanism

### 10. Monitoring

- Track payment success/failure rates
- Monitor payment processing times
- Log payment events for debugging
- Set up alerts for payment failures

### 11. Payment Types

The system supports three distinct payment types:

1. **Subscription Payments** (prefix: `PAY_`)
   - Used for individual student subscriptions
   - Amount: KSh 499 per term
   - Reference format: `PAY_{userId}_{timestamp}`

2. **Quick Assessment Payments** (prefix: `QA_`)
   - Used for one-time diagnostic assessments
   - Amount: KSh 50
   - Reference format: `QA_{userName}_{timestamp}`

3. **Counselor Session Payments** (prefix: `BOOK_`)
   - Used for booking 1-on-1 career counseling sessions
   - Amount varies by session type (KSh 800-1500)
   - Reference format: `BOOK_{studentId}_{counselorId}_{timestamp}`

## Getting Started

1. Get IntaSend API key from https://sandbox.intasend.com/
2. Add API key to `.env.local`
3. Test payment flow in development
4. Configure production API key
5. Deploy with payment integration

## Support

- IntaSend Documentation: https://developers.intasend.com/docs/payment-button
- IntaSend Support: Available through their platform
- Test Environment: https://sandbox.intasend.com/
