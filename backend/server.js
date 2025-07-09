import express from 'express';
import { formidable } from 'formidable';
import fs from 'fs';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateToken, comparePassword, authenticateToken } from './auth.js';
import { initDatabase, createUser, getUserByEmail, getUserById } from './database.js';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import mammoth from 'mammoth';

const app = express();
const PORT = process.env.PORT || 8080;

const allowedOrigins = [
  'https://ai-assignment-checker.vercel.app',
  'http://localhost:5173',
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

// Initialize database
initDatabase().catch(console.error);

// Authentication endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const user = await createUser(email, password, name);
    const token = generateToken(user.id);
    
    res.status(201).json({
      message: 'User created successfully',
      user: { id: user.id, email: user.email, name: user.name },
      token
    });
  } catch (error) {
    if (error.message === 'Email already exists') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = generateToken(user.id);
    
    res.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, name: user.name },
      token
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await getUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// /api/extract endpoint (supports .txt, .pdf, .docx)
app.post('/api/extract', (req, res) => {
  formidable().parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ text: '(Error parsing file)' });

    // Defensive: log files and check for file
    console.log('Received files:', files);
    const file = files.file;
    if (!file || !file.originalFilename) {
      return res.status(400).json({ text: '(No file uploaded or filename missing)' });
    }

    let assignmentText = '';
    const ext = file.originalFilename.split('.').pop().toLowerCase();
    try {
      if (ext === 'txt') {
        assignmentText = fs.readFileSync(file.filepath, 'utf-8');
      } else if (ext === 'pdf') {
        try {
          const dataBuffer = fs.readFileSync(file.filepath);
          // Use pdfjs-dist legacy build to extract text
          const loadingTask = pdfjsLib.getDocument({ data: dataBuffer });
          const pdf = await loadingTask.promise;
          let text = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(item => item.str).join(' ') + '\n';
          }
          assignmentText = text;
        } catch (pdfErr) {
          assignmentText = '(Error extracting PDF text: ' + pdfErr.message + ')';
        }
      } else if (ext === 'docx') {
        const dataBuffer = fs.readFileSync(file.filepath);
        const result = await mammoth.extractRawText({ buffer: dataBuffer });
        assignmentText = result.value;
      } else {
        assignmentText = '(Unsupported file type. Only .txt, .pdf, and .docx files are supported.)';
      }
    } catch (e) {
      assignmentText = '(Error extracting text: ' + e.message + ')';
    }
    res.json({ text: assignmentText });
  });
});

// /api/analyze endpoint (accepts only JSON) - Now public
app.post('/api/analyze', async (req, res) => {
  const assignmentText = req.body.text;
  if (!assignmentText) {
    return res.status(400).json({ result: 'No text provided' });
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
  const prompt = `Prompt for AI Model: Assignment AI-Resilience Evaluator (Aggregate Score)

Role: You are an expert educational technologist specializing in AI-resilient assignment design. Your task is to analyze assignment descriptions for their vulnerability to AI-generated content and provide constructive feedback, giving an overall assessment with specific recommendations for improvement.

Core Principles for AI-Resilient Assignment Design (for your reference and evaluation):

Higher-Order Thinking & Authenticity: Does the assignment demand critical thinking, unique argumentation, synthesis, evaluation, or creative solutions that go beyond simple recall or summarization? Is it difficult for AI to generate truly original or insightful responses?

Contextualization & Personalization: Does the assignment require students to integrate class-specific discussions, lectures, unique scenarios, or personal reflections that AI would struggle to fabricate convincingly?

Process & Revision Emphasis: Does the assignment build in stages (drafts, revisions, feedback loops) that reveal the student's learning process and make it harder to submit a single, AI-generated final product?

Integration of Multiple Data Sources & Modalities: Does the assignment require students to synthesize diverse, specific materials (e.g., unique datasets, case studies, lab results) and/or use different formats (written, oral, visual, computational) in a way that is challenging for AI to manage cohesively?

Social & Collaborative Elements: Does the assignment include group work, peer review, or in-person components that introduce social accountability and reduce the incentive or opportunity for AI misuse?

Integrity & Transparency Measures: Are there explicit measures (e.g., canary prompts, required AI disclosure, unique prompts) designed to deter AI use or make it detectable?

Leveraging Appropriate Modalities/In-Person Components: Does the assignment consider non-digital or in-person components (e.g., presentations, specific physical artifacts, in-class activities) that inherently reduce opportunities for AI use and foster direct engagement?

Your Task:

Present the Assignment Description: I will provide you with an assignment description.

Assess Overall AI-Resilience: Based on the degree to which the assignment incorporates the "Core Principles for AI-Resilient Assignment Design," determine its overall vulnerability to AI.

Provide an Aggregate Score from 1 to 10 on a decimal scale where 10 is 

Highly AI-Resilient: This assignment strongly integrates multiple principles, making it genuinely challenging for AI to complete convincingly.

and 1 is something i could toss in ChatGPT and immediately yield the exact desired result. 

Offer Specific Feedback for Improvement: For each of the "Core Principles," provide concrete, actionable recommendations on how the assignment could be modified to increase its resilience against AI, even if it already addresses the principle well. Be specific, explaining how the change would make it harder for AI to cheat effectively.

Example Output Format (You should generate this):

Assignment AI-Resilience Evaluation

Overall AI-Resilience Assessment: [Your chosen aggregate score: Highly AI-Resilient, Moderately AI-Resilient, or Vulnerable to AI]

Specific Feedback for Improvement:

Higher-Order Thinking & Authenticity: [Your specific recommendations on how to enhance this aspect, making it harder for AI]

Contextualization & Personalization: [Your specific recommendations on how to enhance this aspect, making it harder for AI]

Process & Revision Emphasis: [Your specific recommendations on how to enhance this aspect, making it harder for AI]

Integration of Multiple Data Sources & Modalities: [Your specific recommendations on how to enhance this aspect, making it harder for AI]

Social & Collaborative Elements: [Your specific recommendations on how to enhance this aspect, making it harder for AI]

Integrity & Transparency Measures: [Your specific recommendations on how to enhance this aspect, making it harder for AI]

Leveraging Appropriate Modalities/In-Person Components: [Your specific recommendations on how to enhance this aspect, making it harder for AI]



:\n\n${assignmentText}`;
  try {
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }]
    });
    const response = result.response;
    const generatedText = response.text();
    res.json({ result: generatedText });
  } catch (error) {
    res.status(500).json({ result: 'AI analysis failed: ' + error.message });
  }
});

app.get('/', (req, res) => {
  res.send('AI Assignment Checker Backend is running.');
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
}); 