import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { rateLimitAI } from '../middleware/rateLimiter.js';
import { store } from '../services/store.js';
import { generateAIExplanation } from '../services/geminiService.js';

const router = Router();
router.use(authMiddleware);

const explainRequestSchema = z.object({
  screeningId: z.string().min(1, 'Screening ID is required'),
  observations: z.string().optional(),
});

function formatAge(dobString: string): string {
  const dob = new Date(dobString);
  const now = new Date();
  let months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
  if (now.getDate() < dob.getDate()) {
    months -= 1;
  }
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  return years > 0 ? `${years} years ${remMonths} months` : `${months} months`;
}

router.post('/explain-screening', rateLimitAI(10, 60 * 1000), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = explainRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid request' });
      return;
    }

    const { screeningId, observations } = parsed.data;

    // Check if an explanation already exists to avoid redundant LLM calls (Section 30 - Cost Control)
    const existingExplanation = await store.getAIExplanationForScreening(screeningId);
    if (existingExplanation) {
      res.json(existingExplanation);
      return;
    }

    const screening = await store.getScreeningById(screeningId);
    if (!screening) {
      res.status(404).json({ error: 'Screening record not found.' });
      return;
    }

    const child = await store.getChildById(screening.child_id);
    const childAge = child ? formatAge(child.dob) : '2 to 3 years';

    // Generate educational explanation using Gemini or deterministic fallback
    const generated = await generateAIExplanation({
      screeningId: screening.id,
      childAge,
      domainResults: screening.domain_scores,
      screeningCategory: screening.risk_level,
      observations,
    });

    // Save explanation in data store
    const saved = await store.saveAIExplanation(generated);

    res.json(saved);
  } catch (err: any) {
    console.error('Error generating AI explanation:', err);
    res.status(500).json({
      error: 'Unable to generate AI explanation at this moment. The standard screening result is available.',
    });
  }
});

export default router;

