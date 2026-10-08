import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Followup } from '../types';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Check,
  X,
  Baby,
} from 'lucide-react';

export const FollowupsPage: React.FC = () => {
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

  const fetchFollowups = async () => {
    setIsLoading(true);
    try {
      const data = await api.getFollowups();
      setFollowups(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowups();
  }, []);

  const handleMarkComplete = async (id: string) => {
    try {
      await api.updateFollowupStatus(id, 'Completed');
      await fetchFollowups();
    } catch (err: any) {
      alert(err.message || 'Failed to update follow-up status');
    }
  };

  const pendingList = followups.filter((f) => f.status === 'Pending');
  const completedList = followups.filter((f) => f.status === 'Completed');
  const currentList = activeTab === 'pending' ? pendingList : completedList;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Milestone Follow-ups</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Track post-screening checks, home activity milestones, and consultation reviews
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Upcoming Follow-ups ({pendingList.length})
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
            activeTab === 'completed'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Completed ({completedList.length})
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <CardSkeleton count={2} />
      ) : currentList.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={activeTab === 'pending' ? 'No pending follow-ups' : 'No completed follow-ups yet'}
          description={
            activeTab === 'pending'
              ? 'Great! All milestone follow-ups have been addressed.'
              : 'Completed check-ins will be archived here for historical tracking.'
          }
        />
      ) : (
        <div className="space-y-4">
          {currentList.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    item.status === 'Completed'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}
                >
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-slate-900 text-base">{item.child?.name || 'Child'}</h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {item.notes || 'Routine milestone developmental follow-up check-in.'}
                  </p>

                  <div className="text-xs font-semibold text-teal-800 flex items-center gap-1.5 pt-1">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    Due Date: {item.followup_date}
                  </div>
                </div>
              </div>

              {item.status !== 'Completed' && (
                <div className="pt-2 sm:pt-0 sm:border-l sm:border-slate-100 sm:pl-6 shrink-0">
                  <button
                    onClick={() => handleMarkComplete(item.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition shadow-2xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Mark Complete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

