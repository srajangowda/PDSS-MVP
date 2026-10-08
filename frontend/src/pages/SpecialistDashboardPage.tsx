import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Referral, Screening } from '../types';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import {
  Stethoscope,
  ClipboardList,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Check,
  X,
  ShieldCheck,
  Activity,
  AlertCircle,
} from 'lucide-react';

export const SpecialistDashboardPage: React.FC = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [screenings, setScreenings] = useState<Record<string, Screening>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchSpecialistData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getReferrals();
      setReferrals(data);

      // Fetch corresponding screenings
      const scrMap: Record<string, Screening> = {};
      for (const r of data) {
        try {
          const res = await api.getScreeningResult(r.screening_id);
          scrMap[r.screening_id] = res.screening;
        } catch {
          // ignore
        }
      }
      setScreenings(scrMap);
    } catch (err) {
      console.error('Failed to load specialist referrals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecialistData();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: Referral['status']) => {
    try {
      await api.updateReferralStatus(id, newStatus);
      setActionSuccess(`Referral marked as ${newStatus}`);
      await fetchSpecialistData();
      if (selectedReferral?.id === id) {
        setSelectedReferral(null);
      }
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update referral');
    }
  };

  const pendingReferrals = referrals.filter((r) => r.status === 'Requested');
  const confirmedReferrals = referrals.filter((r) => r.status === 'Confirmed');
  const completedReferrals = referrals.filter((r) => r.status === 'Completed');

  function calculateAge(dobStr?: string): string {
    if (!dobStr) return '3 years';
    const dob = new Date(dobStr);
    const now = new Date();
    let months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
    if (now.getDate() < dob.getDate()) {
      months -= 1;
    }
    const years = Math.floor(months / 12);
    const remMonths = months % 12;
    return years > 0 ? `${years} years ${remMonths} months` : `${months} months`;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full w-fit border border-teal-200/60 mb-1">
            <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
            Specialist Clinical Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Specialist Consultation Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Review pediatric pre-screening summaries, accept community referrals, and coordinate consultations
          </p>
        </div>

        {/* Privacy badge */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs w-fit">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>PII Protected & Minimal Disclosure</span>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* KPI Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Review</span>
          <div className="text-2xl font-black text-amber-600">{pendingReferrals.length}</div>
          <p className="text-[11px] text-slate-500">Awaiting acceptance</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Confirmed</span>
          <div className="text-2xl font-black text-emerald-600">{confirmedReferrals.length}</div>
          <p className="text-[11px] text-slate-500">Scheduled appointments</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed</span>
          <div className="text-2xl font-black text-blue-600">{completedReferrals.length}</div>
          <p className="text-[11px] text-slate-500">Assessments finished</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Pipeline</span>
          <div className="text-2xl font-black text-slate-900">{referrals.length}</div>
          <p className="text-[11px] text-slate-500">Cumulative patients</p>
        </div>
      </div>

      {/* Pending Referrals Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Pending Referral Requests</h2>
          <p className="text-xs text-slate-500">Action items requiring clinical acceptance</p>
        </div>

        {isLoading ? (
          <CardSkeleton count={2} />
        ) : pendingReferrals.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500">
            No pending referrals awaiting review. All current requests have been processed.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingReferrals.map((ref) => {
              const scr = screenings[ref.screening_id];
              const childAge = calculateAge(ref.child?.dob);

              // Extract domain areas of concern
              const concernDomains: string[] = [];
              if (scr?.domain_scores) {
                for (const [dom, sc] of Object.entries(scr.domain_scores)) {
                  if (sc.status !== 'Age Appropriate') {
                    concernDomains.push(dom);
                  }
                }
              }

              return (
                <div
                  key={ref.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">Child: {ref.child?.name || 'Child'}</h3>
                        <p className="text-xs text-slate-500">Age: {childAge}</p>
                      </div>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        Requested
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pre-screening:</span>
                        <span className="font-bold text-slate-900">
                          {scr ? scr.risk_level : 'Screening Completed'}
                        </span>
                      </div>
                      <div className="space-y-1 pt-1 border-t border-slate-200/60">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Target Focus Areas:</span>
                        <div className="flex flex-wrap gap-1">
                          {concernDomains.length > 0 ? (
                            concernDomains.map((dom) => (
                              <span key={dom} className="text-[10px] font-semibold bg-amber-100/70 text-amber-900 px-2 py-0.5 rounded-md">
                                {dom}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-500">Baseline review</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {ref.notes && (
                      <p className="text-xs text-slate-600 line-clamp-2 italic">
                        "{ref.notes}"
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedReferral(ref)}
                      className="w-full py-2 px-3 text-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Screening Summary
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateStatus(ref.id, 'Confirmed')}
                        className="flex-1 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition shadow-2xs flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Accept Referral
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(ref.id, 'Cancelled')}
                        className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmed / Scheduled Consultations Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Confirmed Appointments & Follow-ups</h2>
          <p className="text-xs text-slate-500">Upcoming clinical evaluations</p>
        </div>

        {confirmedReferrals.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500">
            No confirmed appointments currently scheduled.
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-5">Patient Name</th>
                    <th className="py-3 px-5">Age</th>
                    <th className="py-3 px-5">Pre-screening Status</th>
                    <th className="py-3 px-5">Slot Date</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {confirmedReferrals.map((ref) => {
                    const scr = screenings[ref.screening_id];
                    return (
                      <tr key={ref.id} className="hover:bg-slate-50/60">
                        <td className="py-3.5 px-5 font-bold text-slate-900">{ref.child?.name || 'Child'}</td>
                        <td className="py-3.5 px-5 text-slate-600">{calculateAge(ref.child?.dob)}</td>
                        <td className="py-3.5 px-5">
                          <span className="font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                            {scr ? scr.risk_level : 'Assessment Recommended'}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-slate-700 font-medium">
                          {ref.availability?.date || 'To be scheduled'} ({ref.availability?.start_time || 'AM'})
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full text-[10px]">
                            Confirmed
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right space-x-2">
                          <button
                            onClick={() => setSelectedReferral(ref)}
                            className="px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg font-semibold"
                          >
                            Summary
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(ref.id, 'Completed')}
                            className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold"
                          >
                            Mark Completed
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Specialist Screening Summary Modal */}
      {selectedReferral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Pre-Screening Clinical Summary</h3>
                <p className="text-xs text-slate-500">Non-identifying milestone observations</p>
              </div>
              <button
                onClick={() => setSelectedReferral(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Patient Initials</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedReferral.child?.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Age</span>
                  <span className="font-semibold text-slate-700">{calculateAge(selectedReferral.child?.dob)}</span>
                </div>
              </div>

              {screenings[selectedReferral.screening_id] && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Domain Milestones</span>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(screenings[selectedReferral.screening_id].domain_scores || {}).map(
                      ([dom, sc]) => (
                        <div key={dom} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <span className="font-bold text-slate-800 block text-[11px]">{dom}</span>
                          <span
                            className={`text-[10px] font-semibold ${
                              sc.status === 'Age Appropriate'
                                ? 'text-emerald-700'
                                : sc.status === 'Monitor'
                                ? 'text-amber-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {sc.status} ({sc.percentage}%)
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {selectedReferral.notes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                  <span className="font-bold block text-[10px] uppercase text-amber-800">Referral Observations</span>
                  <p className="mt-0.5">{selectedReferral.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedReferral(null)}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

