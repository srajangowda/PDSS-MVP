import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { store } from '../services/store.js';
import { computeScreeningResults, scoreAnswer } from '../services/screeningEngine.js';
import { AnswerChoice, DomainTrend, TrendDirection } from '../types/index.js';
import { generateAIProgressSummary } from '../services/geminiService.js';

const router = Router();
router.use(authMiddleware);

function calculateAgeInMonths(dobString: string): number {
  const dob = new Date(dobString);
  const now = new Date();
  let months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
  if (now.getDate() < dob.getDate()) {
    months -= 1;
  }
  return Math.max(0, months);
}

// GET /api/screening/questions/:childId - Get age-appropriate questionnaire
router.get('/questions/:childId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const child = await store.getChildById(req.params.childId);

    if (!child) {
      res.status(404).json({ error: 'Child record not found.' });
      return;
    }

    if (user.role === 'parent' && child.parent_id !== user.id) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    const ageMonths = calculateAgeInMonths(child.dob);
    const questions = await store.getQuestionsForAge(ageMonths);

    // Human readable age string
    const years = Math.floor(ageMonths / 12);
    const remMonths = ageMonths % 12;
    const ageString = years > 0 ? `${years}y ${remMonths}m` : `${remMonths} months`;

    res.json({
      child: {
        id: child.id,
        name: child.name,
        dob: child.dob,
        age_months: ageMonths,
        age_display: ageString,
      },
      question_count: questions.length,
      questions,
      disclaimer: 'This questionnaire is intended for developmental pre-screening and does not provide a medical diagnosis.',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Unable to load screening questions. Please try again.' });
  }
});

// POST /api/screening/start - Initialize a new screening record
router.post('/start', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { childId } = req.body;

    if (!childId) {
      res.status(400).json({ error: 'Child ID is required.' });
      return;
    }

    const child = await store.getChildById(childId);
    if (!child) {
      res.status(404).json({ error: 'Child not found.' });
      return;
    }

    if (user.role === 'parent' && child.parent_id !== user.id) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    const newScreening = await store.createScreening({
      child_id: child.id,
      completed_by: user.id,
      overall_score: 0,
      risk_level: 'Low Concern',
      domain_scores: {},
    });

    res.status(201).json(newScreening);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to initiate screening session.' });
  }
});

const submitAnswersSchema = z.object({
  childId: z.string().min(1),
  answers: z.array(
    z.object({
      question_id: z.string().min(1),
      answer: z.enum(['yes', 'sometimes', 'not_yet', 'unsure']),
    })
  ).min(1, 'At least one answer is required'),
});

// POST /api/screening/complete-direct - Complete screening and compute deterministic score
router.post('/complete-direct', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const parsed = submitAnswersSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid screening submission' });
      return;
    }

    const { childId, answers } = parsed.data;
    const child = await store.getChildById(childId);
    if (!child) {
      res.status(404).json({ error: 'Child not found.' });
      return;
    }

    if (user.role === 'parent' && child.parent_id !== user.id) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    const ageMonths = calculateAgeInMonths(child.dob);
    const questions = await store.getQuestionsForAge(ageMonths);

    // Compute deterministic results (No LLM for screening scores)
    const computed = computeScreeningResults(questions, answers as any);

    // Save screening
    const screening = await store.createScreening({
      child_id: child.id,
      completed_by: user.id,
      overall_score: computed.overall_score,
      risk_level: computed.risk_level,
      domain_scores: computed.domain_scores,
    });

    // Save individual answers
    const answersToSave = answers.map((a) => ({
      screening_id: screening.id,
      question_id: a.question_id,
      answer: a.answer as AnswerChoice,
      score: scoreAnswer(a.answer as AnswerChoice),
    }));
    await store.saveAnswers(answersToSave);

    res.status(201).json({
      screening_id: screening.id,
      child_id: child.id,
      child_name: child.name,
      overall_score: computed.overall_score,
      risk_level: computed.risk_level,
      domain_scores: computed.domain_scores,
      interpretation: computed.interpretation,
      recommended_next_step: computed.recommended_next_step,
      total_answered: computed.total_answered,
      created_at: screening.created_at,
      disclaimer: 'This screening result is not a diagnosis. Please consult a qualified healthcare professional for clinical evaluation.',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to process screening. Please try again.' });
  }
});

// GET /api/screening/:id - Get screening
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const screening = await store.getScreeningById(req.params.id);
    if (!screening) {
      res.status(404).json({ error: 'Screening record not found.' });
      return;
    }
    res.json(screening);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load screening.' });
  }
});

// GET /api/screening/:id/result - Get detailed result and domain breakdowns
router.get('/:id/result', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const screening = await store.getScreeningById(req.params.id);
    if (!screening) {
      res.status(404).json({ error: 'Screening not found.' });
      return;
    }

    const child = await store.getChildById(screening.child_id);
    const answers = await store.getAnswersForScreening(screening.id);
    const aiExplanation = await store.getAIExplanationForScreening(screening.id);

    res.json({
      screening,
      child,
      answers_count: answers.length,
      ai_explanation: aiExplanation,
      disclaimer: 'This screening result is not a diagnosis. Please consult a qualified healthcare professional for clinical evaluation.',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load screening result.' });
  }
});

// GET /api/screening/child/:childId/history - Get screening history for a child
router.get('/child/:childId/history', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await store.getScreeningsForChild(req.params.childId);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load child screening history.' });
  }
});

function calculateAgeAtDate(dobString: string, dateString: string): string {
  const dob = new Date(dobString);
  const sessionDate = new Date(dateString);
  let months = (sessionDate.getFullYear() - dob.getFullYear()) * 12 + (sessionDate.getMonth() - dob.getMonth());
  if (sessionDate.getDate() < dob.getDate()) {
    months -= 1;
  }
  months = Math.max(0, months);
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return years > 0 ? `${years}y ${rem}m` : `${months} months`;
}

function computeTrends(sessions: any[]): DomainTrend[] {
  if (sessions.length < 2) return [];

  const sorted = [...sessions].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const prev = sorted[sorted.length - 2];
  const curr = sorted[sorted.length - 1];

  const allDomains = [
    'Communication',
    'Gross Motor',
    'Fine Motor',
    'Cognitive',
    'Social/Emotional',
    'Adaptive',
  ];

  const tierMap: Record<string, number> = {
    'Possible Concern': 1,
    'Monitor': 2,
    'Age Appropriate': 3,
  };

  return allDomains.map((domain) => {
    const prevScore = prev.domain_scores[domain] || { percentage: 0, status: 'Monitor' };
    const currScore = curr.domain_scores[domain] || { percentage: 0, status: 'Monitor' };

    const tierPrev = tierMap[prevScore.status] || 2;
    const tierCurr = tierMap[currScore.status] || 2;

    let trend: TrendDirection = 'unchanged';
    let label = 'Unchanged';

    if (tierCurr < tierPrev || currScore.status === 'Possible Concern') {
      trend = 'needs_attention';
      label = 'Needs Attention';
    } else if (tierCurr > tierPrev) {
      trend = 'improved';
      label = 'Improved';
    } else {
      trend = 'unchanged';
      label = 'Unchanged';
    }

    return {
      domain,
      previous_percentage: prevScore.percentage,
      latest_percentage: currScore.percentage,
      previous_status: prevScore.status,
      latest_status: currScore.status,
      trend,
      label,
      delta_percentage: currScore.percentage - prevScore.percentage,
    };
  });
}

// GET /api/screening/progress/:childId - Full progress tracking timeline and trends
router.get('/progress/:childId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const childId = req.params.childId;

    const access = await store.canAccessChild(user, childId);
    if (!access.allowed) {
      res.status(403).json({
        error: access.isDoctor && !access.consentGranted
          ? 'Access restricted: The parent has revoked doctor consultation consent for this child.'
          : 'Access denied. You do not have permission to view progress records for this child.',
      });
      return;
    }

    const child = await store.getChildById(childId);
    if (!child) {
      res.status(404).json({ error: 'Child record not found.' });
      return;
    }

    const rawSessions = await store.getScreeningsForChild(childId);

    // Sort chronologically ascending for timeline
    const chronologicalSessions = [...rawSessions]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((s) => ({
        id: s.id,
        date: s.created_at.split('T')[0],
        created_at: s.created_at,
        age_display: calculateAgeAtDate(child.dob, s.created_at),
        overall_score: s.overall_score,
        risk_level: s.risk_level,
        domain_scores: s.domain_scores,
      }));

    const trends = computeTrends(chronologicalSessions);

    // Get referral & consent status
    const referral = await store.getReferralForChildAndDoctor(
      childId,
      user.role === 'doctor' ? user.id : undefined
    );

    let doctorName: string | undefined = undefined;
    if (referral) {
      const spec = await store.getSpecialistById(referral.specialist_id);
      doctorName = spec?.name || 'Dr. Ananya Rao';
    }

    // Get doctor recommendations & notes
    const doctorNotes = await store.getDoctorNotesForChild(childId);

    res.json({
      child,
      sessions: chronologicalSessions,
      trends,
      consent: {
        is_consented: referral ? referral.consent_granted !== false : false,
        referral_id: referral?.id,
        doctor_id: referral?.doctor_id || referral?.specialist_id,
        doctor_name: doctorName,
      },
      doctor_notes: doctorNotes,
      disclaimer: 'This is a pre-screening summary, not a medical diagnosis.',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve child progress tracking data.' });
  }
});

// GET /api/screening/progress-summary/:childId - AI bilingual progress summary with DB cache
router.get('/progress-summary/:childId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const childId = req.params.childId;

    const access = await store.canAccessChild(user, childId);
    if (!access.allowed) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    const child = await store.getChildById(childId);
    if (!child) {
      res.status(404).json({ error: 'Child record not found.' });
      return;
    }

    const rawSessions = await store.getScreeningsForChild(childId);
    if (rawSessions.length < 2) {
      res.status(400).json({
        error: 'At least 2 completed screening sessions are required to analyze developmental progress trends.',
      });
      return;
    }

    const chronologicalSessions = [...rawSessions]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((s) => ({
        id: s.id,
        date: s.created_at.split('T')[0],
        age_display: calculateAgeAtDate(child.dob, s.created_at),
        overall_score: s.overall_score,
        risk_level: s.risk_level,
        domain_scores: s.domain_scores,
      }));

    const trends = computeTrends(chronologicalSessions);

    // Compute session hash for caching
    const sessionIds = chronologicalSessions.map((s) => s.id);
    const sessionHash = [...sessionIds].sort().join(':');

    // Check DB cache
    const cached = await store.getProgressSummary(childId, sessionHash);
    if (cached) {
      res.json({
        summary_en: cached.summary_en,
        summary_kn: cached.summary_kn,
        key_changes: cached.key_changes,
        disclaimer: cached.disclaimer,
        cached: true,
      });
      return;
    }

    // Generate bilingual summary via Gemini
    const ageMonths = calculateAgeInMonths(child.dob);
    const years = Math.floor(ageMonths / 12);
    const remMonths = ageMonths % 12;
    const ageDisplay = years > 0 ? `${years}y ${remMonths}m` : `${remMonths} months`;

    const generated = await generateAIProgressSummary({
      childId,
      childAge: ageDisplay,
      sessions: chronologicalSessions,
      trends,
    });

    // Cache in DB
    await store.saveProgressSummary({
      child_id: childId,
      session_ids: sessionIds,
      session_hash: sessionHash,
      summary_en: generated.summary_en,
      summary_kn: generated.summary_kn,
      key_changes: generated.key_changes,
      disclaimer: generated.disclaimer,
    });

    res.json({
      summary_en: generated.summary_en,
      summary_kn: generated.summary_kn,
      key_changes: generated.key_changes,
      disclaimer: generated.disclaimer,
      cached: false,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate progress summary.' });
  }
});

const updateConsentSchema = z.object({
  consent_granted: z.boolean(),
});

// POST /api/screening/consent/:referralId - Toggle doctor sharing consent
router.post('/consent/:referralId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const parsed = updateConsentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Valid consent_granted boolean is required.' });
      return;
    }

    const referral = await store.getReferralById(req.params.referralId);
    if (!referral) {
      res.status(404).json({ error: 'Referral connection not found.' });
      return;
    }

    // Only the parent or admin can grant or revoke consent
    const child = await store.getChildById(referral.child_id);
    if (!child) {
      res.status(404).json({ error: 'Child not found.' });
      return;
    }

    if (user.role === 'parent' && child.parent_id !== user.id) {
      res.status(403).json({ error: 'Access denied. Only the parent can update consultation consent.' });
      return;
    }

    const updated = await store.updateReferralConsent(
      req.params.referralId,
      parsed.data.consent_granted
    );

    res.json({
      success: true,
      referral_id: req.params.referralId,
      consent_granted: updated?.consent_granted ?? parsed.data.consent_granted,
      message: parsed.data.consent_granted
        ? 'Doctor data-sharing consent granted.'
        : 'Doctor data-sharing consent revoked.',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update consent.' });
  }
});

const createNoteSchema = z.object({
  note: z.string().min(3, 'Observation note must be at least 3 characters'),
  recommendations: z.string().optional(),
});

// POST /api/screening/notes/:childId - Doctor adds notes/recommendations
router.post('/notes/:childId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role !== 'doctor' && user.role !== 'admin') {
      res.status(403).json({ error: 'Only doctors and administrators can record clinical notes.' });
      return;
    }

    const access = await store.canAccessChild(user, req.params.childId);
    if (!access.allowed) {
      res.status(403).json({
        error: 'Cannot add notes: Consent has been revoked or connection is inactive.',
      });
      return;
    }

    const parsed = createNoteSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid note content' });
      return;
    }

    const created = await store.saveDoctorNote({
      child_id: req.params.childId,
      doctor_id: user.id,
      doctor_name: user.name || 'Pediatric Consultant',
      note: parsed.data.note.trim(),
      recommendations: (parsed.data.recommendations || '').trim(),
    });

    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save doctor note.' });
  }
});

// GET /api/screening/doctor/connected-children - Connected children list for doctor
router.get('/doctor/connected-children', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role !== 'doctor' && user.role !== 'admin') {
      res.status(403).json({ error: 'Access denied. Doctor profile required.' });
      return;
    }

    const list = await store.getConnectedChildrenForDoctor(user.id);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load connected children.' });
  }
});

export default router;

