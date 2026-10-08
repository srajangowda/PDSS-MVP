import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { store } from '../services/store.js';
import { computeScreeningResults, scoreAnswer } from '../services/screeningEngine.js';
import { AnswerChoice } from '../types/index.js';

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

export default router;

