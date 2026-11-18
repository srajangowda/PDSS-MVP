import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../utils/config.js';
import { AIExplanation, DomainScore, RiskLevel } from '../types/index.js';

export interface ExplainScreeningInput {
  screeningId: string;
  childAge: string;
  domainResults: Record<string, DomainScore>;
  screeningCategory: RiskLevel;
  observations?: string;
}

export interface ProgressSessionData {
  id: string;
  date: string;
  age_display: string;
  overall_score: number;
  risk_level: RiskLevel;
  domain_scores: Record<string, DomainScore>;
}

export interface ProgressSummaryInput {
  childId: string;
  childAge: string;
  sessions: ProgressSessionData[];
  trends: {
    domain: string;
    previous_percentage: number;
    latest_percentage: number;
    previous_status: string;
    latest_status: string;
    trend: 'improved' | 'unchanged' | 'needs_attention';
    label: string;
    delta_percentage: number;
  }[];
}

export interface GeneratedProgressSummaryResult {
  summary_en: string;
  summary_kn: string;
  key_changes: string[];
  disclaimer: string;
}

const SYSTEM_PROMPT = `You are an educational developmental screening explanation assistant for PediPulse.
You are NOT a doctor.
Do not diagnose medical or developmental conditions.
Never state the child "has autism", "has ADHD", "has a developmental disorder", or any clinical syndrome.
Do not infer a specific diagnosis or disorder from screening answers.
Explain screening results in simple, empathetic, non-alarming language for parents.
Encourage consultation with qualified healthcare professionals (such as a pediatrician or child development specialist) when appropriate.
Do not provide emergency medical advice.
Always clearly state that screening is not diagnosis.

You must respond ONLY with valid JSON with this exact structure:
{
  "summary": "A warm, plain-language summary of what the screening suggests without any diagnostic claims.",
  "areas_of_attention": ["Area 1 description", "Area 2 description"],
  "recommended_next_steps": ["Actionable step 1", "Actionable step 2"],
  "questions_for_doctor": ["Question 1 parent can ask", "Question 2 parent can ask"],
  "disclaimer": "This AI-assisted explanation is for educational purposes only and does not constitute a medical diagnosis or clinical advice. Please consult a qualified healthcare professional for formal evaluation."
}`;

export async function generateAIExplanation(
  input: ExplainScreeningInput
): Promise<Omit<AIExplanation, 'id' | 'created_at'>> {
  // If Gemini API Key is available, attempt LLM call
  if (config.hasGemini) {
    try {
      const genAI = new GoogleGenerativeAI(config.geminiApiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const promptText = `
Screening Data:
- Child Age: ${input.childAge}
- Overall Result: ${input.screeningCategory}
- Domain Scores:
${Object.entries(input.domainResults)
  .map(
    ([domain, score]) =>
      `  * ${domain}: ${score.status} (${score.percentage}% - ${score.score}/${score.max} pts)`
  )
  .join('\n')}
${input.observations ? `- Parent Observations: ${input.observations}` : ''}

Please generate an empathetic, educational, non-diagnostic explanation in JSON format.
`;

      const result = await model.generateContent([
        { text: SYSTEM_PROMPT },
        { text: promptText },
      ]);

      const responseText = result.response.text();
      const parsed = JSON.parse(responseText);

      return {
        screening_id: input.screeningId,
        summary: parsed.summary || 'The screening provides a helpful snapshot of current developmental milestones.',
        areas_of_attention: Array.isArray(parsed.areas_of_attention) ? parsed.areas_of_attention : [],
        recommended_next_steps: Array.isArray(parsed.recommended_next_steps) ? parsed.recommended_next_steps : [],
        questions_for_doctor: Array.isArray(parsed.questions_for_doctor) ? parsed.questions_for_doctor : [],
        disclaimer:
          'This AI-assisted explanation is for educational purposes only and does not constitute a medical diagnosis or clinical advice. Please consult a qualified healthcare professional for formal evaluation.',
      };
    } catch (err: any) {
      console.warn('Gemini API call failed or quota reached, falling back to deterministic safe explanation:', err.message);
      // Fall through to deterministic fallback
    }
  }

  // Graceful deterministic educational fallback
  return getDeterministicFallbackExplanation(input);
}

export function getDeterministicFallbackExplanation(
  input: ExplainScreeningInput
): Omit<AIExplanation, 'id' | 'created_at'> {
  const attentionAreas: string[] = [];
  const doctorQuestions: string[] = [];
  const nextSteps: string[] = [];

  for (const [domain, score] of Object.entries(input.domainResults)) {
    if (score.status === 'Possible Concern') {
      attentionAreas.push(
        `${domain}: Several milestone responses suggest your child may benefit from further observation and supportive activities in this area.`
      );
      doctorQuestions.push(`What specific play routines or exercises can support my child's ${domain.toLowerCase()} skills at age ${input.childAge}?`);
    } else if (score.status === 'Monitor') {
      attentionAreas.push(
        `${domain}: Some emergent skills were noted that may be emerging at their own steady pace.`
      );
    }
  }

  if (attentionAreas.length === 0) {
    attentionAreas.push('All evaluated developmental areas show steady milestone progress for this age band.');
    doctorQuestions.push('Are there upcoming developmental milestones I should watch for over the next 6 months?');
  }

  if (input.screeningCategory === 'Professional Assessment Recommended') {
    nextSteps.push('Schedule an in-person appointment with a pediatrician or developmental specialist to share these screening findings.');
    nextSteps.push('Keep a written log of daily observations, noticing what tasks your child enjoys and where they ask for support.');
    nextSteps.push('Engage in positive interactive play without feeling rushed or anxious; milestones develop on varied timelines.');
    doctorQuestions.push('Would you recommend a formal developmental assessment or hearing/vision check at this stage?');
  } else if (input.screeningCategory === 'Monitor') {
    nextSteps.push('Practice daily interactive activities such as storytelling, responsive chatter, and outdoor active movement.');
    nextSteps.push('Repeat this developmental pre-screening in approximately 6 to 8 weeks to track progress.');
    nextSteps.push('Discuss milestone observations during your child\'s next routine immunization or wellness visit.');
    doctorQuestions.push('What milestone benchmarks are most helpful to observe over the coming weeks?');
  } else {
    nextSteps.push('Continue rich everyday play, conversation, reading, and physical exploration.');
    nextSteps.push('Complete the next screening checklist when your child transitions into the next age milestone.');
    doctorQuestions.push('What nutritional and play activities best support general wellness and development right now?');
  }

  const summary =
    input.screeningCategory === 'Professional Assessment Recommended'
      ? `Based on responses for ${input.childAge}, there are specific areas where extra guidance from a pediatric healthcare provider can be very beneficial. This screening is an early checkpoint to support your child, not a medical conclusion.`
      : input.screeningCategory === 'Monitor'
      ? `Your child is showing steady development across several areas for ${input.childAge}, with a few skills that are still blossoming. Continued observation and playful interaction are recommended.`
      : `Your child's responses reflect age-appropriate progress across primary developmental domains for ${input.childAge}. Keep nurturing their learning through daily play and bonding.`;

  return {
    screening_id: input.screeningId,
    summary,
    areas_of_attention: attentionAreas,
    recommended_next_steps: nextSteps,
    questions_for_doctor: doctorQuestions,
    disclaimer:
      'This AI-assisted explanation is for educational purposes only and does not constitute a medical diagnosis or clinical advice. Please consult a qualified healthcare professional for formal evaluation.',
  };
}

const PROGRESS_SUMMARY_SYSTEM_PROMPT = `You are an educational developmental progress explanation assistant for PediPulse.
You are NOT a doctor and must NEVER provide a medical diagnosis.
CRITICAL SAFETY CONSTRAINTS:
1. Strict prohibition: NEVER name medical or developmental disorders or conditions (such as "autism", "ASD", "ADHD", "cerebral palsy", "intellectual disability", "developmental disorder", or any clinical syndrome).
2. Forbid diagnostic statements: Do not say the child "has" or "suffers from" any condition.
3. Plain language only: Describe observations objectively in terms of everyday developmental activities (e.g., communication, motor skills, social play, daily self-care).
4. Bilingual Requirement: Provide a concise, plain-language summary of developmental changes in both English (summary_en) and natural Kannada / ಕನ್ನಡ (summary_kn).
5. Mandatory ending: BOTH the English and Kannada summaries MUST end with a clear statement advising the parent to consult a doctor or qualified pediatrician for professional advice.
6. The disclaimer MUST be: "This is a pre-screening summary, not a medical diagnosis."

Respond ONLY with valid JSON in this exact structure:
{
  "summary_en": "Plain English summary describing changes and progress across sessions, ending with a recommendation to consult a doctor.",
  "summary_kn": "ಸರಳ ಕನ್ನಡದಲ್ಲಿ ಹಿಂದಿನ ಮತ್ತು ಇತ್ತೀಚಿನ ಅವಧಿಗಳ ಬದಲಾವಣೆಗಳ ಸಾರಾಂಶ, ಕೊನೆಯಲ್ಲಿ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಲು ಸ್ಪಷ್ಟ ಸಲಹೆ.",
  "key_changes": [
    "Key change 1 in plain English",
    "Key change 2 in plain English"
  ],
  "disclaimer": "This is a pre-screening summary, not a medical diagnosis."
}`;

export async function generateAIProgressSummary(
  input: ProgressSummaryInput
): Promise<GeneratedProgressSummaryResult> {
  const disclaimerText = 'This is a pre-screening summary, not a medical diagnosis.';

  if (config.hasGemini) {
    try {
      const genAI = new GoogleGenerativeAI(config.geminiApiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const trendsOverview = input.trends
        .map(
          (t) =>
            `- ${t.domain}: ${t.label} (Previous: ${t.previous_status} [${t.previous_percentage}%] -> Latest: ${t.latest_status} [${t.latest_percentage}%], Change: ${t.delta_percentage >= 0 ? '+' : ''}${t.delta_percentage}%)`
        )
        .join('\n');

      const sessionHistory = input.sessions
        .map(
          (s, idx) =>
            `Session ${idx + 1} (${s.date}, Age: ${s.age_display}): Overall Status: ${s.risk_level}, Total Score: ${s.overall_score}`
        )
        .join('\n');

      const promptText = `
Screening Sessions Count: ${input.sessions.length}
Child Current Age Band: ${input.childAge}

Session Milestones Timeline:
${sessionHistory}

Domain Trend Breakdown (Scoring Rules):
${trendsOverview}

Please generate an empathetic, plain-language comparative progress summary in both English and Kannada according to the safety rules.
`;

      const result = await model.generateContent([
        { text: PROGRESS_SUMMARY_SYSTEM_PROMPT },
        { text: promptText },
      ]);

      const responseText = result.response.text();
      const parsed = JSON.parse(responseText);

      return {
        summary_en: parsed.summary_en || 'Progress observations across screening sessions show developmental changes. Please consult a qualified doctor for personalized guidance.',
        summary_kn: parsed.summary_kn || 'ಪೂರ್ವ-ತಪಾಸಣಾ ಅವಧಿಗಳ ನಡುವಿನ ಬದಲಾವಣೆಗಳನ್ನು ಗಮನಿಸಲಾಗಿದೆ. ಸಮಗ್ರ ಮತ್ತು ಸೂಕ್ತ ಮಾರ್ಗದರ್ಶನಕ್ಕಾಗಿ ದಯವಿಟ್ಟು ಮಕ್ಕಳ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.',
        key_changes: Array.isArray(parsed.key_changes) ? parsed.key_changes : [],
        disclaimer: disclaimerText,
      };
    } catch (err: any) {
      console.warn('Gemini progress summary call failed or quota reached, using safe deterministic fallback.');
    }
  }

  return getDeterministicProgressSummaryFallback(input);
}

export function getDeterministicProgressSummaryFallback(
  input: ProgressSummaryInput
): GeneratedProgressSummaryResult {
  const improved = input.trends.filter((t) => t.trend === 'improved');
  const needsAttention = input.trends.filter((t) => t.trend === 'needs_attention');
  const unchanged = input.trends.filter((t) => t.trend === 'unchanged');

  const keyChanges: string[] = [];

  if (improved.length > 0) {
    const domains = improved.map((t) => t.domain).join(', ');
    keyChanges.push(`Progress noted in ${domains} with positive milestone gains.`);
  }

  if (needsAttention.length > 0) {
    const domains = needsAttention.map((t) => t.domain).join(', ');
    keyChanges.push(`Continued attention and interactive play recommended for ${domains}.`);
  }

  if (unchanged.length > 0) {
    const domains = unchanged.map((t) => t.domain).join(', ');
    keyChanges.push(`Steady, consistent milestone performance maintained in ${domains}.`);
  }

  let summary_en = '';
  if (improved.length > 0 && needsAttention.length === 0) {
    summary_en = `Across recent screening sessions, your child demonstrates encouraging progress with positive gains across evaluated areas such as ${improved.map(i => i.domain).join(', ')}. Continue nurturing daily play and interactive routines, and please consult your doctor for personalized advice during regular checkups.`;
  } else if (needsAttention.length > 0) {
    summary_en = `Comparing screening sessions shows active developmental areas alongside specific domains (${needsAttention.map(n => n.domain).join(', ')}) that may benefit from structured home play and close observation. This is an early pre-screening tool; please consult a qualified doctor or pediatrician for professional clinical guidance.`;
  } else {
    summary_en = `Developmental screening sessions show steady and consistent milestone progress across observed areas for this age stage. Keep encouraging open-ended play and bonding routines, and consult your doctor for routine wellness reviews.`;
  }

  let summary_kn = '';
  if (improved.length > 0 && needsAttention.length === 0) {
    summary_kn = `ಹಿಂದಿನ ಮತ್ತು ಇತ್ತೀಚಿನ ಪೂರ್ವ-ತಪಾಸಣೆಯ ಅವಧಿಗಳ ನಡುವೆ, ನಿಮ್ಮ ಮಗು ${improved.map(i => i.domain).join(', ')} ಕ್ಷೇತ್ರಗಳಲ್ಲಿ ಉತ್ತಮ ಬೆಳವಣಿಗೆ ಮತ್ತು ಪ್ರಗತಿಯನ್ನು ಪ್ರದರ್ಶಿಸಿದೆ. ದಿನನಿತ್ಯದ ಆಟ ಮತ್ತು ಸಂವಹನ ಚಟುವಟಿಕೆಗಳನ್ನು ಮುಂದುವರಿಸಿ, ಹಾಗೂ ಸೂಕ್ತ ಸಲಹೆಗಾಗಿ ಮಕ್ಕಳ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.`;
  } else if (needsAttention.length > 0) {
    summary_kn = `ಪೂರ್ವ-ತಪಾಸಣೆಯ ಅವಧಿಗಳ ಹೋಲಿಕೆಯು ಮಗುವಿನ ಸಕ್ರಿಯ ಬೆಳವಣಿಗೆಯೊಂದಿಗೆ ${needsAttention.map(n => n.domain).join(', ')} ಕ್ಷೇತ್ರಗಳಲ್ಲಿ ಹೆಚ್ಚಿನ ಗಮನ ಮತ್ತು ಪ್ರೋತ್ಸಾಹದ ಅಗತ್ಯವನ್ನು ಸೂಚಿಸುತ್ತದೆ. ಸೂಕ್ತ ವೈದ್ಯಕೀಯ ಮಾರ್ಗದರ್ಶನಕ್ಕಾಗಿ ದಯವಿಟ್ಟು ಮಕ್ಕಳ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.`;
  } else {
    summary_kn = `ಪೂರ್ವ-ತಪಾಸಣಾ ಅವಧಿಗಳಲ್ಲಿ ಮಗುವಿನ ಬೆಳವಣಿಗೆಯು ಸ್ಥಿರ ಮತ್ತು ನಿರಂತರ ಪ್ರಗತಿಯನ್ನು ತೋರಿಸುತ್ತಿದೆ. ಮಗುವಿನೊಂದಿಗೆ ಆಟವಾಡುವ ಮತ್ತು ಕಥೆ ಹೇಳುವ ದಿನನಿತ್ಯದ ಅಭ್ಯಾಸಗಳನ್ನು ಮುಂದುವರಿಸಿ, ಹಾಗೂ ನಿಯಮಿತ ತಪಾಸಣೆಗಾಗಿ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.`;
  }

  return {
    summary_en,
    summary_kn,
    key_changes: keyChanges.length > 0 ? keyChanges : ['Consistent milestone tracking recorded across screening sessions.'],
    disclaimer: 'This is a pre-screening summary, not a medical diagnosis.',
  };
}

