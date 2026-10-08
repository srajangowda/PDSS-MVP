import React from 'react';
import { AIExplanation } from '../types';
import { Sparkles, X, CheckCircle2, AlertCircle, HelpCircle, ShieldCheck, Printer } from 'lucide-react';

interface AIExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  explanation: AIExplanation | null;
  isLoading: boolean;
  childName?: string;
}

export const AIExplanationModal: React.FC<AIExplanationModalProps> = ({
  isOpen,
  onClose,
  explanation,
  isLoading,
  childName = 'Child',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-teal-50 via-teal-100/50 to-emerald-50 border-b border-teal-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">AI Educational Explanation</h3>
              <p className="text-xs text-teal-800 font-medium">Simplified developmental milestone review for {childName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-white/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {isLoading ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Analyzing screening milestone observations...</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Consulting server-side pediatric developmental guidelines to produce clear, non-diagnostic family insights.
              </p>
            </div>
          ) : explanation ? (
            <>
              {/* Summary */}
              <div className="bg-teal-50/70 border border-teal-200/80 rounded-2xl p-4 sm:p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-800 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  Parent-Friendly Summary
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed font-normal">
                  {explanation.summary}
                </p>
              </div>

              {/* Areas of Attention */}
              {explanation.areas_of_attention && explanation.areas_of_attention.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Areas to Discuss or Observe
                  </h4>
                  <div className="space-y-2">
                    {explanation.areas_of_attention.map((area, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 leading-relaxed flex items-start gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span>{area}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Next Steps */}
              {explanation.recommended_next_steps && explanation.recommended_next_steps.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Suggested Next Steps
                  </h4>
                  <div className="space-y-2">
                    {explanation.recommended_next_steps.map((step, idx) => (
                      <div key={idx} className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl text-xs sm:text-sm text-slate-700 leading-relaxed flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Questions for Doctor */}
              {explanation.questions_for_doctor && explanation.questions_for_doctor.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-teal-600" />
                    Helpful Questions to Ask Your Doctor
                  </h4>
                  <div className="space-y-2">
                    {explanation.questions_for_doctor.map((q, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 italic flex items-start gap-2.5">
                        <span className="font-bold text-teal-600 not-italic shrink-0">Q{idx + 1}:</span>
                        <span>"{q}"</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Safety Notice */}
              <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong className="text-slate-800">Safety Notice: </strong>
                  {explanation.disclaimer || 'This AI-assisted explanation is for educational purposes only and does not constitute a medical diagnosis or clinical advice. Please consult a qualified healthcare professional.'}
                </p>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-500 text-sm">
              Unable to load explanation. Please try again.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Summary
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
          >
            Close Explanation
          </button>
        </div>
      </div>
    </div>
  );
};

