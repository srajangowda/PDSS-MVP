import React from 'react';
import { ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-10 pb-8 mt-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Safety Disclaimer Banner */}
        <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/80 mb-8 flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            <strong className="text-white block font-semibold mb-0.5">Clinical Pre-screening & Non-Diagnostic Notice:</strong>
            PediPulse is an educational pre-screening and referral coordination platform. It does not diagnose medical or developmental conditions, nor provide medical treatment plans. Always consult a qualified pediatrician or developmental specialist for formal diagnostic evaluations.
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4 pt-4 border-t border-slate-800">
          <p>© {new Date().getFullYear()} PediPulse Platform. Designed for underserved communities & frontline child healthcare.</p>
          <div className="flex items-center gap-6">
            <span>Privacy & Confidentiality Protected</span>
            <span className="flex items-center gap-1">Built with care for 0–5 year olds <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" /></span>
          </div>
        </div>
      </div>
    </footer>
  );
};

