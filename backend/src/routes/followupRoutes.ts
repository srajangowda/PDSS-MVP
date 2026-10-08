import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { store } from '../services/store.js';

const router = Router();
router.use(authMiddleware);

const createFollowupSchema = z.object({
  child_id: z.string().min(1, 'Child ID is required'),
  referral_id: z.string().optional(),
  followup_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  notes: z.string().optional(),
});

// GET /api/followups - List followups
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const followups = await store.getFollowups(user.id, user.role);
    res.json(followups);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve follow-up items.' });
  }
});

// POST /api/followups - Schedule a follow-up
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = createFollowupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid follow-up input' });
      return;
    }

    const { child_id, referral_id, followup_date, notes } = parsed.data;
    const created = await store.createFollowup({
      child_id,
      referral_id,
      followup_date,
      status: 'Pending',
      notes: notes || 'Scheduled developmental check-in.',
    });

    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create follow-up.' });
  }
});

const updateFollowupSchema = z.object({
  status: z.enum(['Pending', 'Completed', 'Overdue']),
  notes: z.string().optional(),
});

// PATCH /api/followups/:id - Update status (e.g. Mark Complete)
router.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = updateFollowupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Valid status is required.' });
      return;
    }

    const updated = await store.updateFollowupStatus(req.params.id, parsed.data.status);
    if (!updated) {
      res.status(404).json({ error: 'Follow-up item not found.' });
      return;
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update follow-up.' });
  }
});

export default router;

