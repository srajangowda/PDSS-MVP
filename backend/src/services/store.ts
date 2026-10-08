import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import { config } from '../utils/config.js';
import {
  AIExplanation,
  AvailabilitySlot,
  Child,
  Followup,
  Referral,
  Screening,
  ScreeningAnswer,
  ScreeningQuestion,
  Specialist,
  UserProfile,
} from '../types/index.js';

let supabase: SupabaseClient | null = null;
if (config.hasSupabase) {
  try {
    supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey);
    console.log('Connected to Supabase PostgreSQL database.');
  } catch (err) {
    console.warn('Could not initialize Supabase client:', err);
  }
}

// In-Memory Fallback Seed Data with valid UUIDs
export const mockProfiles: UserProfile[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Sunita Sharma',
    email: 'parent@pedipulse.org',
    role: 'parent',
    created_at: new Date().toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Sister Mary Fernandez (ASHA)',
    email: 'worker@pedipulse.org',
    role: 'health_worker',
    created_at: new Date().toISOString(),
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Dr. Ananya Rao',
    email: 'specialist@pedipulse.org',
    role: 'specialist',
    created_at: new Date().toISOString(),
  },
];

export const mockQuestions: ScreeningQuestion[] = [
  // 0 - 6 Months
  { id: '00000000-0000-0000-0000-000000000001', age_min_months: 0, age_max_months: 6, domain: 'Communication', question: 'Does the baby turn their head toward sounds or your speaking voice?', display_order: 1, active: true },
  { id: '00000000-0000-0000-0000-000000000002', age_min_months: 0, age_max_months: 6, domain: 'Gross Motor', question: 'Does the baby lift their head and chest when lying on their tummy?', display_order: 2, active: true },
  { id: '00000000-0000-0000-0000-000000000003', age_min_months: 0, age_max_months: 6, domain: 'Fine Motor', question: 'Does the baby open and close hands and grasp a finger placed in their palm?', display_order: 3, active: true },
  { id: '00000000-0000-0000-0000-000000000004', age_min_months: 0, age_max_months: 6, domain: 'Cognitive', question: 'Does the baby follow a moving toy or bright object smoothly with both eyes?', display_order: 4, active: true },
  { id: '00000000-0000-0000-0000-000000000005', age_min_months: 0, age_max_months: 6, domain: 'Social/Emotional', question: 'Does the baby smile back when you talk, smile, or play with them?', display_order: 5, active: true },
  { id: '00000000-0000-0000-0000-000000000006', age_min_months: 0, age_max_months: 6, domain: 'Adaptive', question: 'Does the baby latch, suck, and feed comfortably without frequent choking?', display_order: 6, active: true },

  // 7 - 12 Months
  { id: '00000000-0000-0000-0000-000000000007', age_min_months: 7, age_max_months: 12, domain: 'Communication', question: 'Does the baby babble repetitive syllables like "ba-ba", "da-da", or "ma-ma"?', display_order: 1, active: true },
  { id: '00000000-0000-0000-0000-000000000008', age_min_months: 7, age_max_months: 12, domain: 'Gross Motor', question: 'Does the baby sit steadily without support and reach out for objects?', display_order: 2, active: true },
  { id: '00000000-0000-0000-0000-000000000009', age_min_months: 7, age_max_months: 12, domain: 'Fine Motor', question: 'Does the baby use thumb and index finger (pincer grasp) to pick up small objects?', display_order: 3, active: true },
  { id: '00000000-0000-0000-0000-000000000010', age_min_months: 7, age_max_months: 12, domain: 'Cognitive', question: 'Does the baby look for an object that has fallen or rolled under a cloth/cover?', display_order: 4, active: true },
  { id: '00000000-0000-0000-0000-000000000011', age_min_months: 7, age_max_months: 12, domain: 'Social/Emotional', question: 'Does the baby recognize familiar caregivers and enjoy social games like peek-a-boo?', display_order: 5, active: true },
  { id: '00000000-0000-0000-0000-000000000012', age_min_months: 7, age_max_months: 12, domain: 'Adaptive', question: 'Does the baby hold finger food and feed themselves independently?', display_order: 6, active: true },

  // 13 - 24 Months
  { id: '00000000-0000-0000-0000-000000000013', age_min_months: 13, age_max_months: 24, domain: 'Communication', question: 'Does the child use at least 4 to 6 consistent words beyond mama and dada?', display_order: 1, active: true },
  { id: '00000000-0000-0000-0000-000000000014', age_min_months: 13, age_max_months: 24, domain: 'Gross Motor', question: 'Does the child walk forward steadily without holding onto furniture?', display_order: 2, active: true },
  { id: '00000000-0000-0000-0000-000000000015', age_min_months: 13, age_max_months: 24, domain: 'Fine Motor', question: 'Can the child stack 2 to 3 small blocks or cups on top of each other?', display_order: 3, active: true },
  { id: '00000000-0000-0000-0000-000000000016', age_min_months: 13, age_max_months: 24, domain: 'Cognitive', question: 'Does the child imitate everyday actions like sweeping or pretending to talk on a phone?', display_order: 4, active: true },
  { id: '00000000-0000-0000-0000-000000000017', age_min_months: 13, age_max_months: 24, domain: 'Social/Emotional', question: 'Does the child point their finger to show you an interesting sight or airplane?', display_order: 5, active: true },
  { id: '00000000-0000-0000-0000-000000000018', age_min_months: 13, age_max_months: 24, domain: 'Adaptive', question: 'Can the child drink water from a small cup or assist when being dressed?', display_order: 6, active: true },

  // 25 - 36 Months
  { id: '00000000-0000-0000-0000-000000000019', age_min_months: 25, age_max_months: 36, domain: 'Communication', question: 'Does the child respond promptly when their name is called across the room?', display_order: 1, active: true },
  { id: '00000000-0000-0000-0000-000000000020', age_min_months: 25, age_max_months: 36, domain: 'Communication', question: 'Does the child string 2 or more words together into simple phrases (e.g., "more juice")?', display_order: 2, active: true },
  { id: '00000000-0000-0000-0000-000000000021', age_min_months: 25, age_max_months: 36, domain: 'Gross Motor', question: 'Can the child run without falling frequently and kick a ball forward?', display_order: 3, active: true },
  { id: '00000000-0000-0000-0000-000000000022', age_min_months: 25, age_max_months: 36, domain: 'Fine Motor', question: 'Can the child hold a thick crayon to draw scribbles or turn pages of a picture book?', display_order: 4, active: true },
  { id: '00000000-0000-0000-0000-000000000023', age_min_months: 25, age_max_months: 36, domain: 'Cognitive', question: 'Does the child point to body parts (nose, eyes) or identify familiar animals when named?', display_order: 5, active: true },
  { id: '00000000-0000-0000-0000-000000000024', age_min_months: 25, age_max_months: 36, domain: 'Social/Emotional', question: 'Does the child notice and show concern or curiosity when another person is upset?', display_order: 6, active: true },
  { id: '00000000-0000-0000-0000-000000000025', age_min_months: 25, age_max_months: 36, domain: 'Adaptive', question: 'Does the child wash and dry their hands with minimal help or use a spoon?', display_order: 7, active: true },

  // 37 - 48 Months
  { id: '00000000-0000-0000-0000-000000000026', age_min_months: 37, age_max_months: 48, domain: 'Communication', question: 'Can unfamiliar listeners understand most of what the child says in conversation?', display_order: 1, active: true },
  { id: '00000000-0000-0000-0000-000000000027', age_min_months: 37, age_max_months: 48, domain: 'Gross Motor', question: 'Can the child balance on one foot for 2 seconds and hop or jump forward?', display_order: 2, active: true },
  { id: '00000000-0000-0000-0000-000000000028', age_min_months: 37, age_max_months: 48, domain: 'Fine Motor', question: 'Can the child draw a recognizable circle or use safety scissors with supervision?', display_order: 3, active: true },
  { id: '00000000-0000-0000-0000-000000000029', age_min_months: 37, age_max_months: 48, domain: 'Cognitive', question: 'Does the child correctly name at least 3 basic colors like red, green, and blue?', display_order: 4, active: true },
  { id: '00000000-0000-0000-0000-000000000030', age_min_months: 37, age_max_months: 48, domain: 'Social/Emotional', question: 'Does the child engage in imaginative pretend play and play alongside other kids?', display_order: 5, active: true },
  { id: '00000000-0000-0000-0000-000000000031', age_min_months: 37, age_max_months: 48, domain: 'Adaptive', question: 'Can the child put on their shoes or pull up their pants after using the toilet?', display_order: 6, active: true },

  // 49 - 60 Months
  { id: '00000000-0000-0000-0000-000000000032', age_min_months: 49, age_max_months: 60, domain: 'Communication', question: 'Does the child speak clearly in full sentences and narrate simple past events?', display_order: 1, active: true },
  { id: '00000000-0000-0000-0000-000000000033', age_min_months: 49, age_max_months: 60, domain: 'Gross Motor', question: 'Can the child skip, hop, and climb playground ladders with confidence?', display_order: 2, active: true },
  { id: '00000000-0000-0000-0000-000000000034', age_min_months: 49, age_max_months: 60, domain: 'Fine Motor', question: 'Can the child copy a plus sign (+) or write a few letters of their first name?', display_order: 3, active: true },
  { id: '00000000-0000-0000-0000-000000000035', age_min_months: 49, age_max_months: 60, domain: 'Cognitive', question: 'Can the child count 5 objects accurately while pointing to each in turn?', display_order: 4, active: true },
  { id: '00000000-0000-0000-0000-000000000036', age_min_months: 49, age_max_months: 60, domain: 'Social/Emotional', question: 'Does the child share toys with peers and follow simple rules in cooperative games?', display_order: 5, active: true },
  { id: '00000000-0000-0000-0000-000000000037', age_min_months: 49, age_max_months: 60, domain: 'Adaptive', question: 'Can the child unbutton buttons and take care of personal hygiene routines?', display_order: 6, active: true },
];

export const mockSpecialists: Specialist[] = [
  {
    id: '51111111-1111-1111-1111-111111111111',
    name: 'Dr. Ananya Rao, MD (Peds)',
    specialization: 'Developmental Pediatrician',
    location: 'Udupi',
    bio: 'Specializes in early childhood neurodevelopment, milestone assessments, and family-centered intervention pathways.',
    is_active: true,
    type: 'individual',
    organization: 'Udupi Child Guidance & Developmental Clinic',
    phone: '+91 820 252 0101',
    email: 'dr.ananya@udupichildcare.org',
  },
  {
    id: '52222222-2222-2222-2222-222222222222',
    name: 'Dr. Vikram Hegde, M.Phil, PhD',
    specialization: 'Child Psychologist',
    location: 'Mangalore',
    bio: 'Expert in behavioral observation, early socio-emotional milestones, and supportive parenting counseling.',
    is_active: true,
    type: 'individual',
    organization: 'Coastal Neuro-Developmental Center',
    phone: '+91 824 244 5566',
    email: 'dr.vikram@coastalneuro.org',
  },
  {
    id: '53333333-3333-3333-3333-333333333333',
    name: 'Dr. Sneha Patil, MASLP',
    specialization: 'Speech Therapist',
    location: 'Udupi',
    bio: 'Focuses on early speech stimulation, receptive language building, and assistive communication strategies.',
    is_active: true,
    type: 'individual',
    organization: 'Udupi Speech & Hearing Center',
    phone: '+91 820 258 7722',
    email: 'sneha.patil@udupispeech.org',
  },
  {
    id: '54444444-4444-4444-4444-444444444444',
    name: 'Dr. Rajesh Kamath, MBBS, DCH',
    specialization: 'Pediatrician',
    location: 'Kundapura',
    bio: 'Senior community pediatrician with 15+ years of experience in early growth tracking and milestone referrals.',
    is_active: true,
    type: 'individual',
    organization: 'Kundapura Taluk Pediatric Clinic',
    phone: '+91 8254 230 450',
    email: 'dr.rajesh@kundapurapediatrics.in',
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'Dr. Priya Shenoy, MOT (Pediatrics)',
    specialization: 'Occupational Therapist',
    location: 'Manipal',
    bio: 'Focuses on sensory processing, fine motor coordination, and daily living skills in young children.',
    is_active: true,
    type: 'individual',
    organization: 'Manipal Pediatric Therapy Clinic',
    phone: '+91 820 292 2000',
    email: 'priya.shenoy@manipalrehab.org',
  },
  // Screening Camps
  {
    id: 'c1111111-1111-1111-1111-111111111111',
    name: 'Udupi Rural Child Development Screening Camp',
    specialization: 'Pediatrician',
    location: 'Udupi',
    bio: 'Free multi-disciplinary developmental screening camp organized with ASHA community workers.',
    is_active: true,
    type: 'camp',
    organization: 'District Early Intervention Center (DEIC)',
    phone: '+91 820 252 9999',
    email: 'camps@udupideic.gov.in',
  },
  {
    id: 'c2222222-2222-2222-2222-222222222222',
    name: 'Kundapura Pediatric Outreach & Nutrition Camp',
    specialization: 'Developmental Pediatrician',
    location: 'Kundapura',
    bio: 'Community outreach clinic providing milestone assessments, parent counseling, and nutrition reviews.',
    is_active: true,
    type: 'camp',
    organization: 'Rotary Child Care Foundation',
    phone: '+91 8254 231 100',
    email: 'kundapura.camp@rotaryhealth.org',
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    name: 'Malpe Coastal Early Milestone Clinic',
    specialization: 'Speech Therapist',
    location: 'Malpe',
    bio: 'Accessible developmental pre-screening camp dedicated to coastal and fishing village families.',
    is_active: true,
    type: 'camp',
    organization: 'Coastal Health Alliance',
    phone: '+91 820 253 4400',
    email: 'outreach@coastalhealth.org',
  },
];

export const mockAvailability: AvailabilitySlot[] = [
  { id: 'a0000000-0000-0000-0000-000000000001', specialist_id: '51111111-1111-1111-1111-111111111111', date: '2026-10-18', start_time: '09:30 AM', end_time: '12:30 PM', available_slots: 4 },
  { id: 'a0000000-0000-0000-0000-000000000002', specialist_id: '51111111-1111-1111-1111-111111111111', date: '2026-10-20', start_time: '02:00 PM', end_time: '05:00 PM', available_slots: 3 },
  { id: 'a0000000-0000-0000-0000-000000000003', specialist_id: '52222222-2222-2222-2222-222222222222', date: '2026-10-19', start_time: '10:00 AM', end_time: '01:00 PM', available_slots: 5 },
  { id: 'a0000000-0000-0000-0000-000000000004', specialist_id: '53333333-3333-3333-3333-333333333333', date: '2026-10-21', start_time: '11:00 AM', end_time: '03:00 PM', available_slots: 6 },
  { id: 'a0000000-0000-0000-0000-000000000005', specialist_id: '54444444-4444-4444-4444-444444444444', date: '2026-10-22', start_time: '09:00 AM', end_time: '01:00 PM', available_slots: 8 },
  { id: 'a0000000-0000-0000-0000-000000000006', specialist_id: '55555555-5555-5555-5555-555555555555', date: '2026-10-23', start_time: '02:00 PM', end_time: '06:00 PM', available_slots: 4 },
  { id: 'a0000000-0000-0000-0000-000000000007', specialist_id: 'c1111111-1111-1111-1111-111111111111', date: '2026-10-22', start_time: '10:00 AM', end_time: '02:00 PM', available_slots: 25 },
  { id: 'a0000000-0000-0000-0000-000000000008', specialist_id: 'c2222222-2222-2222-2222-222222222222', date: '2026-10-29', start_time: '09:00 AM', end_time: '01:00 PM', available_slots: 30 },
  { id: 'a0000000-0000-0000-0000-000000000009', specialist_id: 'c3333333-3333-3333-3333-333333333333', date: '2026-11-05', start_time: '10:00 AM', end_time: '03:00 PM', available_slots: 20 },
];

export let mockChildren: Child[] = [
  {
    id: 'a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    parent_id: '11111111-1111-1111-1111-111111111111',
    name: 'Rahul Sharma',
    dob: '2023-08-10',
    gender: 'Male',
    location: 'Udupi, Karnataka',
    guardian_name: 'Sunita Sharma',
    guardian_phone: '+91 98765 43210',
    created_at: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'b2222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    parent_id: '11111111-1111-1111-1111-111111111111',
    name: 'Ananya Nayak',
    dob: '2025-04-15',
    gender: 'Female',
    location: 'Kundapura, Udupi',
    guardian_name: 'Pooja Nayak',
    guardian_phone: '+91 98451 22334',
    created_at: '2026-09-15T09:30:00.000Z',
  },
  {
    id: 'c3333333-cccc-cccc-cccc-cccccccccccc',
    parent_id: '22222222-2222-2222-2222-222222222222',
    name: 'Aarav Hegde',
    dob: '2026-02-12',
    gender: 'Male',
    location: 'Karkala, Karnataka',
    guardian_name: 'Lakshmi Hegde',
    guardian_phone: '+91 98860 77889',
    created_at: '2026-10-01T10:00:00.000Z',
  },
];

export let mockScreenings: Screening[] = [
  {
    id: 'e1111111-1111-1111-1111-111111111111',
    child_id: 'a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    completed_by: '11111111-1111-1111-1111-111111111111',
    overall_score: 45,
    risk_level: 'Possible Concern' as any,
    domain_scores: {
      'Communication': { score: 5, max: 20, percentage: 25, status: 'Possible Concern' },
      'Gross Motor': { score: 10, max: 10, percentage: 100, status: 'Age Appropriate' },
      'Fine Motor': { score: 10, max: 10, percentage: 100, status: 'Age Appropriate' },
      'Cognitive': { score: 5, max: 10, percentage: 50, status: 'Monitor' },
      'Social/Emotional': { score: 5, max: 10, percentage: 50, status: 'Monitor' },
      'Adaptive': { score: 10, max: 10, percentage: 100, status: 'Age Appropriate' },
    },
    created_at: '2026-10-08T04:45:00.000Z',
  },
];

export let mockScreeningAnswers: ScreeningAnswer[] = [
  { id: '00000000-0000-0000-0000-000000000019', screening_id: 'e1111111-1111-1111-1111-111111111111', question_id: '00000000-0000-0000-0000-000000000019', answer: 'not_yet', score: 0, created_at: '2026-10-08T04:45:00.000Z' },
  { id: '00000000-0000-0000-0000-000000000020', screening_id: 'e1111111-1111-1111-1111-111111111111', question_id: '00000000-0000-0000-0000-000000000020', answer: 'sometimes', score: 5, created_at: '2026-10-08T04:45:00.000Z' },
  { id: '00000000-0000-0000-0000-000000000021', screening_id: 'e1111111-1111-1111-1111-111111111111', question_id: '00000000-0000-0000-0000-000000000021', answer: 'yes', score: 10, created_at: '2026-10-08T04:45:00.000Z' },
  { id: '00000000-0000-0000-0000-000000000022', screening_id: 'e1111111-1111-1111-1111-111111111111', question_id: '00000000-0000-0000-0000-000000000022', answer: 'yes', score: 10, created_at: '2026-10-08T04:45:00.000Z' },
  { id: '00000000-0000-0000-0000-000000000023', screening_id: 'e1111111-1111-1111-1111-111111111111', question_id: '00000000-0000-0000-0000-000000000023', answer: 'sometimes', score: 5, created_at: '2026-10-08T04:45:00.000Z' },
  { id: '00000000-0000-0000-0000-000000000024', screening_id: 'e1111111-1111-1111-1111-111111111111', question_id: '00000000-0000-0000-0000-000000000024', answer: 'sometimes', score: 5, created_at: '2026-10-08T04:45:00.000Z' },
  { id: '00000000-0000-0000-0000-000000000025', screening_id: 'e1111111-1111-1111-1111-111111111111', question_id: '00000000-0000-0000-0000-000000000025', answer: 'yes', score: 10, created_at: '2026-10-08T04:45:00.000Z' },
];

export let mockReferrals: Referral[] = [
  {
    id: 'f1111111-1111-1111-1111-111111111111',
    child_id: 'a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    screening_id: 'e1111111-1111-1111-1111-111111111111',
    specialist_id: '51111111-1111-1111-1111-111111111111',
    availability_id: 'a0000000-0000-0000-0000-000000000001',
    status: 'Requested',
    notes: 'Parent reported child has difficulty responding to name across rooms and relies heavily on gesturing.',
    created_at: '2026-10-08T05:00:00.000Z',
  },
];

export let mockFollowups: Followup[] = [
  {
    id: 'd1111111-1111-1111-1111-111111111111',
    child_id: 'a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    referral_id: 'f1111111-1111-1111-1111-111111111111',
    followup_date: '2026-10-25',
    status: 'Pending',
    notes: 'Developmental screening follow-up: review specialist consult and home speech stimulation exercises.',
    created_at: '2026-10-08T05:05:00.000Z',
  },
];

export let mockAIExplanations: AIExplanation[] = [
  {
    id: '91111111-1111-1111-1111-111111111111',
    screening_id: 'e1111111-1111-1111-1111-111111111111',
    summary: 'The screening indicates Rahul is physically active and meeting motor milestones well, while communication and social responsiveness responses suggest an area where professional evaluation is recommended.',
    areas_of_attention: [
      'Communication: Responses show difficulty responding consistently to called names and limited two-word word combinations.',
      'Social/Emotional: Some emergent milestones in shared attention and cooperative interaction may benefit from structured observation.',
    ],
    recommended_next_steps: [
      'Share these screening observations with a developmental pediatrician or speech specialist.',
      'Engage in face-to-face vocal play and daily interactive reading at home.',
      'Notice everyday listening patterns in varied quiet and noisy environments.',
    ],
    questions_for_doctor: [
      'Could a hearing check help clarify responsiveness to verbal calls?',
      'What specific daily play techniques can encourage functional vocabulary at 3 years old?',
    ],
    disclaimer: 'This AI-assisted explanation is for educational purposes only and does not constitute a medical diagnosis or clinical advice. Please consult a qualified healthcare professional for formal evaluation.',
    created_at: '2026-10-08T05:02:00.000Z',
  },
];

// Helper Store Functions
export const store = {
  // Profiles
  async getProfile(id: string): Promise<UserProfile | null> {
    if (supabase) {
      const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (data) return data;
    }
    return mockProfiles.find((p) => p.id === id) || null;
  },

  async getProfileByEmail(email: string): Promise<UserProfile | null> {
    if (supabase) {
      const { data } = await supabase.from('profiles').select('*').eq('email', email).single();
      if (data) return data;
    }
    return mockProfiles.find((p) => p.email.toLowerCase() === email.toLowerCase()) || null;
  },

  // Children
  async getChildren(userId: string, role: string): Promise<Child[]> {
    if (supabase) {
      let query = supabase.from('children').select('*');
      if (role === 'parent') {
        query = query.eq('parent_id', userId);
      }
      const { data } = await query.order('created_at', { ascending: false });
      if (data) return data;
    }
    if (role === 'parent') {
      return mockChildren.filter((c) => c.parent_id === userId);
    }
    return [...mockChildren];
  },

  async getChildById(id: string): Promise<Child | null> {
    if (supabase) {
      const { data } = await supabase.from('children').select('*').eq('id', id).single();
      if (data) return data;
    }
    return mockChildren.find((c) => c.id === id) || null;
  },

  async createChild(child: Omit<Child, 'id' | 'created_at'>): Promise<Child> {
    const newChild: Child = {
      ...child,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    if (supabase) {
      const { data, error } = await supabase.from('children').insert([newChild]).select().single();
      if (!error && data) return data;
    }
    mockChildren.unshift(newChild);
    return newChild;
  },

  async updateChild(id: string, updates: Partial<Child>): Promise<Child | null> {
    if (supabase) {
      const { data } = await supabase.from('children').update(updates).eq('id', id).select().single();
      if (data) return data;
    }
    const idx = mockChildren.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    mockChildren[idx] = { ...mockChildren[idx], ...updates };
    return mockChildren[idx];
  },

  async deleteChild(id: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.from('children').delete().eq('id', id);
      if (!error) return true;
    }
    const lenBefore = mockChildren.length;
    mockChildren = mockChildren.filter((c) => c.id !== id);
    return mockChildren.length < lenBefore;
  },

  // Questions
  async getQuestionsForAge(ageInMonths: number): Promise<ScreeningQuestion[]> {
    if (supabase) {
      const { data } = await supabase
        .from('screening_questions')
        .select('*')
        .lte('age_min_months', ageInMonths)
        .gte('age_max_months', ageInMonths)
        .eq('active', true)
        .order('display_order', { ascending: true });
      if (data && data.length > 0) return data;
    }
    // Match appropriate age band
    const matched = mockQuestions.filter(
      (q) => ageInMonths >= q.age_min_months && ageInMonths <= q.age_max_months && q.active
    );
    if (matched.length > 0) return matched;
    // Fallback to nearest range
    return mockQuestions.slice(0, 10);
  },

  // Screenings
  async createScreening(screening: Omit<Screening, 'id' | 'created_at'>): Promise<Screening> {
    const newScreening: Screening = {
      ...screening,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    if (supabase) {
      const { data, error } = await supabase.from('screenings').insert([newScreening]).select().single();
      if (!error && data) return data;
    }
    mockScreenings.unshift(newScreening);
    return newScreening;
  },

  async getScreeningById(id: string): Promise<Screening | null> {
    if (supabase) {
      const { data } = await supabase.from('screenings').select('*').eq('id', id).single();
      if (data) {
        const child = await this.getChildById(data.child_id);
        return { ...data, child: child || undefined };
      }
    }
    const scr = mockScreenings.find((s) => s.id === id);
    if (!scr) return null;
    const child = await this.getChildById(scr.child_id);
    return { ...scr, child: child || undefined };
  },

  async getScreeningsForChild(childId: string): Promise<Screening[]> {
    if (supabase) {
      const { data } = await supabase
        .from('screenings')
        .select('*')
        .eq('child_id', childId)
        .order('created_at', { ascending: false });
      if (data) return data;
    }
    return mockScreenings
      .filter((s) => s.child_id === childId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async saveAnswers(answers: Omit<ScreeningAnswer, 'id' | 'created_at'>[]): Promise<ScreeningAnswer[]> {
    const inserted: ScreeningAnswer[] = answers.map((a) => ({
      ...a,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    }));

    if (supabase) {
      await supabase.from('screening_answers').insert(inserted);
    }
    mockScreeningAnswers.push(...inserted);
    return inserted;
  },

  async getAnswersForScreening(screeningId: string): Promise<ScreeningAnswer[]> {
    if (supabase) {
      const { data } = await supabase.from('screening_answers').select('*').eq('screening_id', screeningId);
      if (data) return data;
    }
    return mockScreeningAnswers.filter((a) => a.screening_id === screeningId);
  },

  // Specialists
  async getSpecialists(filters?: { location?: string; specialization?: string; type?: string }): Promise<Specialist[]> {
    let list = [...mockSpecialists];
    if (supabase) {
      const { data } = await supabase.from('specialists').select('*').eq('is_active', true);
      if (data && data.length > 0) list = data;
    }

    if (filters) {
      if (filters.location) {
        list = list.filter((s) => s.location.toLowerCase().includes(filters.location!.toLowerCase()));
      }
      if (filters.specialization) {
        list = list.filter((s) => s.specialization.toLowerCase().includes(filters.specialization!.toLowerCase()));
      }
      if (filters.type) {
        list = list.filter((s) => s.type === filters.type);
      }
    }
    return list;
  },

  async getSpecialistById(id: string): Promise<Specialist | null> {
    if (supabase) {
      const { data } = await supabase.from('specialists').select('*').eq('id', id).single();
      if (data) return data;
    }
    return mockSpecialists.find((s) => s.id === id) || null;
  },

  async getAvailabilityForSpecialist(specialistId: string): Promise<AvailabilitySlot[]> {
    if (supabase) {
      const { data } = await supabase.from('availability').select('*').eq('specialist_id', specialistId);
      if (data) return data;
    }
    return mockAvailability.filter((a) => a.specialist_id === specialistId);
  },

  // Referrals
  async createReferral(referral: Omit<Referral, 'id' | 'created_at'>): Promise<Referral> {
    const newRef: Referral = {
      ...referral,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    if (supabase) {
      const { data, error } = await supabase.from('referrals').insert([newRef]).select().single();
      if (!error && data) return data;
    }
    mockReferrals.unshift(newRef);
    return newRef;
  },

  async getReferrals(userId: string, role: string): Promise<Referral[]> {
    let list = [...mockReferrals];
    if (supabase) {
      const { data } = await supabase.from('referrals').select('*').order('created_at', { ascending: false });
      if (data) list = data;
    }

    // Role filtering
    if (role === 'parent') {
      const parentChildIds = new Set(
        mockChildren.filter((c) => c.parent_id === userId).map((c) => c.id)
      );
      list = list.filter((r) => parentChildIds.has(r.child_id));
    } else if (role === 'specialist') {
      list = list.filter((r) => r.specialist_id === userId || r.specialist_id.startsWith('51'));
    }

    // Hydrate relations
    return list.map((r) => ({
      ...r,
      child: mockChildren.find((c) => c.id === r.child_id),
      specialist: mockSpecialists.find((s) => s.id === r.specialist_id),
      availability: mockAvailability.find((a) => a.id === r.availability_id),
    }));
  },

  async getReferralById(id: string): Promise<Referral | null> {
    if (supabase) {
      const { data } = await supabase.from('referrals').select('*').eq('id', id).single();
      if (data) {
        return {
          ...data,
          child: mockChildren.find((c) => c.id === data.child_id),
          specialist: mockSpecialists.find((s) => s.id === data.specialist_id),
          availability: mockAvailability.find((a) => a.id === data.availability_id),
        };
      }
    }
    const r = mockReferrals.find((item) => item.id === id);
    if (!r) return null;
    return {
      ...r,
      child: mockChildren.find((c) => c.id === r.child_id),
      specialist: mockSpecialists.find((s) => s.id === r.specialist_id),
      availability: mockAvailability.find((a) => a.id === r.availability_id),
    };
  },

  async updateReferralStatus(id: string, status: Referral['status']): Promise<Referral | null> {
    if (supabase) {
      const { data } = await supabase.from('referrals').update({ status }).eq('id', id).select().single();
      if (data) return data;
    }
    const idx = mockReferrals.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    mockReferrals[idx].status = status;
    return this.getReferralById(id);
  },

  // Followups
  async getFollowups(userId: string, role: string): Promise<Followup[]> {
    let list = [...mockFollowups];
    if (supabase) {
      const { data } = await supabase.from('followups').select('*').order('followup_date', { ascending: true });
      if (data) list = data;
    }
    if (role === 'parent') {
      const parentChildIds = new Set(
        mockChildren.filter((c) => c.parent_id === userId).map((c) => c.id)
      );
      list = list.filter((f) => parentChildIds.has(f.child_id));
    }
    return list.map((f) => ({
      ...f,
      child: mockChildren.find((c) => c.id === f.child_id),
    }));
  },

  async createFollowup(followup: Omit<Followup, 'id' | 'created_at'>): Promise<Followup> {
    const newFol: Followup = {
      ...followup,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    if (supabase) {
      const { data, error } = await supabase.from('followups').insert([newFol]).select().single();
      if (!error && data) return data;
    }
    mockFollowups.unshift(newFol);
    return newFol;
  },

  async updateFollowupStatus(id: string, status: Followup['status']): Promise<Followup | null> {
    if (supabase) {
      const { data } = await supabase.from('followups').update({ status }).eq('id', id).select().single();
      if (data) return data;
    }
    const idx = mockFollowups.findIndex((f) => f.id === id);
    if (idx === -1) return null;
    mockFollowups[idx].status = status;
    return {
      ...mockFollowups[idx],
      child: mockChildren.find((c) => c.id === mockFollowups[idx].child_id),
    };
  },

  // AI Explanations
  async saveAIExplanation(exp: Omit<AIExplanation, 'id' | 'created_at'>): Promise<AIExplanation> {
    const saved: AIExplanation = {
      ...exp,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    if (supabase) {
      await supabase.from('ai_explanations').insert([saved]);
    }
    mockAIExplanations.unshift(saved);
    return saved;
  },

  async getAIExplanationForScreening(screeningId: string): Promise<AIExplanation | null> {
    if (supabase) {
      const { data } = await supabase
        .from('ai_explanations')
        .select('*')
        .eq('screening_id', screeningId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (data) return data;
    }
    return mockAIExplanations.find((e) => e.screening_id === screeningId) || null;
  },
};
