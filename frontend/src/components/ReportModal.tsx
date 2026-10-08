import React from 'react';
import { Child, Screening } from '../types';
import { Printer, X, ShieldAlert, Activity } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  screening: Screening;
  child: Child;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  screening,
  child,
}) => {
  if (!isOpen) return null;

  const dateFormatted = new Date(screening.created_at).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Actions Bar */}
        <div className="no-print p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">Official Pre-screening Report Preview</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Report Document */}
        <div className="p-8 sm:p-10 overflow-y-auto space-y-6 bg-white text-slate-900 print:p-0">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
            <div>
              <div className="flex items-center gap-2 text-teal-700 font-extrabold text-2xl tracking-tight">
                <Activity className="w-6 h-6 stroke-[2.5]" />
                <span>PediPulse</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Child Developmental Pre-Screening Document</p>
            </div>
            <div className="text-right text-xs text-slate-600">
              <p><strong className="text-slate-900">Screening ID:</strong> {screening.id.substring(0, 14)}</p>
              <p><strong className="text-slate-900">Date:</strong> {dateFormatted}</p>
            </div>
          </div>

          {/* Child Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 uppercase font-bold text-[10px] block">Child Name</span>
              <span className="font-bold text-slate-900 text-sm">{child.name}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-bold text-[10px] block">Date of Birth</span>
              <span className="font-semibold text-slate-700">{child.dob}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-bold text-[10px] block">Gender</span>
              <span className="font-semibold text-slate-700">{child.gender}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-bold text-[10px] block">Location</span>
              <span className="font-semibold text-slate-700">{child.location}</span>
            </div>
          </div>

          {/* Overall Screening Status */}
          <div className="p-5 rounded-2xl bg-teal-50 border border-teal-200">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 block mb-1">
              Overall Screening Result
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xl font-extrabold text-slate-900">{screening.risk_level}</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-600 text-white">
                Score: {screening.overall_score} pts
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {screening.risk_level === 'Professional Assessment Recommended'
                ? 'Responses indicate that a clinical review with a developmental pediatrician or therapist is recommended to follow up on emergent milestones.'
                : screening.risk_level === 'Monitor'
                ? 'Some emergent milestones warrant ongoing routine monitoring and playful parent-child engagement.'
                : 'Current responses align with expected developmental progress across primary domains.'}
            </p>
          </div>

          {/* Domain Breakdown Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Domain Milestone Breakdown
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Developmental Domain</th>
                    <th className="py-2.5 px-4">Milestone Status</th>
                    <th className="py-2.5 px-4 text-right">Domain Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(screening.domain_scores || {}).map(([domain, score]) => (
                    <tr key={domain} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{domain}</td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            score.status === 'Age Appropriate'
                              ? 'bg-emerald-100 text-emerald-800'
                              : score.status === 'Monitor'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {score.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-medium text-slate-600">
                        {score.score} / {score.max} pts ({score.percentage}%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Next Steps Recommendation */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <strong className="text-slate-900 block font-bold">Recommended Next Step:</strong>
            <p className="text-slate-600 leading-relaxed">
              Present this pre-screening summary to your healthcare practitioner during the child's next clinic or well-child evaluation. Focus on shared activities that nurture communication and engagement.
            </p>
          </div>

          {/* Non-Diagnostic Disclaimer */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong>Medical Disclaimer: </strong>
              This report summarizes a developmental pre-screening and is NOT a medical diagnosis. It does not confirm or rule out neurodevelopmental conditions. Formal evaluation must be conducted by qualified medical professionals.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};

