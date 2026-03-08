# BuffMatch AI

AI-powered campus job portal for CU Boulder with **explainable ATS screening**.

Students see why they match or don't, get improvement suggestions, and hiring contact details (e.g. professor email for TA roles). Recruiters post jobs, view ranked applicants with score breakdowns, and manage an applicant tracker.

---

## Quick Start (3 commands)

Open a terminal, `cd` into the project folder, and run:

```
cd buffmatch-ai
npm install --legacy-peer-deps
npm run db:setup
npm run dev
```

Then open **http://localhost:3000** in your browser.

---

## Demo Accounts (no password needed)

| Email | Role | What to see |
|-------|------|-------------|
| `student1@colorado.edu` | Student | Has resume + 2 applications (1 rejected with feedback) |
| `student2@colorado.edu` | Student | Has resume + 1 application |
| `student3@colorado.edu` | Student | Has resume, no applications yet |
| `hr@colorado.edu` | Recruiter | Owns 9 jobs with applicants |
| `cs-dept@colorado.edu` | Recruiter | Owns TA job with applicant |

Just type the email, leave password blank, pick role, and click Sign in.

---

## Demo Flow (Hackathon Presentation)

### Student flow:
1. Go to http://localhost:3000 → Click "I'm a student"
2. Sign in as `student1@colorado.edu` (student role)
3. **Dashboard**: See resume status and 2 existing applications
4. Click **Jobs** → See 10 on-campus positions
5. Click **Teaching Assistant - CS 101** → See match score breakdown, gap analysis, hiring contact (Dr. Sarah Chen, email, phone, office hours)
6. Click **Applications** → See tracker status for each
7. Click the TA application → See explainable rejection: what was missing, how to improve, 3 alternate jobs

### Recruiter flow:
1. Sign out → Sign in as `hr@colorado.edu` (recruiter role)
2. **Dashboard**: See job count and total applications
3. Click **My jobs** → See all 9 positions
4. Click **View applicants** on Library Assistant → See ranked applicants with scores
5. Toggle **Blind review** to hide names
6. Change applicant status (Under review, Shortlisted, etc.)
7. Click **Post a new job** → Create one with contact info

---

## Tech Stack

- **Next.js 13.5** (App Router)
- **TypeScript**
- **Tailwind CSS** (CU Boulder theme)
- **SQLite** via **Prisma ORM** (zero setup, no PostgreSQL needed)
- **NextAuth.js** (credential auth, @colorado.edu emails)
- **OpenAI** (optional - works without API key using keyword matching)

## Project Structure

```
buffmatch-ai/
├── app/                    # Next.js pages and API routes
│   ├── page.tsx            # Landing page
│   ├── login/              # Sign in
│   ├── dashboard/          # Student dashboard
│   ├── resume/             # Resume upload
│   ├── jobs/               # Job listings + [id] detail
│   ├── applications/       # Student applications + [id] detail
│   ├── recruiter/          # Recruiter dashboard, jobs, applicants
│   └── api/                # Auth, resume/parse, jobs, applications
├── components/
│   ├── ui/                 # Button, Card, Input, Label, Progress, Select
│   ├── shared/             # ScoreBreakdown, ExplainableCard, GapAnalysis, etc.
│   └── layout/             # Header, Footer
├── lib/
│   ├── db.ts               # Prisma client
│   ├── auth.ts             # NextAuth config
│   └── ai/                 # Match engine, parsers, filters, explanations
├── prisma/
│   ├── schema.prisma       # Database schema (SQLite)
│   └── seed.ts             # Demo data
└── .env                    # Database URL + auth secret
```

## If You Want OpenAI Features

Set your API key in `.env`:
```
OPENAI_API_KEY="sk-..."
```

This enables: LLM-powered resume parsing, job description parsing, and AI-generated rejection summaries. Without it, the app uses keyword matching (works fine for demo).

## Seed Data

- **10 jobs**: Library Assistant, Dining Services, Teaching Assistant (CS 101), IT Help Desk, Front Desk, Rec Center, Research Assistant, Tutoring Center, Campus Tour Guide, Admin Assistant
- **3 students**: Alex Morgan (CS), Jordan Taylor (Bio), Casey Kim (English)
- **Sample applications**: Alex → TA (screened_out with full feedback), Alex → Library (screened_in), Jordan → Dining (screened_in)
