# CareerGuide AI — AI Career Guidance for Kenyan Students

**CareerGuide AI** is a free AI-powered career guidance platform built for Kenyan students navigating the CBC and 8-4-4 education systems. Get personalized career recommendations, track academic performance, and chat with an AI career counselor — all tailored to Kenya's job market.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-careerguideai.co.ke-blue)](https://careerguideai.co.ke)
[![Built with](https://img.shields.io/badge/Built%20with-React%20%2B%20Supabase-green)]()
[![License](https://img.shields.io/badge/License-Proprietary-red)]()

## ✨ Key Features

- **🤖 AI Career Recommendations** — DeepSeek-powered analysis combining RIASEC personality, grades, and Kenya's labour market
- **📊 RIASEC Assessment** — Six-dimension personality profiling with radar chart visualization
- **💬 AI Career Chat** — Full-page conversational counselor for subject choices, university paths, and job market questions
- **📈 Academic Tracking** — Grade management with automatic career match recalculation
- **🎓 Career Directory** — 500+ career paths with salaries, growth, and education requirements for Kenya
- **👩‍🏫 Teacher Dashboard** — Tools for teachers to guide students' career decisions
- **👨‍⚕️ Counselor Access** — Book 1-on-1 sessions with verified professional counselors

## 🚀 Quick Start

```bash
git clone https://github.com/SK3CHI3/CAREERGUIDE-Ai.git
cd CAREERGUIDE-Ai
npm install
cp .env.example .env   # Add your Supabase + DeepSeek keys
npm run dev
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase public key |
| `VITE_DEEPSEEK_API_KEY` | DeepSeek API key for AI features |

## 🛠 Tech Stack

**Frontend:** React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · shadcn/ui  
**Backend:** Supabase (PostgreSQL + Auth + RLS + Storage)  
**AI:** DeepSeek V3.1 (streaming chat + JSON recommendations)  
**Charts:** Recharts (pie, radar, bar)  
**Payments:** IntaSend (M-Pesa)  
**Deploy:** Netlify

## 📱 Screenshots

| Student Dashboard | AI Career Chat | Career Directory |
|---|---|---|
| Personalized career matches with RIASEC radar chart | Full-page AI counselor conversation | 500+ Kenya-specific career paths |

## 📖 Documentation

- [V3 Migration Guide](docs/V3_MIGRATION.md) — Architecture changes, database migrations, and what was removed
- [Developer Guide](docs/DEVELOPER.md) — Contributing and local development setup
- [Security](docs/SECURITY.md) — Authentication, RLS policies, and data protection
- [Deployment](docs/NETLIFY_DEPLOYMENT.md) — Production deployment and CI/CD

## 💰 Pricing

| Plan | Price | Features |
|------|-------|----------|
| **Free Trial** | KSh 0 | Full access for the current academic term |
| **Individual** | KSh 499/term | Full access, paid via M-Pesa |

*3-day grace period after expiry before access is locked.*

## 🤝 Contributing

This is a proprietary project. For bug reports or feature requests, please open an issue.

## 📄 License

Proprietary. All rights reserved. See [LICENSE](LICENSE) for details.

---

Built with ❤️ for Kenyan students navigating their career journeys.
