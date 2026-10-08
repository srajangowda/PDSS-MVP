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

const SYSTEM_PROMPT = `You are an educational developmental screening explanation assistant for PediPulse.
You are NOT a doctor.
Do not diagnose medical or developmental conditions.
Never state the child "has autism", "has ADHD", "has a developmental disorder", or any clinical syndrome.
Do not infer a specific diagnosis or disorder from screening answers.
Explain screening results in simple, empathetic, non-alarming language for parents and frontline community health workers.
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
${input.observations ? `- Parent/Health Worker Observations: ${input.observations}` : ''}

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

