import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { ScreeningQuestion, AnswerChoice } from '../types';
import { QuestionSkeleton } from '../components/LoadingSkeleton';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Check,
  Info,
} from 'lucide-react';

export const ScreeningPage: React.FC = () => {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();

  const [childInfo, setChildInfo] = useState<{
    id: string;
    name: string;
    dob: string;
    age_months: number;
    age_display: string;
  } | null>(null);

  const [questions, setQuestions] = useState<ScreeningQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerChoice>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadQuestions() {
      if (!childId) return;
      setIsLoading(true);
      try {
        const data = await api.getScreeningQuestions(childId);
        setChildInfo(data.child);
        setQuestions(data.questions);
      } catch (err: any) {
        setError(err.message || 'Unable to load questionnaire for this child.');
      } finally {
        setIsLoading(false);
      }
    }
    loadQuestions();
  }, [childId]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
        <QuestionSkeleton />
      </div>
    );
  }

  if (error || !childInfo || questions.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 px-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Unable to load questionnaire</h2>
        <p className="text-xs text-slate-500">{error || 'No questions available for this age band.'}</p>
        <Link
          to={`/children/${childId}`}
          className="inline-block px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs"
        >
          Return to Child Profile
        </Link>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const currentAnswer = answers[currentQuestion.id];
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);
  const isLastQuestion = currentIndex === totalQuestions - 1;

  const handleSelectAnswer = (choice: AnswerChoice) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: choice,
    }));
  };

  const handleNext = () => {
    if (!currentAnswer) return;
    if (isLastQuestion) {
      setIsConfirmModalOpen(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsConfirmModalOpen(false);
    setIsSubmitting(true);
    setError(null);

    try {
      const answersArray = Object.entries(answers).map(([question_id, answer]) => ({
        question_id,
        answer,
      }));

      const res = await api.submitScreening({
        childId: childInfo.id,
        answers: answersArray,
      });

      // Navigate directly to the computed result page
      navigate(`/screening/${res.screening_id}/result`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit screening. Please try again.');
      setIsSubmitting(false);
    }
  };

  const options: { label: string; value: AnswerChoice; desc: string }[] = [
    { label: 'Yes', value: 'yes', desc: 'Child does this consistently or has mastered this skill' },
    { label: 'Sometimes', value: 'sometimes', desc: 'Child does this occasionally or is just beginning' },
    { label: 'Not yet', value: 'not_yet', desc: 'Child has not started doing this milestone yet' },
    { label: 'Unsure', value: 'unsure', desc: 'Have not observed or not certain' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Breadcrumb & Child Header */}
      <div className="flex items-center justify-between">
        <Link
          to={`/children/${childInfo.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {childInfo.name}
        </Link>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-800">{childInfo.name}</span>
          <span className="text-slate-400">•</span>
          <span className="text-teal-700 font-semibold">{childInfo.age_display}</span>
        </div>
      </div>

      {/* Questionnaire Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8">
        {/* Progress Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wider">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <span className="font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              {progressPercent}% Complete
            </span>
          </div>

          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-teal-600 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Question Content */}
        <div className="space-y-4">
          <div className="inline-block px-3 py-1 rounded-xl bg-teal-50 text-teal-800 text-[11px] font-bold uppercase tracking-wider border border-teal-200/80">
            {currentQuestion.domain}
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
            {currentQuestion.question}
          </h2>
        </div>

        {/* Option Selection Radio Tiles */}
        <div className="space-y-3">
          {options.map((opt) => {
            const isSelected = currentAnswer === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelectAnswer(opt.value)}
                className={`w-full p-4 sm:p-4.5 rounded-2xl text-left border transition flex items-center justify-between gap-4 ${
                  isSelected
                    ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm sm:text-base font-bold ${
                        isSelected ? 'text-teal-950' : 'text-slate-800'
                      }`}
                    >
                      {opt.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-normal">{opt.desc}</p>
                </div>

                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                    isSelected ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentIndex === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={!currentAnswer || isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md shadow-teal-600/20"
          >
            {isLastQuestion ? 'Complete Screening' : 'Next Question'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Safety Notice Footer */}
      <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
        <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-800">Pre-screening Notice: </strong>
          This questionnaire is intended for developmental pre-screening and does not provide a medical diagnosis. Milestone variations are normal in early childhood.
        </div>
      </div>

      {/* Confirmation Modal Before Submission */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto border border-teal-100">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900">Submit Developmental Screening?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                All {totalQuestions} questions for <strong>{childInfo.name}</strong> have been answered. The system will compute the deterministic milestone scores and prepare your summary.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
              <Info className="w-4 h-4 text-teal-600 shrink-0" />
              <span>You will be able to view domain breakdowns, AI explanation, and specialist recommendations.</span>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Review Answers
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition shadow-sm"
              >
                {isSubmitting ? 'Calculating...' : 'Yes, Compute Results'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

