-- PediPulse Supabase Schema Migration 01
-- Pediatric Pre-screening and Referral Platform

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('parent', 'health_worker', 'specialist', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. CHILDREN
CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dob DATE NOT NULL,
  gender TEXT NOT NULL,
  location TEXT NOT NULL,
  guardian_name TEXT NOT NULL,
  guardian_phone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. SCREENING QUESTIONS
CREATE TABLE IF NOT EXISTS screening_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  age_min_months INT NOT NULL,
  age_max_months INT NOT NULL,
  domain TEXT NOT NULL,
  question TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true
);

-- 4. SCREENINGS
CREATE TABLE IF NOT EXISTS screenings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  completed_by UUID REFERENCES profiles(id),
  overall_score NUMERIC NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL,
  domain_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. SCREENING ANSWERS
CREATE TABLE IF NOT EXISTS screening_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screening_id UUID NOT NULL REFERENCES screenings(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES screening_questions(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  score NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. SPECIALISTS & CAMPS
CREATE TABLE IF NOT EXISTS specialists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  location TEXT NOT NULL,
  bio TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  type TEXT NOT NULL DEFAULT 'individual' CHECK (type IN ('individual', 'camp')),
  organization TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT ''
);

-- 7. AVAILABILITY
CREATE TABLE IF NOT EXISTS availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  available_slots INT NOT NULL DEFAULT 5
);

-- 8. REFERRALS
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  screening_id UUID NOT NULL REFERENCES screenings(id) ON DELETE CASCADE,
  specialist_id UUID NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
  availability_id UUID REFERENCES availability(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Requested' CHECK (status IN ('Requested', 'Confirmed', 'Completed', 'Cancelled')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. FOLLOWUPS
CREATE TABLE IF NOT EXISTS followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  referral_id UUID REFERENCES referrals(id) ON DELETE SET NULL,
  followup_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Overdue')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. AI EXPLANATIONS
CREATE TABLE IF NOT EXISTS ai_explanations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screening_id UUID NOT NULL REFERENCES screenings(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  areas_of_attention JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_next_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  questions_for_doctor JSONB NOT NULL DEFAULT '[]'::jsonb,
  disclaimer TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_children_parent ON children(parent_id);
CREATE INDEX IF NOT EXISTS idx_screenings_child ON screenings(child_id);
CREATE INDEX IF NOT EXISTS idx_answers_screening ON screening_answers(screening_id);
CREATE INDEX IF NOT EXISTS idx_referrals_child ON referrals(child_id);
CREATE INDEX IF NOT EXISTS idx_referrals_specialist ON referrals(specialist_id);
CREATE INDEX IF NOT EXISTS idx_followups_child ON followups(child_id);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialists ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_questions ENABLE ROW LEVEL SECURITY;

-- POLICIES
-- Profiles: Users can view their own profile; specialists can view profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Screening questions: Public/Authenticated can read active questions
CREATE POLICY "Anyone authenticated can read questions" ON screening_questions
  FOR SELECT USING (active = true);

-- Specialists & Availability: Publicly readable by authenticated users
CREATE POLICY "Anyone authenticated can read specialists" ON specialists
  FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone authenticated can read availability" ON availability
  FOR SELECT USING (true);

-- Children: Parent or assigned health worker
CREATE POLICY "Parents can read their children" ON children
  FOR SELECT USING (
    parent_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('health_worker', 'admin', 'specialist'))
  );
CREATE POLICY "Parents and Health Workers can insert children" ON children
  FOR INSERT WITH CHECK (
    parent_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('health_worker', 'admin'))
  );
CREATE POLICY "Parents can update their children" ON children
  FOR UPDATE USING (
    parent_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('health_worker', 'admin'))
  );
CREATE POLICY "Parents can delete their children" ON children
  FOR DELETE USING (parent_id = auth.uid());

-- Screenings
CREATE POLICY "Screening viewable by parent, author, or specialist" ON screenings
  FOR SELECT USING (
    completed_by = auth.uid()
    OR EXISTS (SELECT 1 FROM children WHERE children.id = screenings.child_id AND children.parent_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('specialist', 'admin', 'health_worker'))
  );
CREATE POLICY "Screening insertable by authenticated user" ON screenings
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Screening answers
CREATE POLICY "Answers viewable with screening access" ON screening_answers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM screenings WHERE screenings.id = screening_answers.screening_id)
  );
CREATE POLICY "Answers insertable" ON screening_answers
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Referrals
CREATE POLICY "Referrals readable by parent and specialist" ON referrals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM children WHERE children.id = referrals.child_id AND children.parent_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('specialist', 'admin', 'health_worker'))
  );
CREATE POLICY "Referrals insertable" ON referrals
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Referrals updatable by specialist/admin" ON referrals
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('specialist', 'admin'))
  );

-- Followups
CREATE POLICY "Followups readable" ON followups
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM children WHERE children.id = followups.child_id AND children.parent_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('specialist', 'admin', 'health_worker'))
  );
CREATE POLICY "Followups updatable" ON followups
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- AI Explanations
CREATE POLICY "AI Explanations viewable" ON ai_explanations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM screenings WHERE screenings.id = ai_explanations.screening_id)
  );
CREATE POLICY "AI Explanations insertable" ON ai_explanations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

