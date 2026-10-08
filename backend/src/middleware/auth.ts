import { Request, Response, NextFunction } from 'express';
import { UserProfile, UserRole } from '../types/index.js';
import { mockProfiles, store } from '../services/store.js';
import { createClient } from '@supabase/supabase-js';
import { config } from '../utils/config.js';

export interface AuthenticatedRequest extends Request {
  user?: UserProfile;
}

const supabase = config.hasSupabase
  ? createClient(config.supabaseUrl, config.supabaseServiceRoleKey)
  : null;

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Authentication required. Please log in to continue.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  // Demo / Evaluation tokens support
  if (token === 'demo-parent') {
    req.user = mockProfiles[0];
    next();
    return;
  }
  if (token === 'demo-worker' || token === 'demo-health-worker') {
    req.user = mockProfiles[1];
    next();
    return;
  }
  if (token === 'demo-specialist' || token === 'demo-admin') {
    req.user = mockProfiles[2];
    next();
    return;
  }

  // Live Supabase token verification if configured
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data?.user) {
        res.status(401).json({ error: 'Session expired or invalid credentials.' });
        return;
      }
      const profile = await store.getProfile(data.user.id);
      if (profile) {
        req.user = profile;
      } else {
        req.user = {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name || 'User',
          role: (data.user.user_metadata?.role as UserRole) || 'parent',
          created_at: new Date().toISOString(),
        };
      }
      next();
      return;
    } catch (err) {
      console.error('Auth verification error:', err);
    }
  }

  // Token simulated from local session storage
  try {
    const parsed = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    if (parsed && parsed.id && parsed.role) {
      req.user = parsed;
      next();
      return;
    }
  } catch (e) {
    // Not a base64 demo token
  }

  // Default fallback for demo user session if unknown bearer
  const found = mockProfiles.find((p) => p.id === token);
  if (found) {
    req.user = found;
    next();
    return;
  }

  res.status(401).json({ error: 'Invalid authentication token.' });
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }
    if (!allowedRoles.includes(req.user.role) && req.user.role !== 'admin') {
      res.status(403).json({
        error: 'Access denied. You do not have permission to perform this action.',
      });
      return;
    }
    next();
  };
}

