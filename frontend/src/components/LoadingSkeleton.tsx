import React from 'react';

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-slate-200 rounded-xl" />
            <div className="w-20 h-5 bg-slate-200 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="w-3/4 h-5 bg-slate-200 rounded" />
            <div className="w-1/2 h-4 bg-slate-100 rounded" />
          </div>
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="w-full h-3 bg-slate-100 rounded" />
            <div className="w-5/6 h-3 bg-slate-100 rounded" />
          </div>
          <div className="w-full h-10 bg-slate-100 rounded-xl" />
        </div>
      ))}
    </div>
  );
};

export const QuestionSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm animate-pulse space-y-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="w-24 h-4 bg-slate-200 rounded" />
        <div className="w-32 h-6 bg-slate-200 rounded-full" />
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full" />
      <div className="space-y-3 py-4">
        <div className="w-3/4 h-6 bg-slate-200 rounded" />
        <div className="w-1/2 h-4 bg-slate-100 rounded" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="w-full h-14 bg-slate-100 rounded-xl border border-slate-200" />
        ))}
      </div>
    </div>
  );
};

