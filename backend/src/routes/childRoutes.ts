import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { store } from '../services/store.js';

const router = Router();
router.use(authMiddleware);

const createChildSchema = z.object({
  name: z.string().min(2, 'Child name must be at least 2 characters'),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD'),
  gender: z.enum(['Male', 'Female', 'Other']),
  location: z.string().min(2, 'Location is required'),
  guardian_name: z.string().min(2, 'Guardian name is required'),
  guardian_phone: z.string().min(6, 'Guardian contact number is required'),
});

function calculateAgeMonths(dobString: string): number {
  const dob = new Date(dobString);
  const now = new Date();
  let months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
  if (now.getDate() < dob.getDate()) {
    months -= 1;
  }
  return Math.max(0, months);
}

// GET /api/children - List children
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const children = await store.getChildren(user.id, user.role);
    res.json(children);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve children records.' });
  }
});

// POST /api/children - Register a new child
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const validated = createChildSchema.parse(req.body);

    const dobDate = new Date(validated.dob);
    const today = new Date();
    if (dobDate > today) {
      res.status(400).json({ error: 'Date of birth cannot be in the future.' });
      return;
    }

    const ageMonths = calculateAgeMonths(validated.dob);
    if (ageMonths > 72) {
      res.status(400).json({
        error: 'PediPulse focuses on early childhood developmental pre-screening (0–5 years). The specified child is older than 5 years.',
      });
      return;
    }

    const newChild = await store.createChild({
      parent_id: user.id,
      name: validated.name.trim(),
      dob: validated.dob,
      gender: validated.gender,
      location: validated.location.trim(),
      guardian_name: validated.guardian_name.trim(),
      guardian_phone: validated.guardian_phone.trim(),
    });

    res.status(201).json(newChild);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0]?.message || 'Invalid child information' });
      return;
    }
    res.status(500).json({ error: 'Failed to register child.' });
  }
});

// GET /api/children/:id - Get specific child
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const child = await store.getChildById(req.params.id);

    if (!child) {
      res.status(404).json({ error: 'Child record not found.' });
      return;
    }

    // Security check: Parents can only access their own children
    if (user.role === 'parent' && child.parent_id !== user.id) {
      res.status(403).json({ error: 'Access denied. You do not have permission to view this child.' });
      return;
    }

    res.json(child);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch child details.' });
  }
});

// PUT /api/children/:id - Update child
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const existing = await store.getChildById(req.params.id);

    if (!existing) {
      res.status(404).json({ error: 'Child record not found.' });
      return;
    }

    if (user.role === 'parent' && existing.parent_id !== user.id) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    const validated = createChildSchema.partial().parse(req.body);
    const updated = await store.updateChild(req.params.id, validated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update child details.' });
  }
});

// DELETE /api/children/:id - Delete child
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const existing = await store.getChildById(req.params.id);

    if (!existing) {
      res.status(404).json({ error: 'Child record not found.' });
      return;
    }

    if (user.role === 'parent' && existing.parent_id !== user.id) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    await store.deleteChild(req.params.id);
    res.json({ success: true, message: 'Child record removed successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to remove child record.' });
  }
});

export default router;

