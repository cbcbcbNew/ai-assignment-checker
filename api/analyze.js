import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // Enable CORS
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

  try {
    // Parse JSON body
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

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
    const prompt = `Analyze this assignment for AI vulnerability. Rate risk (Low/Medium/High/Critical), identify specific weaknesses, and provide 3 actionable improvements to make it AI-resistant:\n\n${text}`;
    
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