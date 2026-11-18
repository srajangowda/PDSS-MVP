import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { mockProfiles } from '../services/store.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

const demoLoginSchema = z.object({
  role: z.enum(['parent', 'doctor', 'admin', 'specialist']),
});

router.post('/demo-login', (req: Request, res: Response) => {
  const parsed = demoLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Valid role is required for demo login.' });
    return;
  }

  const targetRole = parsed.data.role === 'specialist' ? 'doctor' : parsed.data.role;
  const user = mockProfiles.find((p) => p.role === targetRole);
  if (!user) {
    res.status(404).json({ error: 'Demo user profile not found.' });
    return;
  }

  const token =
    targetRole === 'parent'
      ? 'demo-parent'
      : targetRole === 'doctor'
      ? 'demo-doctor'
      : 'demo-admin';

  res.json({
    token,
    user,
    message: `Logged in as Demo ${targetRole.toUpperCase()}`,
  });
});

router.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }
  res.json({ user: req.user });
});

export default router;

