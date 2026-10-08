import express from 'express';
import cors from 'cors';
import { config } from './utils/config.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import childRoutes from './routes/childRoutes.js';
import screeningRoutes from './routes/screeningRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import specialistRoutes from './routes/specialistRoutes.js';
import referralRoutes from './routes/referralRoutes.js';
import followupRoutes from './routes/followupRoutes.js';

const app = express();

// Middleware
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    product: 'PediPulse MVP',
    timestamp: new Date().toISOString(),
    supabaseConnected: config.hasSupabase,
    geminiConfigured: config.hasGemini,
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/children', childRoutes);
app.use('/api/screening', screeningRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/specialists', specialistRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/followups', followupRoutes);

// Global Error Handler
app.use(errorHandler);

// Listen only when run standalone (not as Vercel serverless function)
const isServerless = Boolean(process.env.VERCEL || process.env.NOW_REGION || process.env.LAMBDA_TASK_ROOT);
if (!isServerless && (process.argv[1]?.includes('index.ts') || process.argv[1]?.includes('dist/index.js'))) {
  const PORT = config.port;
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🩺 PediPulse Backend running on port ${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🗄️  Supabase: ${config.hasSupabase ? 'Active' : 'In-Memory/Mock Mode'}`);
    console.log(`🤖 Gemini AI: ${config.hasGemini ? 'Configured' : 'Safe Fallback Mode'}`);
    console.log(`=========================================`);
  });
}

export default app;
