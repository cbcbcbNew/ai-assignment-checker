import formidable from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

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
    res.json({ text: assignmentText });
  });
} 