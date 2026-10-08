import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { store } from '../services/store.js';

const router = Router();
router.use(authMiddleware);

const createReferralSchema = z.object({
  child_id: z.string().min(1, 'Child ID is required'),
  screening_id: z.string().min(1, 'Screening ID is required'),
  specialist_id: z.string().min(1, 'Specialist ID is required'),
  availability_id: z.string().optional(),
  notes: z.string().optional(),
});

// POST /api/referrals - Request a referral
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const parsed = createReferralSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid referral request' });
      return;
    }

    const { child_id, screening_id, specialist_id, availability_id, notes } = parsed.data;

    const child = await store.getChildById(child_id);
    if (!child) {
      res.status(404).json({ error: 'Child not found.' });
      return;
    }

    if (user.role === 'parent' && child.parent_id !== user.id) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    const referral = await store.createReferral({
      child_id,
      screening_id,
      specialist_id,
      availability_id,
      status: 'Requested',
      notes: notes || 'Developmental pre-screening referral request.',
    });

    // Automatically create a follow-up task 14 days later
    const followDate = new Date();
    followDate.setDate(followDate.getDate() + 14);
    const dateStr = followDate.toISOString().split('T')[0];

    await store.createFollowup({
      child_id,
      referral_id: referral.id,
      followup_date: dateStr,
      status: 'Pending',
      notes: 'Initial check-in after specialist consultation booking.',
    });

    const fullReferral = await store.getReferralById(referral.id);
    res.status(201).json(fullReferral);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit referral request.' });
  }
});

// GET /api/referrals - List referrals
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const list = await store.getReferrals(user.id, user.role);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve referrals.' });
  }
});

// GET /api/referrals/:id - Get referral by ID
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const referral = await store.getReferralById(req.params.id);
    if (!referral) {
      res.status(404).json({ error: 'Referral not found.' });
      return;
    }
    res.json(referral);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve referral.' });
  }
});

const updateStatusSchema = z.object({
  status: z.enum(['Requested', 'Confirmed', 'Completed', 'Cancelled']),
});

// PATCH /api/referrals/:id/status - Update referral status
router.patch('/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Valid referral status is required.' });
      return;
    }

    const updated = await store.updateReferralStatus(req.params.id, parsed.data.status);
    if (!updated) {
      res.status(404).json({ error: 'Referral not found.' });
      return;
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update referral status.' });
  }
});

export default router;

