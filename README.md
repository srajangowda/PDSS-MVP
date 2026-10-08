# PediPulse — AI-Assisted Developmental Pre-Screening & Referral Platform

> **Target Audience:** Children aged 0–5 years, particularly in underserved and low-income communities.  
> **Core Principle:** **SCREEN → UNDERSTAND → REFER → FOLLOW UP**  
> **Important Safety Notice:** PediPulse is a pre-screening and referral coordination platform, **not a diagnostic system**. It does not diagnose medical or developmental conditions.

---

## 1. Problem & Solution

### The Problem
- **Specialist Concentration:** In developing and rural regions, developmental pediatricians, speech pathologists, and child psychologists are clustered in tier-1 metro hospitals.
- **Missed Interventions:** 85% of brain architecture is established by age 3, yet signs of developmental delay are often missed until school age (5–6 years).
- **Clinical Jargon Barrier:** Standard medical reports can frighten parents and create undue anxiety.
- **Frontline Health Worker Need:** Community health workers (e.g. ASHA, Anganwadi) lack calibrated, easy-to-use digital screening instruments on mobile devices.

### The PediPulse Solution
1. **Age-Calibrated Pre-Screening:** Intuitively calculates exact age in months and administers non-jargon milestone checklists across 6 core domains.
2. **Deterministic Scoring Engine:** Evaluates domain status using rule-based calculations without LLM hallucinations.
3. **AI Educational Insights:** Server-side Gemini translation breaks down results into plain parental guidance, home play routines, and structured questions for pediatric visits.
4. **Referral Coordination:** Connects families directly to local pediatric specialists and free community screening camps.
5. **Timeline & Follow-up Tracking:** Automatically establishes post-screening check-ins and tracks patient appointment status.

---

## 2. Features

- **Child Profile Management:** Automatic age calculation in years and months with gender, guardian, and community location tracking.
- **Age-Calibrated Question Banks:** Covers 6 age brackets (0–6m, 7–12m, 13–24m, 25–36m, 37–48m, 49–60m) across Communication, Gross Motor, Fine Motor, Cognitive, Social/Emotional, and Adaptive domains.
- **Interactive Questionnaire UI:** Real-time progress bar, domain badges, back/next navigation, retained choices, and confirmation dialogs.
- **Neutral Visual Results Page:** Non-alarming color palettes with domain-level breakdown and actionable next steps.
- **AI-Powered Parent Explanation:** Server-side Google Gemini integration returning structured JSON summaries, areas of attention, recommended next steps, and questions for doctors.
- **Official Printable Report:** Clean, printable PDF/document preview with official non-diagnostic medical disclaimer.
- **Specialist & Camp Directory:** Searchable directory with filters for location, medical specialty, and free community screening camps.
- **Referral Workflow:** Complete 5-stage progress pipeline (`Screening` → `Referral` → `Appointment` → `Assessment` → `Follow-up`).
- **Specialist Consultation Portal:** Clinical view enabling specialists to review summaries with protected patient PII, confirm appointments, or decline referrals.
- **Follow-up Reminders:** Dedicated check-in tracking with one-click completion.
- **1-Click Demo Persona Switcher:** Built-in switcher allowing judges to instantly evaluate Parent, Health Worker, and Specialist roles.

---

## 3. Tech Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, React Router v6, Lucide React icons
- **Backend:** Node.js, Express.js, TypeScript, Zod validation, `@google/generative-ai` SDK
- **Database & Auth:** Supabase (PostgreSQL with Row Level Security) + seamless in-memory fallback for instant zero-dependency local testing
- **AI Engine:** Google Gemini (server-side only, strictly prompt-guarded, deterministic fallback support)

---

## 4. Project Structure

```text
PDDS-MVP/
├── frontend/
│   ├── src/
│   │   ├── components/       # Navbar, Footer, Skeletons, Modals (Report, AI Explanation)
│   │   ├── context/          # AuthContext supporting Supabase & Demo Personas
│   │   ├── pages/            # Landing, Login, Register, Dashboard, Children, Screening, Specialists, Referrals, Followups
│   │   ├── services/         # Typed API client connecting to backend
│   │   ├── types/            # TypeScript data models
│   │   └── App.tsx           # Route definitions & Role protection
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── middleware/       # Auth token verification, rate limiter, error sanitizer
│   │   ├── routes/           # Auth, Children, Screening, AI, Specialists, Referrals, Followups
│   │   ├── services/         # Screening engine, Gemini service, Store (Supabase + In-Memory)
│   │   ├── types/            # Backend TypeScript types
│   │   └── index.ts          # Express server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── supabase/
│   ├── migrations/           # 01_initial_schema.sql (Tables, RLS policies, indexes)
│   └── seed.sql              # Fictional demo profiles, questions, children, specialists, camps
│
├── .env.example
├── design.md
└── README.md
```

---

## 5. Environment Variables

Create `.env` in `backend/` and `frontend/` using `.env.example`:

### Frontend (`frontend/.env`)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=http://localhost:5000/api
```

### Backend (`backend/.env`)
```env
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GEMINI_API_KEY=your-gemini-api-key
NODE_ENV=development
```

> **Note:** PediPulse includes a built-in hybrid data store and deterministic fallback engine. If Supabase or Gemini keys are not configured, the entire application still runs flawlessly in local demo mode with zero configuration!

---

## 6. Local Development Setup

### 1. Install Dependencies
```bash
# In the root repository
npm run install:all
```

Or install in each directory:
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Start the Backend Server (Port 5000)
```bash
cd backend
npm run dev
```

### 3. Start the Frontend Server (Port 3000)
```bash
cd frontend
npm run dev
```

Open your browser at **http://localhost:3000**.

---

## 7. Supabase Database & Auth Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in your Supabase dashboard.
3. Run the migration script: `supabase/migrations/01_initial_schema.sql`.
4. Run the seed script: `supabase/seed.sql`.
5. Under **Authentication > URL Configuration**, add `http://localhost:3000` to the redirect URLs.
6. Copy the project URL and Service Role Key to `backend/.env`, and the Anon Key to `frontend/.env`.

---

## 8. Deployment

### Frontend (Vercel)
1. Link your repository to Vercel.
2. Set Root Directory to `frontend`.
3. Set build command: `npm run build` (output directory: `dist`).
4. Add environment variable: `VITE_API_BASE_URL=https://your-backend.onrender.com/api`.

### Backend (Render / Railway)
1. Create a new Web Service pointing to `backend`.
2. Build command: `npm install && npm run build`.
3. Start command: `npm run start`.
4. Configure environment variables (`PORT`, `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).

---

## 9. Evaluation & Testing Flow

You can evaluate the application end-to-end via the UI:

1. Visit **http://localhost:3000**
2. Use the **Demo Switcher** in the header or click **"Try Demo Parent"**
3. View **Rahul Sharma** or click **"Add Child"**
4. Click **"Start Screening"** → answer age-appropriate milestone questions
5. Click **"Complete Screening"** → review deterministic domain breakdown
6. Click **"Get AI Explanation"** → inspect educational advice and doctor questions
7. Click **"Find Specialist"** → select a specialist or camp slot → click **"Request Referral"**
8. Switch persona to **Specialist** (Dr. Ananya Rao) → accept the referral in the **Specialist Hub**
9. Switch back to **Parent** → see the updated status in **Referrals** and the check-in date in **Follow-ups**!

