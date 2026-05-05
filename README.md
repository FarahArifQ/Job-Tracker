# JobTracker

[![Live Demo](https://img.shields.io/badge/Live%20Demo-job--tracker--six--gilt.vercel.app-black?style=flat-square&logo=vercel)](https://job-tracker-six-gilt.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/Google-Gemini%20AI-4285F4?style=flat-square&logo=google)](https://ai.google.dev)

> An AI-powered job application tracker that analyses your fit for any role, generates interview prep and cover letters, and automates follow-up reminders — all in one place.

---

## Features

- 🤖 **AI Job Analysis** — Paste any job description and get an instant match score out of 10, required skills breakdown, red flags, and an apply recommendation
- 👤 **Personalised Scoring** — Upload your CV once; every analysis is tailored to your actual background and skills
- 📋 **Application Pipeline** — Track every application through five stages: Saved → Applied → Interviewing → Offer → Rejected
- 📝 **Notes per Application** — Add and edit personal notes on each job card, saved directly to the database
- ⚡ **Interview Prep** — Generate categorised interview questions (Technical, Behavioural, Role-specific) with model answers per job
- ✉️ **Cover Letter Generator** — AI writes a personalised cover letter using your CV profile and the job description
- 📊 **Live Stats Dashboard** — See your pipeline at a glance: tracked, applied, interviewing, offers, and response rate
- 🔔 **Automated Follow-up Reminders** — n8n workflow sends you a personalised follow-up email draft for every application older than 7 days
- 📅 **Weekly Digest** — Every Sunday morning you receive a summary of your active pipeline
- 🔐 **Multi-user Auth** — Full authentication with email/password and Google OAuth via Supabase
- 📱 **Fully Responsive** — Works on mobile, tablet, and desktop

---

## Tech Stack

| Technology | Role |
|---|---|
| **Next.js 16 + TypeScript** | Full-stack framework with App Router and server-side API routes |
| **Supabase (PostgreSQL)** | Database for job applications, user profiles, and notes |
| **Supabase Auth** | User authentication with Row Level Security — each user sees only their own data |
| **Google Gemini API** | AI model powering job analysis, interview prep, and cover letter generation |
| **n8n Cloud** | Serverless workflow automation for follow-up reminders and weekly digests |
| **Tailwind CSS v4** | Utility-first styling with a custom editorial cream design system |
| **Vercel** | Deployment with automatic GitHub integration |

---

## Screenshots

> _Screenshots coming soon_
>
> Key views: Landing / Auth → Dashboard with stats → Job analysis result → Applications list → Interview prep panel → Cover letter panel

---

## Run Locally

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Google AI Studio](https://aistudio.google.com) API key

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/FarahArifQ/Job-Tracker.git
cd Job-Tracker

# 2. Install dependencies
npm install

# 3. Set up environment variables (see below)
cp .env.example .env.local

# 4. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Supabase Setup

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Job applications table
create table job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  user_email text,
  job_text text,
  role text,
  company text,
  match_score integer,
  match_reason text,
  required_skills text[],
  red_flags text[],
  apply_recommendation text,
  status text default 'saved',
  notes text,
  created_at timestamptz default now()
);

-- User profiles table
create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users unique not null,
  cv_summary text,
  skills text[],
  experience_level text,
  target_roles text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table job_applications enable row level security;
alter table profiles enable row level security;

create policy "Users see own jobs" on job_applications
  for all using (auth.uid() = user_id);

create policy "Users see own profile" on profiles
  for all using (auth.uid() = user_id);
```

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
GEMINI_API_KEY=your-google-ai-studio-key
```

---

## How the AI Works

Every time a user pastes a job description, the app:

1. Fetches the user's CV summary and skills from their profile in Supabase
2. Constructs a prompt combining the candidate profile with the full job posting
3. Sends it to **Google Gemini** via the REST API, requesting structured JSON back
4. Parses the response into: match score, match reason, required skills, red flags, and an apply recommendation
5. Saves the result to the database and displays it instantly on the dashboard

The same pattern powers **interview prep** (returning categorised Q&A pairs per job) and **cover letter generation** (returning a personalised letter body using the candidate's actual background).

---

## How n8n Automation Works

Three automated workflows run in **n8n Cloud**:

| Workflow | Trigger | What it does |
|---|---|---|
| **Follow-up Nudge** | Daily at 9am | Queries Supabase for applications older than 7 days, generates a personalised follow-up email draft via Gemini, and sends it to the user |
| **Weekly Digest** | Every Sunday 8am | Pulls the user's active pipeline from Supabase and emails a structured summary of all in-progress applications |
| **Welcome Email** | On new signup | Sends a welcome message with tips on getting started |

The workflows connect Supabase's REST API, Gemini for personalised copy, and Gmail — all without any additional backend infrastructure.

---

## What I Learned Building This

- **Full-stack architecture** with Next.js App Router, server-side API routes, and Supabase SSR authentication
- **Prompt engineering** — structuring prompts to return consistent, parseable JSON from a generative AI model
- **Row Level Security** in PostgreSQL to enforce per-user data isolation at the database layer
- **Workflow automation** with n8n — connecting databases, AI APIs, and email in event-driven pipelines without writing backend code
- **Responsive design systems** — building a consistent editorial design language with CSS custom properties and Tailwind v4
- **Production deployment** — environment variables, Vercel build pipeline, and OAuth redirect configuration

---

## Author

**Farah Arif**  
Final Year Computer Science Student

[![GitHub](https://img.shields.io/badge/GitHub-FarahArifQ-black?style=flat-square&logo=github)](https://github.com/FarahArifQ)

---

<p align="center">Built with curiosity, caffeine, and a lot of Gemini API calls.</p>
