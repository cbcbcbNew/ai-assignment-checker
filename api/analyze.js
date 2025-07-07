import formidable from 'formidable';
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export const config = {
  api: {
    bodyParser: false,
  },
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

  // Check content-type to determine if it's JSON or multipart
  const contentType = req.headers['content-type'] || '';
  let assignmentText = '';

  if (contentType.includes('multipart/form-data')) {
    // Handle file upload
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(500).json({ result: 'Error parsing file' });
      const file = files.file;
      if (!file) return res.status(400).json({ result: 'No file uploaded' });
      const ext = file.originalFilename.split('.').pop().toLowerCase();
      if (ext === 'txt') {
        assignmentText = fs.readFileSync(file.filepath, 'utf-8');
      } else if (ext === 'pdf') {
        const dataBuffer = fs.readFileSync(file.filepath);
        const data = await pdfParse(dataBuffer);
        assignmentText = data.text;
      } else if (ext === 'docx') {
        const dataBuffer = fs.readFileSync(file.filepath);
        const result = await mammoth.extractRawText({ buffer: dataBuffer });
        assignmentText = result.value;
      } else {
        assignmentText = '(Unsupported file type)';
      }
      await analyzeAndRespond(assignmentText, res);
    });
  } else {
    // Handle JSON body
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
    assignmentText = body.text;
    if (!assignmentText) {
      return res.status(400).json({ result: 'No text provided' });
    }
    await analyzeAndRespond(assignmentText, res);
  }
}

async function analyzeAndRespond(assignmentText, res) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
  const prompt = `Analyze this assignment for AI vulnerability. Rate risk (Low/Medium/High/Critical), identify specific weaknesses, and provide 3 actionable improvements to make it AI-resistant:\n\n${assignmentText}`;
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