// index.js — Express backend for Gemini
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log("🌀 Top of index.js");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// 🔑 Get API key from environment variable
const apiKey = process.env.GEMINI_API_KEY || 'GEMINI_API_KEY';
const genAI = new GoogleGenerativeAI(apiKey);

app.post('/analyze', upload.single('file'), async (req, res) => {
  try {
    console.log("📁 File received:", req.file?.originalname);
    const filePath = req.file.path;
    let assignmentText = '';
    const ext = req.file.originalname.split('.').pop().toLowerCase();
    if (ext === 'txt') {
      assignmentText = fs.readFileSync(filePath, 'utf-8');
    } else if (ext === 'pdf') {
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      assignmentText = data.text;
    } else if (ext === 'docx') {
      const mammoth = require('mammoth');
      const dataBuffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer: dataBuffer });
      assignmentText = result.value;
    } else {
      assignmentText = '(Unsupported file type)';
    }
    console.log("📄 File content length:", assignmentText.length, "characters");

    console.log("🤖 Calling Gemini API with model: gemini-2.0-flash-lite");
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
    const prompt = `Analyze this assignment for AI vulnerability. Rate risk (Low/Medium/High/Critical), identify specific weaknesses, and provide 3 actionable improvements to make it AI-resistant:\n\n${assignmentText}`;
    console.log("📝 Prompt length:", prompt.length, "characters");
    const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [{
            text: prompt
          }]
        }]
      });
    const response = result.response;
    const generatedText = response.text();
    console.log("✅ Gemini analysis completed successfully");
    res.json({ result: generatedText });
  } catch (error) {
    console.error('❌ Gemini API error:', error);
    let fallbackMsg = "⚠️ AI analysis failed. ";
    if (error.message.includes('404')) {
      fallbackMsg += "Model not found. Please check your API key and model name.";
    } else if (error.message.includes('429')) {
      fallbackMsg += "API quota exceeded. Please wait and try again.";
    } else {
      fallbackMsg += error.message;
    }
    res.json({ result: fallbackMsg });
  }
});

app.post('/extract', upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path;
    if (!fs.existsSync(filePath)) {
      console.error('❌ Uploaded file not found:', filePath);
      return res.status(500).json({ text: '(File not found for extraction)' });
    }
    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      console.error('❌ Uploaded file is empty:', filePath);
      return res.status(500).json({ text: '(Uploaded file is empty)' });
    }
    let assignmentText = '';
    const ext = req.file.originalname.split('.').pop().toLowerCase();
    console.log('🔍 Extracting text from', ext, 'file:', filePath, 'size:', stats.size);
    if (ext === 'txt') {
      assignmentText = fs.readFileSync(filePath, 'utf-8');
    } else if (ext === 'pdf') {
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      assignmentText = data.text;
      console.log('✅ PDF text length:', assignmentText.length);
    } else if (ext === 'docx') {
      const mammoth = require('mammoth');
      const dataBuffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer: dataBuffer });
      assignmentText = result.value;
      console.log('✅ DOCX text length:', assignmentText.length);
    } else {
      assignmentText = '(Unsupported file type)';
    }
    res.json({ text: assignmentText });
  } catch (error) {
    console.error('❌ Error extracting text:', error);
    res.status(500).json({ text: '(Error extracting text: ' + error.message + ')' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
