import { AnswerChoice, DomainScore, DomainStatus, RiskLevel, ScreeningAnswer, ScreeningDomain, ScreeningQuestion } from '../types/index.js';

export interface ThresholdConfig {
  domainAppropriateCutoff: number; // e.g. 80%
  domainMonitorCutoff: number;     // e.g. 50%
  maxMonitorDomainsForLowConcern: number; // e.g. 0
}

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  domainAppropriateCutoff: 80,
  domainMonitorCutoff: 50,
  maxMonitorDomainsForLowConcern: 0,
};

export function scoreAnswer(answer: AnswerChoice): number {
  switch (answer) {
    case 'yes':
      return 10;
    case 'sometimes':
      return 5;
    case 'not_yet':
      return 0;
    case 'unsure':
      return 0; // Conservative scoring to recommend monitoring if parent is unsure
    default:
      return 0;
  }
}

export interface ScreeningComputationResult {
  overall_score: number;
  risk_level: RiskLevel;
  domain_scores: Record<string, DomainScore>;
  total_answered: number;
  total_max_score: number;
  interpretation: string;
  recommended_next_step: string;
}

export function computeScreeningResults(
  questions: ScreeningQuestion[],
  answers: { question_id: string; answer: AnswerChoice }[],
  thresholds: ThresholdConfig = DEFAULT_THRESHOLDS
): ScreeningComputationResult {
  const questionMap = new Map<string, ScreeningQuestion>();
  for (const q of questions) {
    questionMap.set(q.id, q);
  }

  const domainAggregates: Record<
    string,
    { score: number; max: number; count: number }
  > = {};

  let totalScore = 0;
  let totalMaxScore = 0;
  let totalAnswered = 0;

  for (const item of answers) {
    const q = questionMap.get(item.question_id);
    if (!q) continue;

    const domain = q.domain;
    if (!domainAggregates[domain]) {
      domainAggregates[domain] = { score: 0, max: 0, count: 0 };
    }

    const earned = scoreAnswer(item.answer);
    domainAggregates[domain].score += earned;
    domainAggregates[domain].max += 10;
    domainAggregates[domain].count += 1;

    totalScore += earned;
    totalMaxScore += 10;
    totalAnswered += 1;
  }

  const domain_scores: Record<string, DomainScore> = {};
  let concernCount = 0;
  let monitorCount = 0;

  for (const [domain, agg] of Object.entries(domainAggregates)) {
    const percentage = agg.max > 0 ? Math.round((agg.score / agg.max) * 100) : 100;
    let status: DomainStatus = 'Age Appropriate';

    if (percentage < thresholds.domainMonitorCutoff) {
      status = 'Possible Concern';
      concernCount += 1;
    } else if (percentage < thresholds.domainAppropriateCutoff) {
      status = 'Monitor';
      monitorCount += 1;
    } else {
      status = 'Age Appropriate';
    }

    domain_scores[domain] = {
      score: agg.score,
      max: agg.max,
      percentage,
      status,
      questions_answered: agg.count,
    };
  }

  let risk_level: RiskLevel = 'Low Concern';
  let interpretation = 'Current responses do not indicate a major concern in this screening.';
  let recommended_next_step = 'Continue routine developmental tracking and age-appropriate play activities.';

  if (concernCount >= 1 || monitorCount >= 2) {
    risk_level = 'Professional Assessment Recommended';
    interpretation = 'Some responses indicate that professional developmental assessment may be appropriate.';
    recommended_next_step = 'Consider discussing these observations with a pediatrician or developmental specialist for a comprehensive clinical assessment.';
  } else if (monitorCount === 1) {
    risk_level = 'Monitor';
    interpretation = 'Some responses may benefit from monitoring and discussion with a healthcare professional.';
    recommended_next_step = 'Repeat screening in 1 to 2 months and discuss milestone progress during your child\'s next regular health checkup.';
  }

  return {
    overall_score: totalScore,
    risk_level,
    domain_scores,
    total_answered: totalAnswered,
    total_max_score: totalMaxScore,
    interpretation,
    recommended_next_step,
  };
}

