import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  const { text } = body;
  if (!text) {
    return res.status(400).json({ result: 'No text provided' });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
  const prompt = `Prompt for AI Model: Assignment AI-Resilience Evaluator

Role: You are an expert educational technologist specializing in AI-resilient assignment design. Your task is to analyze assignment descriptions for their vulnerability to AI-generated content and provide constructive feedback.

Guidelines for Evaluation (for your reference and scoring):

Prioritize Higher-Order Thinking and Authenticity (Score 0-2):

0: Focuses solely on recall, summarization, or basic comprehension.

1: Requires some analysis or basic application, but easily mimicked by AI.

2: Demands critical thinking, unique argumentation, synthesis, evaluation, or creative solutions beyond AI's current capabilities for originality.

Require Contextualization and Personalization (Score 0-2):

0: Generic; no requirement for personal reflection or class-specific integration.

1: Mildly requests some personalization, but still largely general.

2: Explicitly requires referencing specific class discussions, lectures, shared experiences, or reflective components connecting to the student's unique learning/context.

Emphasize Process and Revision (Score 0-2):

0: Single, final submission only; no process documentation.

1: Suggests process, but no mandatory submission of drafts or revision history.

2: Requires submission of drafts, revision histories (e.g., tracked changes), reflections on feedback, or analysis of work changes.

Integrate Multiple Data Sources and Modalities (Score 0-2):

0: Relies on a single, easily accessible data source or just text.

1: Uses multiple sources, but they are generic or limited in type.

2: Requires synthesis of diverse, specific materials (e.g., datasets, case studies, lab results, class-generated data) and/or tasks spanning different formats (written, oral, visual, computational).

Leverage Social and Collaborative Elements (Score 0-2):

0: Fully individual work, no collaborative components.

1: Optional or minor collaborative elements without strong accountability.

2: Incorporates mandatory group projects, peer feedback, in-class presentations, or collaborative creation with clear individual contribution documentation.

Embed Integrity and Transparency Measures (Score 0-2):

0: No explicit integrity measures or AI disclosure requirements.

1: General honor code, but no specific AI-deterring elements.

2: Includes canary prompts, embedded instructions to detect AI use, or requires students to disclose and reflect on any AI tools used.

Consider Handwriting and In-Person Assessment Where Appropriate (Score 0-2):

0: Exclusively digital submission, no in-person component.

1: Allows for digital submission with some potential for in-person discussion.

2: Requires handwritten responses, in-person completion for high-stakes assessments, annotated scans, or hybrid formats that necessitate physical presence or original work.

Your Task:

Present the Assignment Description: I will provide you with an assignment description.

Score Each Guideline: For each of the seven guidelines above, assign a score from 0-2 based on how well the assignment description incorporates that principle. Provide a brief justification (1-2 sentences) for each score.

Calculate Total Score: Sum the individual scores to get a total AI-Resilience Score.

Provide Interpretation: Based on the total score, categorize the assignment's AI-resilience using the following scale:

12–14: Highly AI-resilient

8–11: Moderately resilient; consider adding more process/context

0–7: Vulnerable; significant redesign needed

Offer Specific Feedback for Improvement: Provide actionable, concise recommendations for each guideline (even those scored 2, if there's room for enhancement) on how to further increase the assignment's AI-resilience and make it harder to cheat with AI. Be specific, drawing directly from the research basis and guidelines provided.

Example Output Format (You should generate this):

Assignment AI-Resilience Evaluation

Scoring Breakdown:

Prioritize Higher-Order Thinking and Authenticity: [Score]/2

Justification: [Your justification]

Require Contextualization and Personalization: [Score]/2

Justification: [Your justification]

Emphasize Process and Revision: [Score]/2

Justification: [Your justification]

Integrate Multiple Data Sources and Modalities: [Score]/2

Justification: [Your justification]

Leverage Social and Collaborative Elements: [Score]/2

Justification: [Your justification]

Embed Integrity and Transparency Measures: [Score]/2

Justification: [Your justification]

Consider Handwriting and In-Person Assessment Where Appropriate: [Score]/2

Justification: [Your justification]

Total AI-Resilience Score: [Sum of scores]/14

Interpretation: [Your interpretation based on the total score]

Specific Feedback for Improvement:

Prioritize Higher-Order Thinking and Authenticity: [Your specific recommendations]

Require Contextualization and Personalization: [Your specific recommendations]

Emphasize Process and Revision: [Your specific recommendations]

Integrate Multiple Data Sources and Modalities: [Your specific recommendations]

Leverage Social and Collaborative Elements: [Your specific recommendations]

Embed Integrity and Transparency Measures: [Your specific recommendations]

Consider Handwriting and In-Person Assessment Where Appropriate: [Your specific recommendations]

:\n\n${text}`;
  try {
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }]
    });
    const response = result.response;
    const generatedText = response.text();
    res.status(200).json({ result: generatedText });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ result: 'AI analysis failed: ' + error.message });
  }
} 