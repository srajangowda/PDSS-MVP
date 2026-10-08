import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Child, Screening, Referral, Followup } from '../types';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { ReportModal } from '../components/ReportModal';
import {
  Baby,
  Calendar,
  MapPin,
  Phone,
  User,
  Activity,
  ClipboardList,
  Stethoscope,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Trash2,
  FileText,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const ChildDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [child, setChild] = useState<Child | null>(null);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reportScreening, setReportScreening] = useState<Screening | null>(null);

  useEffect(() => {
    async function loadChildData() {
      if (!id) return;
      setIsLoading(true);
      try {
        const [childData, history, allReferrals, allFollowups] = await Promise.all([
          api.getChild(id),
          api.getChildScreeningHistory(id),
          api.getReferrals(),
          api.getFollowups(),
        ]);
        setChild(childData);
        setScreenings(history);
        setReferrals(allReferrals.filter((r) => r.child_id === id));
        setFollowups(allFollowups.filter((f) => f.child_id === id));
      } catch (err: any) {
        setError(err.message || 'Unable to load child profile.');
      } finally {
        setIsLoading(false);
      }
    }
    loadChildData();
  }, [id]);

  function calculateChildAge(dobStr: string): string {
    const dobDate = new Date(dobStr);
    const now = new Date();
    let months = (now.getFullYear() - dobDate.getFullYear()) * 12 + (now.getMonth() - dobDate.getMonth());
    if (now.getDate() < dobDate.getDate()) {
      months -= 1;
    }
    const years = Math.floor(months / 12);
    const remMonths = months % 12;
    return years > 0 ? `${years} years ${remMonths} months` : `${months} months`;
  }

  const handleDelete = async () => {
    if (!id) return;
    try {
      await api.deleteChild(id);
      navigate('/children');
    } catch (err: any) {
      alert(err.message || 'Failed to remove child');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <CardSkeleton count={2} />
      </div>
    );
  }

  if (error || !child) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4 px-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Child profile not found</h2>
        <p className="text-xs text-slate-500">{error || 'Unable to access this child record.'}</p>
        <Link to="/children" className="inline-block px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs">
          Return to Children Directory
        </Link>
      </div>
    );
  }

  const latestScreening = screenings.length > 0 ? screenings[0] : null;
  const ageDisplay = calculateChildAge(child.dob);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-16">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-md shadow-teal-600/20 shrink-0">
            {child.name.charAt(0)}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-900">{child.name}</h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                {ageDisplay}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {child.gender}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                DOB: {child.dob}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {child.location}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Guardian: {child.guardian_name} ({child.guardian_phone})
              </span>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to={`/screening/${child.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition shadow-sm"
          >
            <Activity className="w-4 h-4" />
            Start New Screening
          </Link>
          <Link
            to="/specialists"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
          >
            <Stethoscope className="w-4 h-4 text-teal-600" />
            Find Specialist
          </Link>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
            title="Delete Child Record"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Development Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest Screening Status Card */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Latest Pre-screening Status
            </span>
            {latestScreening ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-100 space-y-1.5">
                  <span className="text-[11px] font-bold text-teal-700 uppercase">Screening Result</span>
                  <div className="text-lg font-extrabold text-slate-900">{latestScreening.risk_level}</div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Screened on{' '}
                    {new Date(latestScreening.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Screening Score</span>
                    <span className="font-bold text-slate-900">{latestScreening.overall_score} pts</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Assessment Instrument</span>
                    <span className="font-semibold text-teal-700">PediPulse 6-Domain Bank</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <p className="text-xs text-slate-500">No screenings recorded yet.</p>
                <Link
                  to={`/screening/${child.id}`}
                  className="inline-block text-xs font-bold text-teal-600 hover:underline"
                >
                  Conduct First Pre-screening →
                </Link>
              </div>
            )}
          </div>

          {latestScreening && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <Link
                to={`/screening/${latestScreening.id}/result`}
                className="w-full py-2.5 px-3 text-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition block"
              >
                View Full Screening Result
              </Link>
              <button
                onClick={() => setReportScreening(latestScreening)}
                className="w-full py-2.5 px-3 text-center rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs transition flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                Download / Print Report
              </button>
            </div>
          )}
        </div>

        {/* 6-Domain Development Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Developmental Domains Overview</h3>
            <p className="text-xs text-slate-500">Milestone observations across 6 developmental skill areas</p>
          </div>

          {latestScreening ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {Object.entries(latestScreening.domain_scores || {}).map(([domain, score]) => (
                <div
                  key={domain}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">{domain}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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

                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
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

                  <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                    <span>Performance</span>
                    <span>{score.score} / {score.max} pts ({score.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl text-xs text-slate-500">
              Domain breakdowns will be generated once you complete the first questionnaire.
            </div>
          )}
        </div>
      </div>

      {/* Milestone Journey & Timeline */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Developmental Care Timeline</h3>
          <p className="text-xs text-slate-500">End-to-end milestone journey: Screening → Referral → Appointment → Follow-up</p>
        </div>

        <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {/* Step 1: Child Registered */}
          <div className="relative flex items-start gap-4">
            <div className="absolute -left-6 mt-1 w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center ring-4 ring-white shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Child Profile Created</span>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">Registered in PediPulse</h4>
              <p className="text-xs text-slate-500">
                Child enrolled with date of birth {child.dob}. Age calibrated for screening instrument.
              </p>
            </div>
          </div>

          {/* Step 2: Screening Completed */}
          <div className="relative flex items-start gap-4">
            <div
              className={`absolute -left-6 mt-1 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white shadow-xs ${
                screenings.length > 0 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {screenings.length > 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Developmental Pre-screening</span>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                {screenings.length > 0 ? `Screening Completed (${latestScreening?.risk_level})` : 'Screening Pending'}
              </h4>
              <p className="text-xs text-slate-500">
                {screenings.length > 0
                  ? `Identified observations across 6 domains. Score: ${latestScreening?.overall_score} pts.`
                  : 'Start screening to evaluate developmental milestones.'}
              </p>
            </div>
          </div>

          {/* Step 3: Referral Requested */}
          <div className="relative flex items-start gap-4">
            <div
              className={`absolute -left-6 mt-1 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white shadow-xs ${
                referrals.length > 0 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {referrals.length > 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Specialist Referral</span>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                {referrals.length > 0 ? `Referral ${referrals[0].status}` : 'Referral Not Requested'}
              </h4>
              <p className="text-xs text-slate-500">
                {referrals.length > 0
                  ? `Connected with ${referrals[0].specialist?.name || 'Pediatric Consultant'} (${referrals[0].specialist?.specialization}).`
                  : 'Connect with a pediatric specialist or community screening camp if assessment is recommended.'}
              </p>
            </div>
          </div>

          {/* Step 4: Appointment */}
          <div className="relative flex items-start gap-4">
            <div
              className={`absolute -left-6 mt-1 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white shadow-xs ${
                referrals.some((r) => r.status === 'Confirmed' || r.status === 'Completed')
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Clinical Appointment</span>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                {referrals.some((r) => r.status === 'Confirmed')
                  ? 'Appointment Confirmed'
                  : referrals.some((r) => r.status === 'Completed')
                  ? 'Assessment Completed'
                  : 'Awaiting Specialist Confirmation'}
              </h4>
              <p className="text-xs text-slate-500">
                In-person or tele-consultation evaluation by qualified pediatric clinician.
              </p>
            </div>
          </div>

          {/* Step 5: Follow-up Check-in */}
          <div className="relative flex items-start gap-4">
            <div
              className={`absolute -left-6 mt-1 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white shadow-xs ${
                followups.some((f) => f.status === 'Completed')
                  ? 'bg-teal-600 text-white'
                  : followups.length > 0
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Follow-up Tracking</span>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                {followups.some((f) => f.status === 'Completed')
                  ? 'Follow-up Completed'
                  : followups.length > 0
                  ? `Follow-up Due: ${followups[0].followup_date}`
                  : 'Routine Follow-up'}
              </h4>
              <p className="text-xs text-slate-500">
                Periodic developmental check-in to monitor emerging milestones and intervention progress.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Delete Child Record?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to remove <strong>{child.name}</strong>? All associated screenings and referrals will be deleted.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportScreening && (
        <ReportModal
          isOpen={Boolean(reportScreening)}
          onClose={() => setReportScreening(null)}
          screening={reportScreening}
          child={child}
        />
      )}
    </div>
  );
};

