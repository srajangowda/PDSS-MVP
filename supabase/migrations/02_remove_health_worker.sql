-- PediPulse Supabase Schema Migration 02
-- Transition to direct parent-to-doctor model: Remove health worker role & update roles to ('parent', 'doctor', 'admin')

-- 1. Reassign children previously associated with health worker accounts to the parent account
UPDATE children 
SET parent_id = '11111111-1111-1111-1111-111111111111' 
WHERE parent_id IN (SELECT id FROM profiles WHERE role = 'health_worker');

-- 2. Update existing 'specialist' profiles to 'doctor'
UPDATE profiles 
SET role = 'doctor' 
WHERE role = 'specialist';

-- 3. Safely delete health worker profiles (data now detached/reassigned)
DELETE FROM profiles 
WHERE role = 'health_worker';

-- 4. Update the profiles check constraint to allow ('parent', 'doctor', 'admin')
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('parent', 'doctor', 'admin'));

-- 5. Drop outdated Row Level Security (RLS) policies referencing health_worker
DROP POLICY IF EXISTS "Parents can read their children" ON children;
DROP POLICY IF EXISTS "Parents and Health Workers can insert children" ON children;
DROP POLICY IF EXISTS "Parents can update their children" ON children;
DROP POLICY IF EXISTS "Screening viewable by parent, author, or specialist" ON screenings;
DROP POLICY IF EXISTS "Referrals readable by parent and specialist" ON referrals;
DROP POLICY IF EXISTS "Referrals updatable by specialist/admin" ON referrals;
DROP POLICY IF EXISTS "Followups readable" ON followups;

-- 6. Create updated RLS policies reflecting the direct parent-doctor model

-- Children: Parents read their own; Doctors and Admins can view for clinical assessments
CREATE POLICY "Parents and doctors can read children" ON children
  FOR SELECT USING (
    parent_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('doctor', 'admin'))
  );

-- Children: Only parents and admins can register children
CREATE POLICY "Parents can insert children" ON children
  FOR INSERT WITH CHECK (
    parent_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Children: Only parents and admins can update child records
CREATE POLICY "Parents can update their children" ON children
  FOR UPDATE USING (
    parent_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Screenings: Viewable by the parent who submitted it or a reviewing doctor/admin
CREATE POLICY "Screening viewable by parent or doctor" ON screenings
  FOR SELECT USING (
    completed_by = auth.uid()
    OR EXISTS (SELECT 1 FROM children WHERE children.id = screenings.child_id AND children.parent_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('doctor', 'admin'))
  );

-- Referrals: Readable by the parent (patient's family) and doctor/admin
CREATE POLICY "Referrals readable by parent and doctor" ON referrals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM children WHERE children.id = referrals.child_id AND children.parent_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('doctor', 'admin'))
  );

-- Referrals: Status updates can be accepted/confirmed/completed by doctor or admin
CREATE POLICY "Referrals updatable by doctor/admin" ON referrals
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('doctor', 'admin'))
  );

-- Followups: Readable by parent and doctor
CREATE POLICY "Followups readable by parent and doctor" ON followups
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM children WHERE children.id = followups.child_id AND children.parent_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('doctor', 'admin'))
  );
