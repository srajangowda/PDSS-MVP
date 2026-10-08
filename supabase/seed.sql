-- PediPulse Seed Data
-- Fictional data for testing, demonstration, and evaluation
-- All IDs are valid PostgreSQL hexadecimal UUIDs

-- 1. Profiles
INSERT INTO profiles (id, name, email, role)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Sunita Sharma', 'parent@pedipulse.org', 'parent'),
  ('22222222-2222-2222-2222-222222222222', 'Sister Mary Fernandez (ASHA)', 'worker@pedipulse.org', 'health_worker'),
  ('33333333-3333-3333-3333-333333333333', 'Dr. Ananya Rao', 'specialist@pedipulse.org', 'specialist')
ON CONFLICT (id) DO NOTHING;

-- 2. Children
INSERT INTO children (id, parent_id, name, dob, gender, location, guardian_name, guardian_phone)
VALUES
  ('a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Rahul Sharma', '2023-08-10', 'Male', 'Udupi, Karnataka', 'Sunita Sharma', '+91 98765 43210'),
  ('b2222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Ananya Nayak', '2025-04-15', 'Female', 'Kundapura, Udupi', 'Pooja Nayak', '+91 98451 22334'),
  ('c3333333-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'Aarav Hegde', '2026-02-12', 'Male', 'Karkala, Karnataka', 'Lakshmi Hegde', '+91 98860 77889')
ON CONFLICT (id) DO NOTHING;

-- 3. Screening Questions Bank (Structured by Age Groups & 6 Domains)
-- Options: Yes (score 10), Sometimes (score 5), Not yet (score 0), Unsure (score 0)
INSERT INTO screening_questions (id, age_min_months, age_max_months, domain, question, display_order, active)
VALUES
  -- 0 - 6 Months
  ('00000000-0000-0000-0000-000000000001', 0, 6, 'Communication', 'Does the baby turn their head toward sounds or your speaking voice?', 1, true),
  ('00000000-0000-0000-0000-000000000002', 0, 6, 'Gross Motor', 'Does the baby lift their head and chest when lying on their tummy?', 2, true),
  ('00000000-0000-0000-0000-000000000003', 0, 6, 'Fine Motor', 'Does the baby open and close hands and grasp a finger placed in their palm?', 3, true),
  ('00000000-0000-0000-0000-000000000004', 0, 6, 'Cognitive', 'Does the baby follow a moving toy or bright object smoothly with both eyes?', 4, true),
  ('00000000-0000-0000-0000-000000000005', 0, 6, 'Social/Emotional', 'Does the baby smile back when you talk, smile, or play with them?', 5, true),
  ('00000000-0000-0000-0000-000000000006', 0, 6, 'Adaptive', 'Does the baby latch, suck, and feed comfortably without frequent choking?', 6, true),

  -- 7 - 12 Months
  ('00000000-0000-0000-0000-000000000007', 7, 12, 'Communication', 'Does the baby babble repetitive syllables like "ba-ba", "da-da", or "ma-ma"?', 1, true),
  ('00000000-0000-0000-0000-000000000008', 7, 12, 'Gross Motor', 'Does the baby sit steadily without support and reach out for objects?', 2, true),
  ('00000000-0000-0000-0000-000000000009', 7, 12, 'Fine Motor', 'Does the baby use their thumb and fingers (pincer grasp) to pick up small pieces of food?', 3, true),
  ('00000000-0000-0000-0000-000000000010', 7, 12, 'Cognitive', 'Does the baby search for a toy that has rolled behind an object or under a blanket?', 4, true),
  ('00000000-0000-0000-0000-000000000011', 7, 12, 'Social/Emotional', 'Does the baby show a clear preference for familiar caregivers and respond to "peek-a-boo"?', 5, true),
  ('00000000-0000-0000-0000-000000000012', 7, 12, 'Adaptive', 'Does the baby hold a biscuit or finger food and bring it to their mouth independently?', 6, true),

  -- 13 - 24 Months
  ('00000000-0000-0000-0000-000000000013', 13, 24, 'Communication', 'Does the child use at least 4 to 6 consistent words other than mama/dada?', 1, true),
  ('00000000-0000-0000-0000-000000000014', 13, 24, 'Gross Motor', 'Does the child walk forward without holding onto furniture or an adult hand?', 2, true),
  ('00000000-0000-0000-0000-000000000015', 13, 24, 'Fine Motor', 'Can the child stack 2 to 3 small blocks or cups on top of each other?', 3, true),
  ('00000000-0000-0000-0000-000000000016', 13, 24, 'Cognitive', 'Does the child imitate simple household actions like wiping a table or feeding a doll?', 4, true),
  ('00000000-0000-0000-0000-000000000017', 13, 24, 'Social/Emotional', 'Does the child point to show you something interesting (pointing for shared interest)?', 5, true),
  ('00000000-0000-0000-0000-000000000018', 13, 24, 'Adaptive', 'Does the child drink from an open cup with minimal assistance?', 6, true),

  -- 25 - 36 Months
  ('00000000-0000-0000-0000-000000000019', 25, 36, 'Communication', 'Does the child respond promptly when their name is called across the room?', 1, true),
  ('00000000-0000-0000-0000-000000000020', 25, 36, 'Communication', 'Does the child combine 2 or more words into short sentences (e.g., "more milk", "go park")?', 2, true),
  ('00000000-0000-0000-0000-000000000021', 25, 36, 'Gross Motor', 'Can the child kick a ball without losing balance or run without falling often?', 3, true),
  ('00000000-0000-0000-0000-000000000022', 25, 36, 'Fine Motor', 'Can the child turn single book pages and hold a crayon to make scribbles or lines?', 4, true),
  ('00000000-0000-0000-0000-000000000023', 25, 36, 'Cognitive', 'Does the child identify simple body parts or familiar animals when asked?', 5, true),
  ('00000000-0000-0000-0000-000000000024', 25, 36, 'Social/Emotional', 'Does the child notice and show concern or interest when another person is crying or upset?', 6, true),
  ('00000000-0000-0000-0000-000000000025', 25, 36, 'Adaptive', 'Does the child attempt to wash and dry hands or put on simple slip-on shoes?', 7, true),

  -- 37 - 48 Months
  ('00000000-0000-0000-0000-000000000026', 37, 48, 'Communication', 'Can unfamiliar listeners understand most of what the child says in conversation?', 1, true),
  ('00000000-0000-0000-0000-000000000027', 37, 48, 'Gross Motor', 'Can the child balance on one foot for 2 to 3 seconds or jump forward with both feet?', 2, true),
  ('00000000-0000-0000-0000-000000000028', 37, 48, 'Fine Motor', 'Can the child draw a rough circle or cut paper using child-safe scissors?', 3, true),
  ('00000000-0000-0000-0000-000000000029', 37, 48, 'Cognitive', 'Can the child correctly name at least 3 or 4 basic colors (e.g., red, blue, green)?', 4, true),
  ('00000000-0000-0000-0000-000000000030', 37, 48, 'Social/Emotional', 'Does the child play interactive cooperative games with other children rather than only solo?', 5, true),
  ('00000000-0000-0000-0000-000000000031', 37, 48, 'Adaptive', 'Can the child feed themselves with a spoon or fork without excessive spilling?', 6, true),

  -- 49 - 60 Months
  ('00000000-0000-0000-0000-000000000032', 49, 60, 'Communication', 'Does the child speak clearly using full sentences and explain simple events in sequential order?', 1, true),
  ('00000000-0000-0000-0000-000000000033', 49, 60, 'Gross Motor', 'Can the child hop on one foot and climb playground equipment confidently?', 2, true),
  ('00000000-0000-0000-0000-000000000034', 49, 60, 'Fine Motor', 'Can the child copy a square or write a few letters from their first name?', 3, true),
  ('00000000-0000-0000-0000-000000000035', 49, 60, 'Cognitive', 'Can the child count 5 or more objects accurately when pointing to each one?', 4, true),
  ('00000000-0000-0000-0000-000000000036', 49, 60, 'Social/Emotional', 'Does the child show empathy, share toys willingly, and follow basic rules in group games?', 5, true),
  ('00000000-0000-0000-0000-000000000037', 49, 60, 'Adaptive', 'Can the child dress and undress independently including simple buttons and zippers?', 6, true)
ON CONFLICT (id) DO NOTHING;

-- 4. Specialists and Screening Camps
INSERT INTO specialists (id, name, specialization, location, bio, is_active, type, organization, phone, email)
VALUES
  (
    '51111111-1111-1111-1111-111111111111',
    'Dr. Ananya Rao, MD (Peds)',
    'Developmental Pediatrician',
    'Udupi',
    'Specializes in early childhood neurodevelopment, growth milestones, and early interventions for infants and preschool children.',
    true,
    'individual',
    'Udupi Child Guidance & Developmental Clinic',
    '+91 820 252 0101',
    'dr.ananya@udupichildcare.org'
  ),
  (
    '52222222-2222-2222-2222-222222222222',
    'Dr. Vikram Hegde, M.Phil, PhD',
    'Child Psychologist',
    'Mangalore',
    'Expert in behavioral observation, early socio-emotional development, and parent-child interaction coaching.',
    true,
    'individual',
    'Coastal Neuro-Developmental Center',
    '+91 824 244 5566',
    'dr.vikram@coastalneuro.org'
  ),
  (
    '53333333-3333-3333-3333-333333333333',
    'Dr. Sneha Patil, MASLP',
    'Speech & Language Pathologist',
    'Udupi',
    'Focuses on early speech delays, receptive/expressive language stimulation, and alternate communication methods.',
    true,
    'individual',
    'Udupi Speech & Hearing Center',
    '+91 820 258 7722',
    'sneha.patil@udupispeech.org'
  ),
  (
    '54444444-4444-4444-4444-444444444444',
    'Dr. Rajesh Kamath, MBBS, DCH',
    'Pediatrician',
    'Kundapura',
    'Experienced community pediatrician managing pediatric wellness, growth velocity, and developmental referrals.',
    true,
    'individual',
    'Kundapura Taluk Pediatric Clinic',
    '+91 8254 230 450',
    'dr.rajesh@kundapurapediatrics.in'
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'Dr. Priya Shenoy, MOT (Pediatrics)',
    'Occupational Therapist',
    'Manipal',
    'Works with sensory regulation, fine motor delays, and daily living skills in early childhood.',
    true,
    'individual',
    'Manipal Pediatric Therapy Clinic',
    '+91 820 292 2000',
    'priya.shenoy@manipalrehab.org'
  ),
  -- Screening Camps
  (
    'c1111111-1111-1111-1111-111111111111',
    'Udupi Rural Child Development Screening Camp',
    'Community Screening Camp',
    'Udupi',
    'Free community developmental screening camp organized by pediatric specialists and ASHA health workers. On-site assessment and guidance.',
    true,
    'camp',
    'District Early Intervention Center (DEIC)',
    '+91 820 252 9999',
    'camps@udupideic.gov.in'
  ),
  (
    'c2222222-2222-2222-2222-222222222222',
    'Kundapura Pediatric Outreach & Nutrition Camp',
    'Community Screening Camp',
    'Kundapura',
    'Multi-disciplinary camp featuring developmental screenings, pediatric check-ups, and speech assessment booths.',
    true,
    'camp',
    'Rotary Child Care Foundation',
    '+91 8254 231 100',
    'kundapura.camp@rotaryhealth.org'
  ),
  (
    'c3333333-3333-3333-3333-333333333333',
    'Malpe Coastal Early Milestone Clinic',
    'Community Screening Camp',
    'Malpe',
    'Focused developmental checks for infants and toddlers from coastal fisher communities with direct specialist consultation.',
    true,
    'camp',
    'Coastal Health Alliance',
    '+91 820 253 4400',
    'outreach@coastalhealth.org'
  )
ON CONFLICT (id) DO NOTHING;

-- 5. Availability Slots
INSERT INTO availability (id, specialist_id, date, start_time, end_time, available_slots)
VALUES
  ('a0000000-0000-0000-0000-000000000001', '51111111-1111-1111-1111-111111111111', '2026-10-18', '09:30 AM', '12:30 PM', 4),
  ('a0000000-0000-0000-0000-000000000002', '51111111-1111-1111-1111-111111111111', '2026-10-20', '02:00 PM', '05:00 PM', 3),
  ('a0000000-0000-0000-0000-000000000003', '52222222-2222-2222-2222-222222222222', '2026-10-19', '10:00 AM', '01:00 PM', 5),
  ('a0000000-0000-0000-0000-000000000004', '53333333-3333-3333-3333-333333333333', '2026-10-21', '11:00 AM', '03:00 PM', 6),
  ('a0000000-0000-0000-0000-000000000005', '54444444-4444-4444-4444-444444444444', '2026-10-22', '09:00 AM', '01:00 PM', 8),
  ('a0000000-0000-0000-0000-000000000006', '55555555-5555-5555-5555-555555555555', '2026-10-23', '02:00 PM', '06:00 PM', 4),
  ('a0000000-0000-0000-0000-000000000007', 'c1111111-1111-1111-1111-111111111111', '2026-10-22', '10:00 AM', '02:00 PM', 25),
  ('a0000000-0000-0000-0000-000000000008', 'c2222222-2222-2222-2222-222222222222', '2026-10-29', '09:00 AM', '01:00 PM', 30),
  ('a0000000-0000-0000-0000-000000000009', 'c3333333-3333-3333-3333-333333333333', '2026-11-05', '10:00 AM', '03:00 PM', 20)
ON CONFLICT (id) DO NOTHING;

-- 6. Pre-seeded Screening for Rahul Sharma
INSERT INTO screenings (id, child_id, completed_by, overall_score, risk_level, domain_scores, created_at)
VALUES (
  'e1111111-1111-1111-1111-111111111111',
  'a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  45,
  'Possible Concern',
  '{
    "Communication": {"score": 5, "max": 20, "percentage": 25, "status": "Possible Concern"},
    "Gross Motor": {"score": 10, "max": 10, "percentage": 100, "status": "Age Appropriate"},
    "Fine Motor": {"score": 10, "max": 10, "percentage": 100, "status": "Age Appropriate"},
    "Cognitive": {"score": 5, "max": 10, "percentage": 50, "status": "Monitor"},
    "Social/Emotional": {"score": 5, "max": 10, "percentage": 50, "status": "Monitor"},
    "Adaptive": {"score": 10, "max": 10, "percentage": 100, "status": "Age Appropriate"}
  }'::jsonb,
  '2026-10-08 10:15:00+05:30'
) ON CONFLICT (id) DO NOTHING;

-- 7. Pre-seeded Referral for Rahul Sharma
INSERT INTO referrals (id, child_id, screening_id, specialist_id, availability_id, status, notes, created_at)
VALUES (
  'f1111111-1111-1111-1111-111111111111',
  'a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'e1111111-1111-1111-1111-111111111111',
  '51111111-1111-1111-1111-111111111111',
  'a0000000-0000-0000-0000-000000000001',
  'Requested',
  'Parent noted Rahul is not turning when name is called in noisy rooms and uses gestures rather than two-word phrases.',
  '2026-10-08 10:30:00+05:30'
) ON CONFLICT (id) DO NOTHING;

-- 8. Pre-seeded Follow-up
INSERT INTO followups (id, child_id, referral_id, followup_date, status, notes, created_at)
VALUES (
  'd1111111-1111-1111-1111-111111111111',
  'a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'f1111111-1111-1111-1111-111111111111',
  '2026-10-25',
  'Pending',
  'Post-screening check-in: review developmental pediatrician consultation outcome and speech stimulation activities at home.',
  '2026-10-08 10:35:00+05:30'
) ON CONFLICT (id) DO NOTHING;
