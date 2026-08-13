# CareerGuide AI — AI Career Guidance for Kenyan Students

**CareerGuide AI** is a free AI-powered career guidance platform built for Kenyan students navigating the CBC and 8-4-4 education systems. Get personalized career recommendations, track academic performance, and chat with an AI career counselor — all tailored to Kenya's job market.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-careerguideai.co.ke-blue)](https://careerguideai.co.ke)
[![Built with](https://img.shields.io/badge/Built%20with-React%20%2B%20Supabase-green)]()
[![License](https://img.shields.io/badge/License-Proprietary-red)]()

## About

CareerGuide AI combines RIASEC personality profiling, academic performance, and Kenya's labour market data to deliver personalized career guidance. Students get AI-powered career recommendations, a conversational AI career counselor, and access to verified professional counselors for 1-on-1 sessions. Mentors (parents, guardians, and educators) can track student progress and guide career decisions.

## Tech Stack

**Frontend:** React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · shadcn/ui
**Backend:** Supabase (PostgreSQL + Auth + RLS + Storage)
**AI:** DeepSeek V3.1 (streaming chat + JSON recommendations)
**Charts:** Recharts (pie, radar, bar)
**Payments:** IntaSend (M-Pesa)
**Deploy:** Netlify

## Screenshots

| Student Dashboard | AI Career Chat | Career Directory |
|---|---|---|
| Personalized career matches with RIASEC radar chart | Full-page AI counselor conversation | 500+ Kenya-specific career paths |

## Documentation

- [V3 Migration Guide](docs/V3_MIGRATION.md) — Architecture changes, database migrations, and what was removed
- [Developer Guide](docs/DEVELOPER.md) — Contributing and local development setup
- [Security](docs/SECURITY.md) — Authentication, RLS policies, and data protection
- [Deployment](docs/NETLIFY_DEPLOYMENT.md) — Production deployment and CI/CD
- [IntaSend Integration](docs/INTASEND_INTEGRATION.md) — Payment processing with M-Pesa and credit cards
- [Career Guidance Flow](docs/CAREER_GUIDANCE_FLOW.md) — Complete user journey from assessment to career planning
- [Counselor Booking](docs/COUNSELOR_BOOKING.md) — 1-on-1 counselor session booking system
- [Mentor System](docs/MENTOR_SYSTEM_FLOW.md) — Mentor role and student management flow
- [Pricing Strategy](docs/PRICING_STRATEGY.md) — Revenue model and pricing tiers

## Pricing

| Plan | Price | Features |
|------|-------|----------|
| **Free Trial** | KSh 0 | Full access for the current academic term |
| **Individual** | KSh 499/term | Full access, paid via M-Pesa |
| **Counselor Session** | KSh 1,000/hr | 1-on-1 with a verified career counselor |

*3-day grace period after expiry before access is locked.*

## Contributing

This is a proprietary project. For bug reports or feature requests, please open an issue.

## License

Proprietary. All rights reserved. See [LICENSE](LICENSE) for details.
