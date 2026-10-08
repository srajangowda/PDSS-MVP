import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Child, Referral, Followup, Screening } from '../types';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import {
  Users,
  Activity,
  ClipboardList,
  Calendar,
  PlusCircle,
  Stethoscope,
  ArrowRight,
  Clock,
  Sparkles,
  Baby,
  ChevronRight,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [children, setChildren] = useState<Child[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [childLatestScreenings, setChildLatestScreenings] = useState<Record<string, Screening | null>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const [childrenData, referralsData, followupsData] = await Promise.all([
          api.getChildren(),
          api.getReferrals(),
          api.getFollowups(),
        ]);
        setChildren(childrenData);
        setReferrals(referralsData);
        setFollowups(followupsData);

        // Fetch latest screenings for each child
        const screeningMap: Record<string, Screening | null> = {};
        for (const child of childrenData) {
          try {
            const history = await api.getChildScreeningHistory(child.id);
            screeningMap[child.id] = history.length > 0 ? history[0] : null;
          } catch {
            screeningMap[child.id] = null;
          }
        }
        setChildLatestScreenings(screeningMap);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, [user]);

  function calculateChildAge(dobStr: string): string {
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const activeReferralsCount = referrals.filter((r) => r.status === 'Requested' || r.status === 'Confirmed').length;
  const pendingFollowupsCount = followups.filter((f) => f.status === 'Pending').length;

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      {/* Welcome Greeting & Quick Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full w-fit border border-teal-200/60">
            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
            {user?.role === 'health_worker' ? 'Frontline Community Health Portal' : 'Family Health Dashboard'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {getGreeting()}, {user?.name || 'Caregiver'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {user?.role === 'health_worker'
              ? 'Perform age-appropriate developmental pre-screenings and coordinate referrals for community children.'
              : 'Monitor developmental milestones for your children and connect with specialists when needed.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/children?add=true"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Add Child
          </Link>
          <Link
            to="/specialists"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
          >
            <Stethoscope className="w-4 h-4 text-teal-600" />
            Find Specialist / Camp
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Children</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{children.length}</div>
          <p className="text-[11px] text-slate-400">Registered in PediPulse</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Screenings</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {Object.values(childLatestScreenings).filter(Boolean).length}
          </div>
          <p className="text-[11px] text-slate-400">Completed assessments</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Active Referrals</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{activeReferralsCount}</div>
          <p className="text-[11px] text-slate-400">Specialist consultations</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Follow-ups Due</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{pendingFollowupsCount}</div>
          <p className="text-[11px] text-slate-400">Upcoming milestone check-ins</p>
        </div>
      </div>

      {/* Children Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Children Profiles</h2>
            <p className="text-xs text-slate-500">Developmental milestones and pre-screening status</p>
          </div>
          <Link
            to="/children"
            className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            View All ({children.length})
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <CardSkeleton count={3} />
        ) : children.length === 0 ? (
          <EmptyState
            icon={Baby}
            title="No children added yet"
            description="Add your first child profile to begin age-calibrated developmental pre-screening."
            actionText="Add Child"
            onAction={() => navigate('/children?add=true')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map((child) => {
              const latestScreening = childLatestScreenings[child.id];
              const ageDisplay = calculateChildAge(child.dob);

              return (
                <div
                  key={child.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-teal-300 transition shadow-2xs flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-lg border border-teal-100">
                          {child.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-base">{child.name}</h3>
                          <p className="text-xs text-slate-500">Age: {ageDisplay}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {child.gender}
                      </span>
                    </div>

                    {/* Screening status box */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Last Screening:</span>
                        <span className="font-semibold text-slate-700">
                          {latestScreening
                            ? new Date(latestScreening.created_at).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Not yet screened'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Status:</span>
                        {latestScreening ? (
                          <span
                            className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                              latestScreening.risk_level === 'Low Concern'
                                ? 'bg-emerald-100 text-emerald-800'
                                : latestScreening.risk_level === 'Monitor'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {latestScreening.risk_level}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium italic">Pending First Check</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Child Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <Link
                      to={`/children/${child.id}`}
                      className="flex-1 py-2 px-3 text-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                    >
                      View Profile
                    </Link>
                    <Link
                      to={`/screening/${child.id}`}
                      className="flex-1 py-2 px-3 text-center rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition shadow-2xs"
                    >
                      {latestScreening ? 'Retake Screening' : 'Start Screening'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Activity & Follow-ups Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Referrals */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-teal-600" />
              Recent Referrals
            </h3>
            <Link to="/referrals" className="text-xs font-bold text-teal-600 hover:underline">
              View All
            </Link>
          </div>

          {referrals.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No active referral requests.</div>
          ) : (
            <div className="space-y-3">
              {referrals.slice(0, 3).map((ref) => (
                <div
                  key={ref.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900">{ref.child?.name || 'Child'}</div>
                    <div className="text-slate-500">
                      Specialist: {ref.specialist?.name || 'Pediatric Consultant'} ({ref.specialist?.specialization})
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                      ref.status === 'Confirmed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : ref.status === 'Completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {ref.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Follow-ups Due */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              Upcoming Follow-ups
            </h3>
            <Link to="/followups" className="text-xs font-bold text-teal-600 hover:underline">
              View All
            </Link>
          </div>

          {followups.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No scheduled follow-up milestones.</div>
          ) : (
            <div className="space-y-3">
              {followups.slice(0, 3).map((fol) => (
                <div
                  key={fol.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900">{fol.child?.name || 'Child'}</div>
                    <div className="text-slate-500 line-clamp-1">{fol.notes}</div>
                    <div className="text-[11px] font-semibold text-teal-700">Due: {fol.followup_date}</div>
                  </div>
                  <Link
                    to="/followups"
                    className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 font-bold text-xs hover:bg-teal-100 transition whitespace-nowrap"
                  >
                    {fol.status === 'Completed' ? 'Completed' : 'Review'}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

