import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Screening, Child, AIExplanation } from '../types';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { AIExplanationModal } from '../components/AIExplanationModal';
import { ReportModal } from '../components/ReportModal';
import {
  Activity,
  Sparkles,
  Stethoscope,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Info,
  Calendar,
} from 'lucide-react';

export const ScreeningResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [screening, setScreening] = useState<Screening | null>(null);
  const [child, setChild] = useState<Child | null>(null);
  const [aiExplanation, setAiExplanation] = useState<AIExplanation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadResult() {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await api.getScreeningResult(id);
        setScreening(data.screening);
        setChild(data.child);
        setAiExplanation(data.ai_explanation);
      } catch (err: any) {
        setError(err.message || 'Unable to load screening result.');
      } finally {
        setIsLoading(false);
      }
    }
    loadResult();
  }, [id]);

  const handleRequestAI = async () => {
    if (!screening) return;
    setIsAiModalOpen(true);
    if (aiExplanation) return; // already loaded

    setIsAiLoading(true);
    try {
      const exp = await api.requestAIExplanation(screening.id);
      setAiExplanation(exp);
    } catch (err: any) {
      console.error('Failed to get AI explanation:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-6">
        <CardSkeleton count={2} />
      </div>
    );
  }

  if (error || !screening || !child) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 px-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Result not found</h2>
        <p className="text-xs text-slate-500">{error || 'Unable to retrieve this screening result.'}</p>
        <Link to="/dashboard" className="inline-block px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8 pb-16">
      {/* Top Banner / Breadcrumb */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <Link to={`/children/${child.id}`} className="hover:text-slate-800 font-semibold transition">
          ← Back to {child.name}'s Profile
        </Link>
        <span>
          Screened on{' '}
          {new Date(screening.created_at).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      </div>

      {/* Main Result Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
              Completed Developmental Pre-Screening
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Developmental Screening Result
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Summary for <strong className="text-slate-700">{child.name}</strong> • Target Milestones Assessment
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRequestAI}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 transition shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              Get AI Explanation
            </button>
            <Link
              to={`/specialists?childId=${child.id}&screeningId=${screening.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
            >
              <Stethoscope className="w-4 h-4 text-teal-600" />
              Find Specialist
            </Link>
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              title="Download screening report"
            >
              <FileText className="w-4 h-4" />
              Report
            </button>
          </div>
        </div>

        {/* Overall Status Box with Neutral Healthcare Tones (Avoid scary red) */}
        <div
          className={`p-6 sm:p-8 rounded-3xl border transition ${
            screening.risk_level === 'Low Concern'
              ? 'bg-emerald-50/60 border-emerald-200'
              : screening.risk_level === 'Monitor'
              ? 'bg-amber-50/60 border-amber-200'
              : 'bg-teal-50/70 border-teal-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Overall Pre-screening Category
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                {screening.risk_level}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">Screening Score</span>
              <div className="text-2xl font-black text-slate-900">{screening.overall_score} pts</div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200/60 space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">What this means:</h4>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              {screening.risk_level === 'Professional Assessment Recommended'
                ? 'Some responses indicate that further professional developmental assessment may be appropriate. An early checkup with a pediatric specialist or therapist can offer personalized guidance.'
                : screening.risk_level === 'Monitor'
                ? 'Some responses may benefit from ongoing monitoring and discussion during routine pediatric visits. Milestone emergence varies naturally among children.'
                : 'Current responses do not indicate a major concern in this screening. The child is showing steady progress across observed milestone benchmarks.'}
            </p>
          </div>

          <div className="mt-3 p-3.5 bg-white/80 rounded-2xl border border-slate-200/80 text-xs text-slate-700 space-y-1">
            <strong className="text-slate-900 font-semibold block">Recommended next step:</strong>
            <p className="text-slate-600">
              {screening.risk_level === 'Professional Assessment Recommended'
                ? 'Consider scheduling a consultation with a developmental pediatrician, speech therapist, or attending a local community screening camp.'
                : screening.risk_level === 'Monitor'
                ? 'Engage in targeted interactive play routines and repeat the questionnaire in 6 to 8 weeks.'
                : 'Continue positive daily play routines, responsive conversations, and routine pediatric wellness checkups.'}
            </p>
          </div>
        </div>

        {/* 6-Domain Breakdown Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Domain Performance Breakdown</h3>
            <span className="text-xs text-slate-400">Deterministic scoring evaluation</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(screening.domain_scores || {}).map(([domain, score]) => (
              <div
                key={domain}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <span className="font-bold text-sm text-slate-900">{domain}</span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      score.status === 'Age Appropriate'
                        ? 'bg-emerald-100 text-emerald-800'
                        : score.status === 'Monitor'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {score.status}
                  </span>
                </div>

                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      score.status === 'Age Appropriate'
                        ? 'bg-emerald-500'
                        : score.status === 'Monitor'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(10, score.percentage))}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-slate-500 font-medium">
                  <span>Score</span>
                  <span>{score.score} / {score.max} pts ({score.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Step Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div className="p-5 rounded-2xl bg-teal-50/60 border border-teal-200/70 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" />
                Want an AI explanation in simple words?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Receive an educational, parent-friendly breakdown with home activity ideas and specific questions to ask your doctor.
              </p>
            </div>
            <button
              onClick={handleRequestAI}
              className="py-2 px-4 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition w-fit shadow-2xs"
            >
              Get AI Explanation
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                Connect with Pediatric Specialists
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Search verified developmental pediatricians, speech therapists, or attend free community screening camps.
              </p>
            </div>
            <Link
              to={`/specialists?childId=${child.id}&screeningId=${screening.id}`}
              className="py-2 px-4 rounded-xl text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 transition w-fit shadow-2xs"
            >
              Browse Specialists & Camps →
            </Link>
          </div>
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="bg-amber-50/80 rounded-2xl p-4.5 border border-amber-200 flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold mb-0.5">Clinical Pre-screening Disclaimer:</strong>
          This screening result is not a diagnosis. It does not replace clinical evaluation by a medical practitioner. Please consult a qualified healthcare professional or pediatrician for comprehensive evaluation and guidance.
        </div>
      </div>

      {/* AI Explanation Modal */}
      <AIExplanationModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        explanation={aiExplanation}
        isLoading={isAiLoading}
        childName={child.name}
      />

      {/* Report Modal */}
      {isReportModalOpen && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          screening={screening}
          child={child}
        />
      )}
    </div>
  );
};

