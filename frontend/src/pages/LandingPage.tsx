import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  Sparkles,
  MapPin,
  Calendar,
  AlertCircle,
  Stethoscope,
  HeartHandshake,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user, loginWithDemo } = useAuth();
  const navigate = useNavigate();

  const handleDemoAccess = async (role: 'parent' | 'health_worker' | 'specialist') => {
    await loginWithDemo(role);
    if (role === 'specialist') {
      navigate('/specialist/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative pt-12 md:pt-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-bold uppercase tracking-wider shadow-sm">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>
            Early Intervention for Ages 0–5
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Identify developmental concerns <span className="text-teal-600">earlier</span>.
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            AI-assisted developmental pre-screening and referral support for children aged 0–5, empowering families and frontline health workers in underserved communities.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to={user ? '/dashboard' : '/register'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition shadow-lg shadow-teal-600/25 group"
            >
              Start Screening
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition"
            >
              How PediPulse Works
            </a>
          </div>

          {/* Instant Judge / Demo Quick Bar */}
          <div className="pt-8 max-w-2xl mx-auto">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl p-4 sm:p-5 text-left shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  Hackathon Evaluation — 1-Click Demo Personas
                </span>
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full">
                  No signup required
                </span>
              </div>
              <p className="text-xs text-amber-800/90 mb-3">
                Instantly explore the end-to-end workflow with pre-seeded children, questionnaires, and specialists:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => handleDemoAccess('parent')}
                  className="px-3 py-2 bg-white hover:bg-teal-50 border border-amber-200 hover:border-teal-300 rounded-xl text-xs font-bold text-slate-800 hover:text-teal-900 transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Users className="w-3.5 h-3.5 text-teal-600" />
                  Try Demo Parent
                </button>
                <button
                  onClick={() => handleDemoAccess('health_worker')}
                  className="px-3 py-2 bg-white hover:bg-teal-50 border border-amber-200 hover:border-teal-300 rounded-xl text-xs font-bold text-slate-800 hover:text-teal-900 transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <HeartHandshake className="w-3.5 h-3.5 text-teal-600" />
                  Try Health Worker
                </button>
                <button
                  onClick={() => handleDemoAccess('specialist')}
                  className="px-3 py-2 bg-white hover:bg-teal-50 border border-amber-200 hover:border-teal-300 rounded-xl text-xs font-bold text-slate-800 hover:text-teal-900 transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                  Try Specialist
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 lg:p-16 border border-slate-800 relative overflow-hidden">
          <div className="max-w-3xl space-y-4">
            <span className="text-teal-400 font-bold text-xs uppercase tracking-wider">The Rural & Semi-Urban Healthcare Gap</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Why early developmental milestones get missed
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              In underserved and lower-income regions, developmental pediatricians, speech pathologists, and child therapists are concentrated in tier-1 metro hospitals. Families often wait until age 6 or school admission before identifying developmental delays.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-10">
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">1</div>
              <h3 className="font-bold text-sm text-white">Specialist Concentration</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                90% of specialized pediatricians are located in major cities, leaving rural parents without direct access.
              </p>
            </div>
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">2</div>
              <h3 className="font-bold text-sm text-white">Lost Critical Window</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                85% of brain architecture is formed by age 3. Missing early signs delays crucial neuroplasticity interventions.
              </p>
            </div>
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">3</div>
              <h3 className="font-bold text-sm text-white">Complex Clinical Jargon</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Parents get anxious and confused by clinical paperwork without plain-language explanations.
              </p>
            </div>
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">4</div>
              <h3 className="font-bold text-sm text-white">Frontline Support Gap</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                ASHA and Anganwadi community workers need fast, age-calibrated screening support on their phones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-teal-600 font-bold text-xs uppercase tracking-wider">The PediPulse Core Loop</span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            How It Works in 4 Simple Steps
          </h2>
          <p className="text-slate-600 text-sm">
            Designed for non-clinical parents and community health workers to screen and refer with confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-teal-300 transition">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-lg border border-teal-100">
              01
            </div>
            <h3 className="text-base font-bold text-slate-900">1. Create Child Profile</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Enter name and date of birth. PediPulse automatically computes exact age in months to select the precise developmental milestone checklist.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-teal-300 transition">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-lg border border-teal-100">
              02
            </div>
            <h3 className="text-base font-bold text-slate-900">2. Complete Screening</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Answer intuitive, non-jargon questions across 6 core domains: Communication, Gross Motor, Fine Motor, Cognitive, Social, and Adaptive skills.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-teal-300 transition">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-lg border border-teal-100">
              03
            </div>
            <h3 className="text-base font-bold text-slate-900">3. Understand Results</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Deterministic scoring calculates domain risk levels. AI provides educational explanations in reassuring, non-diagnostic everyday language.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-teal-300 transition">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-lg border border-teal-100">
              04
            </div>
            <h3 className="text-base font-bold text-slate-900">4. Connect to Care</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Find verified local pediatricians, therapists, or community outreach screening camps. Request referrals and monitor follow-up reminders.
            </p>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-teal-600 font-bold text-xs uppercase tracking-wider">Features</span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Built for Real-World Community Impact
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex gap-5">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
              <Activity className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900">Deterministic Screening Engine</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                No LLM hallucinations on clinical scores. Pre-screening calculations are calculated strictly with deterministic scoring formulas and configurable clinical thresholds.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex gap-5">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900">AI Educational Guidance</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Translates complex milestone metrics into empathetic parental guidance, including tailored home play tips and specific questions to ask their doctor.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex gap-5">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900">Specialist & Camp Directory</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Connect directly with developmental pediatricians, speech therapists, occupational therapists, and free community outreach screening camps in towns and rural taluks.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex gap-5">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900">Complete Follow-up Loop</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Tracks referrals from initial request to appointment confirmation, consultation, and scheduled developmental follow-up check-ins.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Policy Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-teal-100/40 rounded-3xl p-8 border border-teal-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Our Clinical Safety Commitment</h2>
          <p className="text-sm text-slate-700 leading-relaxed max-w-2xl mx-auto">
            "PediPulse is an educational pre-screening and referral support tool, not a diagnostic system. We never label children with clinical diagnoses or replace specialized medical evaluations."
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-900 bg-white/80 px-3 py-1.5 rounded-full border border-teal-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              Non-alarming language
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-900 bg-white/80 px-3 py-1.5 rounded-full border border-teal-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              Deterministic scoring logic
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-900 bg-white/80 px-3 py-1.5 rounded-full border border-teal-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              Doctor questions generator
            </span>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="text-center space-y-4 max-w-xl mx-auto px-4">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Ready to start a pre-screening?</h2>
        <p className="text-sm text-slate-600">
          Takes under 5 minutes. Support early milestones and connect with local care.
        </p>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition shadow-lg shadow-teal-600/20"
        >
          Start a Screening Now
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
};

