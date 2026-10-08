export type UserRole = 'parent' | 'health_worker' | 'specialist' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Child {
  id: string;
  parent_id: string;
  name: string;
  dob: string;
  gender: string;
  location: string;
  guardian_name: string;
  guardian_phone: string;
  created_at: string;
}

export type ScreeningDomain =
  | 'Communication'
  | 'Gross Motor'
  | 'Fine Motor'
  | 'Cognitive'
  | 'Social/Emotional'
  | 'Adaptive';

export interface ScreeningQuestion {
  id: string;
  age_min_months: number;
  age_max_months: number;
  domain: ScreeningDomain;
  question: string;
  display_order: number;
  active: boolean;
}

export type AnswerChoice = 'yes' | 'sometimes' | 'not_yet' | 'unsure';

export interface DomainScore {
  score: number;
  max: number;
  percentage: number;
  status: 'Age Appropriate' | 'Monitor' | 'Possible Concern';
  questions_answered?: number;
}

export type RiskLevel =
  | 'Low Concern'
  | 'Monitor'
  | 'Professional Assessment Recommended';

export interface Screening {
  id: string;
  child_id: string;
  completed_by: string;
  overall_score: number;
  risk_level: RiskLevel;
  domain_scores: Record<string, DomainScore>;
  created_at: string;
  child?: Child;
}

export interface Specialist {
  id: string;
  name: string;
  specialization: string;
  location: string;
  bio: string;
  is_active: boolean;
  type: 'individual' | 'camp';
  organization?: string;
  phone?: string;
  email?: string;
}

export interface AvailabilitySlot {
  id: string;
  specialist_id: string;
  date: string;
  start_time: string;
  end_time: string;
  available_slots: number;
}

export type ReferralStatus = 'Requested' | 'Confirmed' | 'Completed' | 'Cancelled';

export interface Referral {
  id: string;
  child_id: string;
  screening_id: string;
  specialist_id: string;
  availability_id?: string;
  status: ReferralStatus;
  notes?: string;
  created_at: string;
  child?: Child;
  specialist?: Specialist;
  availability?: AvailabilitySlot;
}

export type FollowupStatus = 'Pending' | 'Completed' | 'Overdue';

export interface Followup {
  id: string;
  child_id: string;
  referral_id?: string;
  followup_date: string;
  status: FollowupStatus;
  notes?: string;
  created_at: string;
  child?: Child;
}

export interface AIExplanation {
  id: string;
  screening_id: string;
  summary: string;
  areas_of_attention: string[];
  recommended_next_steps: string[];
  questions_for_doctor: string[];
  disclaimer: string;
  created_at: string;
}

