import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import API_BASE from './apiBase';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewText, setPreviewText] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [loading, setLoading] = useState(false);
  const analysisRef = useRef();

  // Extract text from file, all client-side
  const extractTextFromFile = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'txt') {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsText(file);
      });
    } else if (ext === 'pdf') {
      // Client-side PDF extraction
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(' ') + '\n';
      }
      return text;
    } else if (ext === 'docx') {
      // Upload to backend for DOCX extraction
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_BASE}/api/extract`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      return data.text || '(No text extracted)';
    } else {
      return Promise.resolve('(Unsupported file type)');
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewText('(Extracting text for preview...)');
      try {
        const extractedText = await extractTextFromFile(file);
        setPreviewText(extractedText);
      } catch (err) {
        setPreviewText('(Error extracting text)');
      }
    }
  };

  const handleAnalyze = async (file) => {
    setLoading(true);
    setAnalysisResult("");
    if (!file) return;
    try {
      const extractedText = await extractTextFromFile(file);
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: extractedText }),
      });
      const data = await response.json();
      setAnalysisResult(data.result || "⚠️ No result returned");
    } catch (err) {
      setAnalysisResult("❌ Error during analysis.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!analysisResult) return;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 40;
    let y = margin;
    const lineHeight = 20;
    const maxLineWidth = pageWidth - margin * 2;

    // Basic markdown to text conversion for PDF export
    const lines = analysisResult
      .replace(/\*\*(.*?)\*\*/g, (m, p1) => p1.toUpperCase()) // bold as uppercase
      .replace(/\n\s*\n/g, '\n') // remove extra blank lines
      .split(/\n/);

    pdf.setFont('helvetica');
    pdf.setFontSize(13);

    lines.forEach((line) => {
      // Headings
      if (/^# /.test(line)) {
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text(line.replace(/^# /, ''), margin, y);
        y += lineHeight + 6;
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'normal');
      } else if (/^## /.test(line)) {
        pdf.setFontSize(15);
        pdf.setFont('helvetica', 'bold');
        pdf.text(line.replace(/^## /, ''), margin, y);
        y += lineHeight + 2;
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'normal');
      } else if (/^[-*] /.test(line)) {
        // List items
        pdf.text('• ' + line.replace(/^[-*] /, ''), margin + 10, y);
        y += lineHeight;
      } else if (/^\d+\. /.test(line)) {
        // Numbered list
        pdf.text(line, margin, y);
        y += lineHeight;
      } else if (/^> /.test(line)) {
        // Blockquote
        pdf.setTextColor('#818cf8');
        pdf.text(line.replace(/^> /, ''), margin + 10, y);
        pdf.setTextColor('#000');
        y += lineHeight;
      } else if (/^\s*```/.test(line)) {
        // Code block start/end, skip
      } else if (/^\s*$/g.test(line)) {
        y += lineHeight / 2;
      } else {
        // Normal text
        // Split long lines
        const splitLines = pdf.splitTextToSize(line, maxLineWidth);
        splitLines.forEach((l) => {
          pdf.text(l, margin, y);
          y += lineHeight;
        });
      }
      // Paginate if needed
      if (y > pdf.internal.pageSize.getHeight() - margin) {
        pdf.addPage();
        y = margin;
      }
    });
    pdf.save('ai-analysis.pdf');
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #18181b 0%, #23272f 100%)',
      color: '#f3f4f6',
      fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      boxSizing: 'border-box',
      padding: 0,
    }}>
      {/* Hero Section */}
      <header style={{
        width: '100%',
        padding: '3rem 0 2rem 0',
        textAlign: 'center',
        background: 'linear-gradient(90deg, #6366f1 0%, #818cf8 100%)',
        color: '#fff',
        boxShadow: '0 2px 16px 0 rgba(0,0,0,0.08)',
        marginBottom: '2rem',
      }}>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 800, margin: 0, letterSpacing: '-1px' }}>
          🧠 Assignment AI Vulnerability Analyzer
        </h1>
        <p style={{ fontSize: '1.25rem', fontWeight: 400, margin: '1rem auto 0', maxWidth: 600 }}>
          Instantly assess how easily your assignment prompts can be solved by AI tools like Gemini or ChatGPT. Get actionable feedback to make your assignments more authentic and AI-resistant. Perfect for educators who want to stay ahead!
        </p>
      </header>

      {/* Upload & Preview Card */}
      <main style={{
        width: '100%',
        maxWidth: 700,
        background: 'rgba(36, 37, 46, 0.95)',
        borderRadius: '18px',
        boxShadow: '0 4px 32px 0 rgba(0,0,0,0.12)',
        padding: '2.5rem 2rem',
        marginBottom: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
      }}>
        <label style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 8 }}>
          Upload Assignment Prompt (.txt, .pdf, .docx)
        </label>
        <span style={{ fontSize: '0.98rem', color: '#a5b4fc', marginBottom: 16 }}>
          Supported file types: <b>.txt</b>, <b>.pdf</b>, <b>.docx</b>. After analysis, you can export the annotated result as a PDF.
        </span>
        <input
          type="file"
          onChange={handleFileChange}
          accept=".txt,.pdf,.docx"
          style={{
            marginBottom: '1.5rem',
            padding: '0.5rem',
            borderRadius: '6px',
            border: '1px solid #444',
            background: '#23272f',
            color: '#f3f4f6',
            fontSize: '1rem',
          }}
        />
        {selectedFile && (
          <button
            onClick={() => handleAnalyze(selectedFile)}
            disabled={loading}
            style={{
              background: 'linear-gradient(90deg, #6366f1 0%, #818cf8 100%)',
              color: '#fff',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '1.1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '1.5rem',
              boxShadow: '0 2px 8px 0 rgba(99,102,241,0.10)',
              transition: 'background 0.2s',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Analyzing...' : '🔍 Analyze'}
          </button>
        )}
        {previewText && (
          <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 6, color: '#a5b4fc' }}>📄 Assignment Preview</h2>
            <pre style={{
              background: '#18181b',
              padding: '1rem',
              borderRadius: '8px',
              whiteSpace: 'pre-wrap',
              fontSize: '1rem',
              color: '#e0e7ef',
              maxHeight: 600,
              overflowY: 'auto',
              border: '1px solid #23272f',
            }}>{previewText}</pre>
          </div>
        )}
        {analysisResult && (
          <div style={{ marginTop: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 6, color: '#a5b4fc' }}>🧠 AI Vulnerability Analysis</h2>
            <div ref={analysisRef} style={{
              background: 'linear-gradient(135deg, #23272f 0%, #3730a3 100%)',
              padding: '1.5rem',
              borderRadius: '10px',
              color: '#e0e7ef',
              fontFamily: 'Menlo, monospace',
              fontSize: '1rem',
              lineHeight: 1.7,
              border: '1px solid #3730a3',
              boxShadow: '0 2px 12px 0 rgba(36,37,46,0.10)',
              maxHeight: 350,
              overflowY: 'auto',
              marginBottom: '0.5rem',
            }}>
              <ReactMarkdown
                children={analysisResult}
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({node, ...props}) => <h1 style={{color:'#a5b4fc', fontSize:'1.3rem', fontWeight:700, margin:'1rem 0 0.5rem'}} {...props} />,
                  h2: ({node, ...props}) => <h2 style={{color:'#a5b4fc', fontSize:'1.15rem', fontWeight:600, margin:'1rem 0 0.5rem'}} {...props} />,
                  strong: ({node, ...props}) => <strong style={{color:'#facc15'}} {...props} />,
                  li: ({node, ...props}) => <li style={{marginBottom:4}} {...props} />,
                  blockquote: ({node, ...props}) => <blockquote style={{borderLeft:'3px solid #818cf8', paddingLeft:10, color:'#a5b4fc', margin:'0.5rem 0'}} {...props} />,
                  code: ({node, ...props}) => <code style={{background:'#23272f', color:'#facc15', borderRadius:4, padding:'2px 6px'}} {...props} />,
                  p: ({node, ...props}) => <p style={{margin:'0.5rem 0'}} {...props} />,
                }}
              />
            </div>
            <button
              onClick={handleExportPDF}
              style={{
                background: 'linear-gradient(90deg, #6366f1 0%, #818cf8 100%)',
                color: '#fff',
                border: 'none',
                padding: '0.6rem 1.2rem',
                borderRadius: '7px',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                marginTop: '0.5rem',
                boxShadow: '0 2px 8px 0 rgba(99,102,241,0.10)',
                transition: 'background 0.2s',
              }}
            >
              ⬇️ Export Annotated PDF
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        width: '100%',
        textAlign: 'center',
        padding: '1.5rem 0 1rem 0',
        color: '#a1a1aa',
        fontSize: '1rem',
        letterSpacing: '0.01em',
        borderTop: '1px solid #23272f',
        marginTop: 'auto',
        background: 'rgba(24,24,27,0.95)',
      }}>
        <span>Made for educators • {new Date().getFullYear()} • <a href="https://ai.google.dev/gemini-api/docs" style={{ color: '#818cf8', textDecoration: 'none' }} target="_blank" rel="noopener noreferrer">Gemini API</a></span>
      </footer>
    </div>
  );
}

export default App;
