import express from 'express';
import formidable from 'formidable';
import fs from 'fs';
import mammoth from 'mammoth';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// /api/extract endpoint
app.post('/api/extract', (req, res) => {
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ text: '(Error parsing file)' });
    const file = files.file;
    if (!file) return res.status(400).json({ text: '(No file uploaded)' });
    let assignmentText = '';
    const ext = file.originalFilename.split('.').pop().toLowerCase();
    if (ext === 'txt') {
      assignmentText = fs.readFileSync(file.filepath, 'utf-8');
    } else if (ext === 'pdf') {
      assignmentText = '(PDF extraction not supported on server. Please convert to text first.)';
    } else if (ext === 'docx') {
      const dataBuffer = fs.readFileSync(file.filepath);
      const result = await mammoth.extractRawText({ buffer: dataBuffer });
      assignmentText = result.value;
    } else {
      assignmentText = '(Unsupported file type)';
    }
    res.json({ text: assignmentText });
  });
});

// /api/analyze endpoint
app.post('/api/analyze', (req, res) => {
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ result: 'Error parsing file' });
    let assignmentText = '';
    if (files.file) {
      const file = files.file;
      const ext = file.originalFilename.split('.').pop().toLowerCase();
      if (ext === 'txt') {
        assignmentText = fs.readFileSync(file.filepath, 'utf-8');
      } else if (ext === 'pdf') {
        assignmentText = '(PDF extraction not supported on server. Please convert to text first.)';
      } else if (ext === 'docx') {
        const dataBuffer = fs.readFileSync(file.filepath);
        const result = await mammoth.extractRawText({ buffer: dataBuffer });
        assignmentText = result.value;
      } else {
        assignmentText = '(Unsupported file type)';
      }
    } else if (fields.text) {
      assignmentText = fields.text;
    } else {
      return res.status(400).json({ result: 'No file or text provided' });
    }
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
      res.json({ result: generatedText });
    } catch (error) {
      res.status(500).json({ result: 'AI analysis failed: ' + error.message });
    }
  });
});

app.get('/', (req, res) => {
  res.send('AI Assignment Checker Backend is running.');
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
}); 