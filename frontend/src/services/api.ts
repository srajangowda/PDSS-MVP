import {
  AIExplanation,
  AvailabilitySlot,
  Child,
  Followup,
  Referral,
  Screening,
  ScreeningQuestion,
  Specialist,
  UserProfile,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('pedipulse_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.error || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }
  return data as T;
}

export const api = {
  // Auth
  async demoLogin(role: 'parent' | 'health_worker' | 'specialist'): Promise<{
    token: string;
    user: UserProfile;
  }> {
    const res = await fetch(`${API_BASE}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    return handleResponse(res);
  },

  async getMe(): Promise<{ user: UserProfile }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Children
  async getChildren(): Promise<Child[]> {
    const res = await fetch(`${API_BASE}/children`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getChild(id: string): Promise<Child> {
    const res = await fetch(`${API_BASE}/children/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createChild(data: {
    name: string;
    dob: string;
    gender: string;
    location: string;
    guardian_name: string;
    guardian_phone: string;
  }): Promise<Child> {
    const res = await fetch(`${API_BASE}/children`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateChild(id: string, data: Partial<Child>): Promise<Child> {
    const res = await fetch(`${API_BASE}/children/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteChild(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/children/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Screening
  async getScreeningQuestions(childId: string): Promise<{
    child: { id: string; name: string; dob: string; age_months: number; age_display: string };
    question_count: number;
    questions: ScreeningQuestion[];
    disclaimer: string;
  }> {
    const res = await fetch(`${API_BASE}/screening/questions/${childId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async submitScreening(data: {
    childId: string;
    answers: { question_id: string; answer: string }[];
  }): Promise<{
    screening_id: string;
    child_id: string;
    child_name: string;
    overall_score: number;
    risk_level: Screening['risk_level'];
    domain_scores: Screening['domain_scores'];
    interpretation: string;
    recommended_next_step: string;
    total_answered: number;
    created_at: string;
    disclaimer: string;
  }> {
    const res = await fetch(`${API_BASE}/screening/complete-direct`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getScreeningResult(screeningId: string): Promise<{
    screening: Screening;
    child: Child;
    answers_count: number;
    ai_explanation: AIExplanation | null;
    disclaimer: string;
  }> {
    const res = await fetch(`${API_BASE}/screening/${screeningId}/result`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getChildScreeningHistory(childId: string): Promise<Screening[]> {
    const res = await fetch(`${API_BASE}/screening/child/${childId}/history`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // AI Explanation
  async requestAIExplanation(screeningId: string, observations?: string): Promise<AIExplanation> {
    const res = await fetch(`${API_BASE}/ai/explain-screening`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ screeningId, observations }),
    });
    return handleResponse(res);
  },

  // Specialists & Camps
  async getSpecialists(filters?: { location?: string; specialization?: string; type?: string }): Promise<Specialist[]> {
    const params = new URLSearchParams();
    if (filters?.location) params.append('location', filters.location);
    if (filters?.specialization) params.append('specialization', filters.specialization);
    if (filters?.type) params.append('type', filters.type);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/specialists${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getSpecialist(id: string): Promise<Specialist> {
    const res = await fetch(`${API_BASE}/specialists/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getAvailability(specialistId: string): Promise<AvailabilitySlot[]> {
    const res = await fetch(`${API_BASE}/specialists/${specialistId}/availability`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Referrals
  async createReferral(data: {
    child_id: string;
    screening_id: string;
    specialist_id: string;
    availability_id?: string;
    notes?: string;
  }): Promise<Referral> {
    const res = await fetch(`${API_BASE}/referrals`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getReferrals(): Promise<Referral[]> {
    const res = await fetch(`${API_BASE}/referrals`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getReferral(id: string): Promise<Referral> {
    const res = await fetch(`${API_BASE}/referrals/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async updateReferralStatus(id: string, status: Referral['status']): Promise<Referral> {
    const res = await fetch(`${API_BASE}/referrals/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  // Followups
  async getFollowups(): Promise<Followup[]> {
    const res = await fetch(`${API_BASE}/followups`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createFollowup(data: {
    child_id: string;
    referral_id?: string;
    followup_date: string;
    notes?: string;
  }): Promise<Followup> {
    const res = await fetch(`${API_BASE}/followups`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateFollowupStatus(id: string, status: Followup['status']): Promise<Followup> {
    const res = await fetch(`${API_BASE}/followups/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },
};

