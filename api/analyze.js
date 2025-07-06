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
  if (req.method !== 'POST') return res.status(405).end();

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ result: 'Error parsing file' });
    const file = files.file;
    if (!file) return res.status(400).json({ result: 'No file uploaded' });

    let assignmentText = '';
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
      res.json({ result: 'AI analysis failed: ' + error.message });
    }
  });
} 