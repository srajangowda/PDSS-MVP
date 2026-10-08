import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Referral } from '../types';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import {
  ClipboardList,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  User,
  ArrowRight,
  Filter,
  Check,
  X,
  FileText,
} from 'lucide-react';

export const ReferralsPage: React.FC = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeReferral, setActiveReferral] = useState<Referral | null>(null);

  const fetchReferrals = async () => {
    setIsLoading(true);
    try {
      const data = await api.getReferrals();
      setReferrals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const filtered = referrals.filter((r) => {
    if (selectedStatus === 'all') return true;
    return r.status.toLowerCase() === selectedStatus.toLowerCase();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Referral Pipeline</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Track specialist appointments and developmental consultations
          </p>
        </div>
        <Link
          to="/specialists"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition shadow-sm w-fit"
        >
          <Stethoscope className="w-4 h-4" />
          Find Specialist / Camp
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 text-xs">
        {['all', 'Requested', 'Confirmed', 'Completed', 'Cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition capitalize ${
              selectedStatus === status
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Referral Cards */}
      {isLoading ? (
        <CardSkeleton count={2} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No referrals found"
          description={
            selectedStatus !== 'all'
              ? `No referral requests currently marked as "${selectedStatus}".`
              : 'You have not submitted any specialist referral requests yet.'
          }
          actionText="Browse Specialists"
          onAction={() => (window.location.href = '/specialists')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((ref) => {
            const appointmentDate = ref.availability?.date || 'To be scheduled';
            const appointmentTime = ref.availability?.start_time || 'Morning';

            return (
              <div
                key={ref.id}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Referral ID: {ref.id.substring(0, 10)}
                      </span>
                      <h3 className="text-lg font-extrabold text-slate-900">{ref.child?.name || 'Child'}</h3>
                      <p className="text-xs text-slate-500">{ref.child?.location}</p>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        ref.status === 'Confirmed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : ref.status === 'Completed'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : ref.status === 'Cancelled'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {ref.status}
                    </span>
                  </div>

                  {/* Specialist Detail */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-teal-600" />
                      <strong className="text-slate-900">{ref.specialist?.name || 'Pediatric Consultant'}</strong>
                    </div>
                    <div className="text-slate-500 pl-6">
                      {ref.specialist?.specialization} • {ref.specialist?.location}
                    </div>
                    <div className="flex items-center gap-4 text-slate-600 pl-6 pt-1 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {appointmentDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {appointmentTime}
                      </span>
                    </div>
                  </div>

                  {ref.notes && (
                    <div className="text-xs text-slate-600 italic bg-amber-50/40 p-3 rounded-xl border border-amber-100">
                      "{ref.notes}"
                    </div>
                  )}

                  {/* Pipeline Stepper (Section 16 Specification) */}
                  <div className="pt-2 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Referral Progress Pipeline
                    </span>
                    <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-bold">
                      {/* Step 1: Screening */}
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <div className="flex items-center justify-center mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <span>Screening</span>
                      </div>

                      {/* Step 2: Referral */}
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <div className="flex items-center justify-center mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <span>Referral</span>
                      </div>

                      {/* Step 3: Appointment */}
                      <div
                        className={`p-2 rounded-xl border ${
                          ref.status === 'Confirmed' || ref.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-center mb-1">
                          {ref.status === 'Confirmed' || ref.status === 'Completed' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <span>Appt</span>
                      </div>

                      {/* Step 4: Assessment */}
                      <div
                        className={`p-2 rounded-xl border ${
                          ref.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-center mb-1">
                          {ref.status === 'Completed' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <span>Assess</span>
                      </div>

                      {/* Step 5: Follow-up */}
                      <div className="p-2 rounded-xl bg-slate-50 text-slate-400 border border-slate-200">
                        <div className="flex items-center justify-center mb-1">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                        <span>Follow-up</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={`/screening/${ref.screening_id}/result`}
                    className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1"
                  >
                    View Pre-screening Result →
                  </Link>
                  <button
                    onClick={() => setActiveReferral(ref)}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                  >
                    Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {activeReferral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Referral Details</h3>
              <button
                onClick={() => setActiveReferral(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Child</span>
                <div className="font-bold text-slate-900 text-sm">{activeReferral.child?.name}</div>
                <div className="text-slate-500">
                  Guardian: {activeReferral.child?.guardian_name} ({activeReferral.child?.guardian_phone})
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Specialist / Camp</span>
                <div className="font-bold text-slate-900 text-sm">{activeReferral.specialist?.name}</div>
                <div className="text-slate-500">{activeReferral.specialist?.specialization}</div>
                <div className="text-teal-700 font-semibold pt-1">
                  Slot: {activeReferral.availability?.date || 'Scheduled'} ({activeReferral.availability?.start_time || 'TBD'})
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Referral Status</span>
                <div className="font-bold text-teal-800 text-sm">{activeReferral.status}</div>
                {activeReferral.notes && <div className="text-slate-600 italic">"{activeReferral.notes}"</div>}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveReferral(null)}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

