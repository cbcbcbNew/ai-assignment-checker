import formidable from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

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
    // For now, we'll accept text directly in the request body
    // This is a simpler approach that works better with Vercel
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ text: '(No text provided)' });
    }
    
    res.status(200).json({ text: text });
  } catch (error) {
    console.error('Extract error:', error);
    res.status(500).json({ text: '(Error extracting text)' });
  }
} 