# PediPulse — System Design & Product Architecture

## 1. Product Principle & Core Loop
PediPulse is an AI-assisted developmental pre-screening and referral platform designed for children aged 0–5 years, specifically targeted at underserved and low-income communities.

The platform centers around this loop:
**SCREEN → UNDERSTAND → REFER → FOLLOW UP**

### Essential Healthcare Safety Mandates
- **Non-Diagnostic Policy:** PediPulse is **not a diagnostic system**. It never declares that a child "has autism", "has ADHD", or "has a developmental disorder".
- **Standardized Terminology:** The platform exclusively uses respectful, neutral phrasing:
  - *"Possible developmental concern"*
  - *"Further professional assessment may be appropriate"*
  - *"This screening result is not a diagnosis"*
  - *"Consider discussing these observations with a qualified healthcare professional."*
- **Deterministic Scoring:** Clinical milestone scoring is calculated deterministically through rule-based backend algorithms with configurable cutoffs, never via LLM hallucinations.
- **AI's Assistive Role:** Server-side LLM (Gemini) is strictly used for educational translation into plain, empathetic language, generating practical play ideas and questions to ask a pediatrician.

---

## 2. System Architecture

```text
       [ Parent / Health Worker / Specialist ]
                         │
                 HTTPS (Port 3000)
                         │
              ┌──────────▼──────────┐
              │   React + Vite SPA   │
              │  Tailwind CSS UI    │
              │  (Vercel Deployable)│
              └──────────┬──────────┘
                         │
                 REST API (Port 5000)
                         │
              ┌──────────▼──────────┐
              │ Express.js Backend  │
              │ TypeScript Runtime  │
              │ (Render/Railway)    │
              └────┬──────────┬─────┘
                   │          │
      Server-side  │          │  PostgreSQL / RLS
         LLM API   │          │  Auth / Policies
    ┌──────────────▼───┐  ┌───▼──────────────┐
    │ Google Gemini API│  │     Supabase      │
    │ (Prompt Guarded) │  │  (Cloud Database) │
    └──────────────────┘  └──────────────────┘
```

---

## 3. User Roles & Access Control

| Role | Permissions & Capabilities |
| :--- | :--- |
| **Parent** | Register, add and manage own children, complete screening, view results, access AI explanations, find specialists/camps, submit referral requests, track follow-ups. |
| **Health Worker (ASHA)** | Community health portal, screen children on behalf of rural/low-income families, generate referral requests, coordinate with local DEIC clinics. |
| **Specialist / Admin** | Access Specialist Consultation Portal, review incoming referrals with non-disclosing PII summaries, confirm/accept appointments, manage availability and camp schedules. |

---

## 4. Scoring Engine & Threshold Configuration

Screening questionnaires are divided into 6 distinct age groups:
1. `0–6 months`
2. `7–12 months`
3. `13–24 months`
4. `25–36 months`
5. `37–48 months`
6. `49–60 months`

Each age band evaluates 6 developmental domains:
- Communication
- Gross Motor
- Fine Motor
- Cognitive
- Social/Emotional
- Adaptive / Self-help

### Scoring Rules
- `Yes` = 10 points (Mastered / consistent)
- `Sometimes` = 5 points (Emergent / occasional)
- `Not yet` = 0 points (Not yet present)
- `Unsure` = 0 points (Treated conservatively to trigger monitoring)

### Configurable Category Cutoffs
- **Age Appropriate:** $\ge 80\%$
- **Monitor:** $50\% - 79\%$
- **Possible Concern:** $< 50\%$

### Overall Screening Risk Category
- **Professional Assessment Recommended:** Any domain has `Possible Concern` or $\ge 2$ domains are `Monitor`.
- **Monitor:** Exactly 1 domain is `Monitor`.
- **Low Concern:** All domains are `Age Appropriate`.

---

## 5. Security & Privacy
1. **Row Level Security (RLS):** Supabase policies isolate children and screening data per guardian ID.
2. **Specialist Privacy Shield:** Specialists receive developmental summaries and guardian initials without disclosing unnecessary identifying personal records.
3. **No Frontend Secrets:** `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` reside strictly on the Express backend.
4. **AI Rate Limiting:** Sliding window rate limiter prevents cost overruns and abuse.

