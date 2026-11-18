import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ChildProgressData, ChildDoctorNote } from '../types';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Stethoscope,
  ArrowLeft,
  Share2,
  FileText,
  PlusCircle,
  Lock,
  Globe,
  Send,
  User,
  Heart,
} from 'lucide-react';

const DOMAIN_COLORS: Record<string, string> = {
  Communication: '#0ea5e9', // Sky blue
  'Gross Motor': '#10b981', // Emerald
  'Fine Motor': '#8b5cf6', // Violet
  Cognitive: '#f59e0b', // Amber
  'Social/Emotional': '#ec4899', // Pink
  Adaptive: '#14b8a6', // Teal
};

export const ChildProgressPage: React.FC = () => {
  const { id: childId } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [data, setData] = useState<(ChildProgressData & { disclaimer: string }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // AI Summary State
  const [summaryData, setSummaryData] = useState<{
    summary_en: string;
    summary_kn: string;
    key_changes: string[];
    disclaimer: string;
    cached: boolean;
  } | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState<'en' | 'kn'>('en');

  // Chart domain filter
  const [activeDomainFilter, setActiveDomainFilter] = useState<string>('all');

  // Doctor note form state
  const [newNote, setNewNote] = useState('');
  const [newRecommendation, setNewRecommendation] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [noteSuccess, setNoteSuccess] = useState<string | null>(null);

  // Consent toggle state
  const [isUpdatingConsent, setIsUpdatingConsent] = useState(false);
  const [consentSuccess, setConsentSuccess] = useState<string | null>(null);

  const fetchProgress = async () => {
    if (!childId) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const progress = await api.getChildProgress(childId);
      setData(progress);

      // If at least 2 sessions exist, load AI summary
      if (progress.sessions.length >= 2) {
        loadSummary();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load child progress tracking data.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSummary = async () => {
    if (!childId) return;
    setIsSummaryLoading(true);
    try {
      const res = await api.getChildProgressSummary(childId);
      setSummaryData(res);
    } catch (err) {
      console.warn('AI summary fetch failed:', err);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [childId]);

  const handleToggleConsent = async () => {
    if (!data?.consent.referral_id) return;
    setIsUpdatingConsent(true);
    setConsentSuccess(null);
    try {
      const newStatus = !data.consent.is_consented;
      const res = await api.updateConsent(data.consent.referral_id, newStatus);
      setData((prev) =>
        prev
          ? {
              ...prev,
              consent: {
                ...prev.consent,
                is_consented: res.consent_granted,
              },
            }
          : prev
      );
      setConsentSuccess(res.message);
      setTimeout(() => setConsentSuccess(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to update doctor consent.');
    } finally {
      setIsUpdatingConsent(false);
    }
  };

  const handleAddDoctorNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childId || !newNote.trim()) return;
    setIsSubmittingNote(true);
    setNoteSuccess(null);
    try {
      const saved = await api.addDoctorNote(childId, newNote.trim(), newRecommendation.trim());
      setData((prev) =>
        prev
          ? {
              ...prev,
              doctor_notes: [saved, ...prev.doctor_notes],
            }
          : prev
      );
      setNewNote('');
      setNewRecommendation('');
      setNoteSuccess('Doctor observation note and recommendations recorded successfully.');
      setTimeout(() => setNoteSuccess(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to save clinical note.');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <CardSkeleton count={3} />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">{errorMsg}</p>
          <div className="pt-2">
            <Link
              to={user?.role === 'doctor' ? '/doctor/dashboard' : '/children'}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { child, sessions, trends, consent, doctor_notes } = data;

  // Prepare chart series data
  const chartData = sessions.map((s, idx) => {
    const entry: Record<string, any> = {
      name: `S${idx + 1} (${s.date.slice(5)})`,
      fullDate: s.date,
      age: s.age_display,
      overall: s.overall_score,
    };
    for (const [dom, scoreObj] of Object.entries(s.domain_scores)) {
      entry[dom] = scoreObj.percentage;
    }
    return entry;
  });

  const domainsList = [
    'Communication',
    'Gross Motor',
    'Fine Motor',
    'Cognitive',
    'Social/Emotional',
    'Adaptive',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-20">
      {/* Back Nav & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            to={user?.role === 'doctor' ? '/doctor/dashboard' : `/children/${child.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 transition mb-1"
          >
            <ArrowLeft className="w-4 h-4" />
            {user?.role === 'doctor' ? 'Back to Doctor Consultation Portal' : `Back to ${child.name}'s Profile`}
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {child.name}'s Progress Tracking
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
              Age: {sessions[sessions.length - 1]?.age_display || 'Early Years'}
            </span>
            {user?.role === 'doctor' && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5 text-amber-600" />
                Doctor View (Read-Only)
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Chronological milestone history and domain trends across completed pre-screening sessions.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {user?.role === 'parent' && (
            <Link
              to={`/screening?childId=${child.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              New Screening
            </Link>
          )}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            Print Report
          </button>
        </div>
      </div>

      {/* Mandatory Clinical Disclaimer Banner */}
      <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 border border-teal-200/80 rounded-2xl p-4.5 flex items-start gap-3.5 shadow-2xs">
        <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          <strong className="text-slate-900 font-bold block mb-0.5">
            Non-Diagnostic Pre-Screening Disclaimer:
          </strong>
          {data.disclaimer} PediPulse monitors milestone development based on parental observations and
          does not provide clinical diagnosis or medical prescriptions. Always discuss these findings with a
          qualified pediatrician or developmental specialist.
        </div>
      </div>

      {/* Doctor Link & Parent Consent Control Card */}
      {consent.referral_id && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                consent.is_consented ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-400'
              }`}
            >
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Connected Doctor: {consent.doctor_name || 'Dr. Ananya Rao'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    consent.is_consented
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {consent.is_consented ? 'Consent Granted' : 'Consent Revoked'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {consent.is_consented
                  ? 'Your connected doctor can view this progress tracking dashboard and provide recommendations.'
                  : 'Doctor data access is currently revoked. Your child’s progress records are private to you.'}
              </p>
            </div>
          </div>

          {/* Toggle Consent Button (Only for Parent) */}
          {user?.role === 'parent' && (
            <div className="flex items-center gap-3">
              {consentSuccess && (
                <span className="text-xs font-semibold text-emerald-600">{consentSuccess}</span>
              )}
              <button
                onClick={handleToggleConsent}
                disabled={isUpdatingConsent}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50 ${
                  consent.is_consented
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                    : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
                }`}
              >
                {consent.is_consented ? 'Revoke Doctor Access' : 'Grant Doctor Access'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Sessions</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{sessions.length}</div>
          <p className="text-[11px] text-slate-500">Completed pre-screenings</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Latest Category</span>
          <div className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
            {sessions[sessions.length - 1]?.risk_level || 'Pending'}
          </div>
          <p className="text-[11px] text-slate-500">
            {sessions[sessions.length - 1]?.date || 'No sessions'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Improved Domains</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
            {trends.filter((t) => t.trend === 'improved').length}
          </div>
          <p className="text-[11px] text-slate-500">Positive tier transitions</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Attention Areas</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">
            {trends.filter((t) => t.trend === 'needs_attention').length}
          </div>
          <p className="text-[11px] text-slate-500">Domains for focus or review</p>
        </div>
      </div>

      {/* Multi-Session Progress Trends Section */}
      {sessions.length < 2 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Complete at least 2 screenings to see trends</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            {child.name} currently has {sessions.length} recorded screening session. Progress tracking and domain
            trajectory comparisons automatically activate once a second screening is completed!
          </p>
          {user?.role === 'parent' && (
            <div className="pt-2">
              <Link
                to={`/screening?childId=${child.id}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Start Follow-up Screening
              </Link>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Recharts Milestone Trend Chart */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider">
                  <TrendingUp className="w-4 h-4" />
                  Domain Milestone Trajectory
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  Performance Across Screening Sessions
                </h2>
                <p className="text-xs text-slate-500">
                  Scores calculated strictly by our deterministic scoring engine across the 6 developmental domains.
                </p>
              </div>

              {/* Domain Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  onClick={() => setActiveDomainFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    activeDomainFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Domains
                </button>
                {domainsList.map((dom) => (
                  <button
                    key={dom}
                    onClick={() => setActiveDomainFilter(dom)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition ${
                      activeDomainFilter === dom
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {dom}
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts Container */}
            <div className="w-full h-72 sm:h-80 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" stroke="#cbd5e1" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  {domainsList
                    .filter((d) => activeDomainFilter === 'all' || activeDomainFilter === d)
                    .map((dom) => (
                      <Line
                        key={dom}
                        type="monotone"
                        dataKey={dom}
                        name={dom}
                        stroke={DOMAIN_COLORS[dom] || '#0d9488'}
                        strokeWidth={2.5}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Domain-Level Trend Cards */}
          <div className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Domain Change Summary (Scoring Engine Rules)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {trends.map((t) => {
                const isImproved = t.trend === 'improved';
                const isAttention = t.trend === 'needs_attention';

                return (
                  <div
                    key={t.domain}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3 hover:border-slate-300 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: DOMAIN_COLORS[t.domain] || '#0d9488' }}
                        />
                        <h4 className="text-sm font-bold text-slate-900">{t.domain}</h4>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                          isImproved
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isAttention
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {isImproved ? (
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        ) : isAttention ? (
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                          <Minus className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        {t.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Previous</span>
                        <span className="font-bold text-slate-700">{t.previous_percentage}%</span>{' '}
                        <span className="text-[10px] text-slate-400">({t.previous_status})</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Latest</span>
                        <span className="font-bold text-slate-900">{t.latest_percentage}%</span>{' '}
                        <span className="text-[10px] text-slate-500">({t.latest_status})</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span>Delta:</span>
                      <span
                        className={`font-bold ${
                          t.delta_percentage > 0
                            ? 'text-emerald-600'
                            : t.delta_percentage < 0
                            ? 'text-rose-600'
                            : 'text-slate-600'
                        }`}
                      >
                        {t.delta_percentage >= 0 ? `+${t.delta_percentage}%` : `${t.delta_percentage}%`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bilingual AI Progress Summary Section */}
          <div className="bg-gradient-to-br from-teal-50/70 via-white to-emerald-50/50 rounded-3xl p-6 sm:p-8 border border-teal-200/90 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-teal-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    AI Developmental Progress Insights
                    {summaryData?.cached && (
                      <span className="text-[10px] font-semibold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded-full">
                        Cached in DB
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Plain-language comparative summary powered by server-side Google Gemini.
                  </p>
                </div>
              </div>

              {/* Language Selector */}
              <div className="inline-flex rounded-xl p-1 bg-teal-100/60 border border-teal-200/80">
                <button
                  onClick={() => setSelectedLang('en')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    selectedLang === 'en'
                      ? 'bg-white text-teal-900 shadow-2xs'
                      : 'text-teal-700 hover:text-teal-900'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  English
                </button>
                <button
                  onClick={() => setSelectedLang('kn')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    selectedLang === 'kn'
                      ? 'bg-white text-teal-900 shadow-2xs'
                      : 'text-teal-700 hover:text-teal-900'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  ಕನ್ನಡ (Kannada)
                </button>
              </div>
            </div>

            {isSummaryLoading ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-2 text-slate-500 text-xs">
                <div className="w-7 h-7 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
                <span>Generating bilingual progress summary...</span>
              </div>
            ) : summaryData ? (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-5 border border-teal-100 shadow-2xs space-y-2">
                  <h4 className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                    {selectedLang === 'en' ? 'Summary of Changes' : 'ಬದಲಾವಣೆಗಳ ಸಾರಾಂಶ'}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {selectedLang === 'en' ? summaryData.summary_en : summaryData.summary_kn}
                  </p>
                </div>

                {summaryData.key_changes.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Observed Highlights
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {summaryData.key_changes.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-white rounded-xl p-3 border border-slate-200 text-xs text-slate-700 flex items-start gap-2 shadow-2xs"
                        >
                          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Progress insights currently loading...</p>
            )}
          </div>
        </>
      )}

      {/* Session History Timeline */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Screening Sessions Timeline
            </h3>
            <p className="text-xs text-slate-500">
              Chronological log of completed developmental questionnaires.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {sessions.length} {sessions.length === 1 ? 'Record' : 'Records'}
          </span>
        </div>

        <div className="space-y-4">
          {sessions.map((s, idx) => (
            <div
              key={s.id}
              className="border border-slate-200 rounded-2xl p-5 hover:border-teal-300 transition space-y-4 shadow-2xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
                    #{idx + 1}
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900">Session on {s.date}</span>
                    <span className="text-xs text-slate-500 ml-2">Age: {s.age_display}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      s.risk_level === 'Low Concern'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : s.risk_level === 'Monitor'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {s.risk_level}
                  </span>
                  <Link
                    to={`/screening/${s.id}/result`}
                    className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                  >
                    View Details →
                  </Link>
                </div>
              </div>

              {/* Per-Domain Result Bars */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {Object.entries(s.domain_scores).map(([dom, scoreObj]) => (
                  <div key={dom} className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate block">
                      {dom}
                    </span>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-900">{scoreObj.percentage}%</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          scoreObj.status === 'Age Appropriate'
                            ? 'bg-emerald-100 text-emerald-800'
                            : scoreObj.status === 'Monitor'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {scoreObj.status === 'Age Appropriate' ? 'Approp' : scoreObj.status}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          scoreObj.status === 'Age Appropriate'
                            ? 'bg-emerald-500'
                            : scoreObj.status === 'Monitor'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${scoreObj.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Doctor Observations & Recommendations Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Doctor Consultation Notes & Follow-up Guidance
              </h3>
              <p className="text-xs text-slate-500">
                Direct recommendations provided by connected pediatric clinicians.
              </p>
            </div>
          </div>
        </div>

        {/* Doctor Note Composer (Visible to Doctor and Admin) */}
        {(user?.role === 'doctor' || user?.role === 'admin') && (
          <form
            onSubmit={handleAddDoctorNote}
            className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3"
          >
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-teal-600" />
              Add Doctor Clinical Note & Follow-up
            </h4>
            {noteSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">
                {noteSuccess}
              </div>
            )}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Clinical Observation Note *
              </label>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={2}
                placeholder="e.g. Reviewed communication milestone timeline. Fine motor skills remain age-appropriate..."
                required
                className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Follow-up Recommendations for Parent (Optional)
              </label>
              <input
                type="text"
                value={newRecommendation}
                onChange={(e) => setNewRecommendation(e.target.value)}
                placeholder="e.g. Schedule face-to-face evaluation in 3 weeks, practice daily interactive reading"
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSubmittingNote || !newNote.trim()}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmittingNote ? 'Saving Note...' : 'Record Doctor Note'}
              </button>
            </div>
          </form>
        )}

        {/* Existing Doctor Notes List */}
        {doctor_notes.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
            No clinical observation notes have been added yet. Notes added by the connected doctor will appear here.
          </div>
        ) : (
          <div className="space-y-3">
            {doctor_notes.map((n) => (
              <div
                key={n.id}
                className="bg-slate-50/80 rounded-2xl p-4.5 border border-slate-200 space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs border-b border-slate-200/80 pb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-teal-600" />
                    <span className="font-bold text-slate-900">{n.doctor_name}</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{n.note}</p>
                {n.recommendations && (
                  <div className="pt-1 text-xs">
                    <strong className="text-slate-900 font-bold block mb-0.5">Recommendations:</strong>
                    <p className="text-teal-800 bg-teal-50/70 p-2.5 rounded-xl border border-teal-200/60 leading-relaxed">
                      {n.recommendations}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
