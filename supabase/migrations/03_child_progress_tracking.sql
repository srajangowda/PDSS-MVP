-- PediPulse Supabase Schema Migration 03
-- Child Progress Tracking, AI Multi-Session Summaries, Consent & Doctor Recommendations

-- 1. Add consent_granted and doctor_id to referrals table if not present
ALTER TABLE referrals 
ADD COLUMN IF NOT EXISTS consent_granted BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE referrals 
ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_referrals_child_consent ON referrals(child_id, consent_granted);

-- 2. Create AI Progress Summaries Cache Table
CREATE TABLE IF NOT EXISTS ai_progress_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  session_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  session_hash TEXT NOT NULL,
  summary_en TEXT NOT NULL,
  summary_kn TEXT NOT NULL,
  key_changes JSONB NOT NULL DEFAULT '[]'::jsonb,
  disclaimer TEXT NOT NULL DEFAULT 'This is a pre-screening summary, not a medical diagnosis.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_progress_child ON ai_progress_summaries(child_id);
CREATE INDEX IF NOT EXISTS idx_ai_progress_session_hash ON ai_progress_summaries(child_id, session_hash);

-- 3. Create Doctor Notes & Recommendations Table
CREATE TABLE IF NOT EXISTS child_doctor_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_name TEXT NOT NULL DEFAULT 'Doctor',
  note TEXT NOT NULL,
  recommendations TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_child_doctor_notes_child ON child_doctor_notes(child_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE ai_progress_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_doctor_notes ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Referrals Consent Management
-- Allow parents to update consent status on referrals for their own children
DROP POLICY IF EXISTS "Parents can update referral consent" ON referrals;
CREATE POLICY "Parents can update referral consent" ON referrals
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM children WHERE children.id = referrals.child_id AND children.parent_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM children WHERE children.id = referrals.child_id AND children.parent_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- 6. RLS Policies for AI Progress Summaries
-- Parents view summaries for their children
CREATE POLICY "Parents view AI progress summaries" ON ai_progress_summaries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM children WHERE children.id = ai_progress_summaries.child_id AND children.parent_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM referrals 
      WHERE referrals.child_id = ai_progress_summaries.child_id 
        AND referrals.consent_granted = true 
        AND (referrals.doctor_id = auth.uid() OR referrals.specialist_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Insert AI progress summaries" ON ai_progress_summaries
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 7. RLS Policies for Doctor Notes & Recommendations
-- Parents can read notes left on their child's record
CREATE POLICY "Parents view doctor notes" ON child_doctor_notes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM children WHERE children.id = child_doctor_notes.child_id AND children.parent_id = auth.uid())
    OR (doctor_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Consented doctors can insert notes for connected children
CREATE POLICY "Doctors insert notes" ON child_doctor_notes
  FOR INSERT WITH CHECK (
    doctor_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM referrals 
        WHERE referrals.child_id = child_doctor_notes.child_id 
          AND referrals.consent_granted = true 
          AND (referrals.doctor_id = auth.uid() OR referrals.specialist_id = auth.uid())
      )
      OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    )
  );
