import { Router, Request, Response } from 'express';
import { store } from '../services/store.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// GET /api/specialists - List specialists and camps with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { location, specialization, type } = req.query;
    const specialists = await store.getSpecialists({
      location: typeof location === 'string' ? location : undefined,
      specialization: typeof specialization === 'string' ? specialization : undefined,
      type: typeof type === 'string' ? type : undefined,
    });
    res.json(specialists);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve specialist directory.' });
  }
});

// GET /api/specialists/:id - Specialist profile
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const specialist = await store.getSpecialistById(req.params.id);
    if (!specialist) {
      res.status(404).json({ error: 'Specialist or screening camp not found.' });
      return;
    }
    res.json(specialist);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch specialist details.' });
  }
});

// GET /api/specialists/:id/availability - Available slots
router.get('/:id/availability', async (req: Request, res: Response) => {
  try {
    const slots = await store.getAvailabilityForSpecialist(req.params.id);
    res.json(slots);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load specialist availability.' });
  }
});

export default router;

