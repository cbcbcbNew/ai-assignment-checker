import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import API_BASE from './apiBase';
import { useAuth } from './AuthContext';
import Login from './Login';
import Register from './Register';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewText, setPreviewText] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [loading, setLoading] = useState(false);
  // Modal state: 'login', 'register', or null
  const [authModal, setAuthModal] = useState(null);
  const analysisRef = useRef();
  const { user, token, logout, loading: authLoading } = useAuth();

  // Extract text from file, only .txt supported
  const extractTextFromFile = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'txt') {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsText(file);
      });
    } else {
      return Promise.resolve('(Unsupported file type. Only .txt files are supported in this version.)');
    }
  };

  // Accept .txt, .pdf, .docx
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewText('(Extracting text for preview...)');
      try {
        // Send file to backend for extraction
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`${API_BASE}/api/extract`, {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        setPreviewText(data.text || '(No text extracted)');
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
      // Use previewText as the extracted text
      const extractedText = previewText;
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ text: extractedText }),
      });
      
      if (response.status === 401) {
        setAnalysisResult("❌ Please log in to use this feature.");
        return;
      }
      
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

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #18181b 0%, #23272f 100%)',
        color: '#f3f4f6',
        fontFamily: 'Inter, system-ui, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  // Main app interface (analyzer always available)
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
      {/* Header with Auth Button */}
      <header style={{
        width: '100%',
        padding: '3rem 0 2rem 0',
        textAlign: 'center',
        background: 'linear-gradient(90deg, #6366f1 0%, #818cf8 100%)',
        color: '#fff',
        boxShadow: '0 2px 16px 0 rgba(0,0,0,0.08)',
        marginBottom: '2rem',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}>
          {user ? (
            <>
              <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                Welcome, {user.name || user.email}!
              </span>
              <button
                onClick={logout}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => setAuthModal('login')}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Login / Register
            </button>
          )}
        </div>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 800, margin: 0, letterSpacing: '-1px' }}>
          🧠 Assignment AI Vulnerability Analyzer
        </h1>
        <p style={{ fontSize: '1.25rem', fontWeight: 400, margin: '1rem auto 0', maxWidth: 600 }}>
          Instantly assess how easily your assignment prompts can be solved by AI tools like Gemini or ChatGPT. Get actionable feedback to make your assignments more authentic and AI-resistant. Perfect for educators who want to stay ahead!
        </p>
      </header>

      {/* Sleek Auth Modal */}
      {authModal && !user && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.45)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: 'rgba(36, 37, 46, 0.98)',
            borderRadius: '18px',
            boxShadow: '0 8px 40px 0 rgba(0,0,0,0.25)',
            padding: '2.5rem 2rem 2rem 2rem',
            minWidth: 340,
            maxWidth: '90vw',
            position: 'relative',
            zIndex: 1001,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
          }}>
            {/* Close button */}
            <button
              onClick={() => setAuthModal(null)}
              style={{
                position: 'absolute',
                top: 18,
                right: 18,
                background: 'none',
                border: 'none',
                color: '#a5b4fc',
                fontSize: '1.5rem',
                cursor: 'pointer',
                fontWeight: 700,
                zIndex: 1002
              }}
              aria-label="Close auth modal"
            >
              ×
            </button>
            {/* Auth form */}
            {authModal === 'login' ? (
              <>
                <Login onSwitchToRegister={() => setAuthModal('register')} onSuccess={() => setAuthModal(null)} />
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                  <span style={{ color: '#a5b4fc', fontSize: '0.98rem' }}>
                    Don&apos;t have an account?{' '}
                    <button
                      onClick={() => setAuthModal('register')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#818cf8',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontWeight: 600,
                        fontSize: '0.98rem',
                        padding: 0
                      }}
                    >
                      Sign up
                    </button>
                  </span>
                </div>
              </>
            ) : (
              <>
                <Register onSwitchToLogin={() => setAuthModal('login')} onSuccess={() => setAuthModal(null)} />
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                  <span style={{ color: '#a5b4fc', fontSize: '0.98rem' }}>
                    Already have an account?{' '}
                    <button
                      onClick={() => setAuthModal('login')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#818cf8',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontWeight: 600,
                        fontSize: '0.98rem',
                        padding: 0
                      }}
                    >
                      Sign in
                    </button>
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Upload & Preview Card (always available) */}
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
          Upload Assignment Prompt (.txt only)
        </label>
        <span style={{ fontSize: '0.98rem', color: '#a5b4fc', marginBottom: 16 }}>
          Supported file type: <b>.txt</b> only. PDF and DOCX support coming soon!
        </span>
        <input
          type="file"
          accept=".txt,.pdf,.docx"
          onChange={handleFileChange}
          style={{ marginBottom: 18 }}
        />
        <button
          onClick={() => handleAnalyze(selectedFile)}
          disabled={!selectedFile || loading}
          style={{
            background: 'linear-gradient(90deg, #6366f1 0%, #818cf8 100%)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '1.15rem',
            border: 'none',
            borderRadius: 8,
            padding: '0.9rem 0',
            marginBottom: 24,
            cursor: selectedFile && !loading ? 'pointer' : 'not-allowed',
            opacity: selectedFile && !loading ? 1 : 0.6,
            transition: 'opacity 0.2s',
          }}
        >
          {loading ? 'Analyzing...' : '🔍 Analyze'}
        </button>
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8 }}>
            �� Assignment Preview
          </h3>
          <div style={{
            background: '#18181b',
            borderRadius: 8,
            padding: '1rem',
            minHeight: 80,
            color: '#a5b4fc',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '1.01rem',
            whiteSpace: 'pre-wrap',
            marginBottom: 0,
          }}>
            {previewText}
          </div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8 }}>
            🧠 AI Vulnerability Analysis
          </h3>
          <div style={{
            background: 'linear-gradient(90deg, #23272f 0%, #18181b 100%)',
            borderRadius: 8,
            padding: '1rem',
            minHeight: 80,
            color: '#f3f4f6',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '1.01rem',
            whiteSpace: 'pre-wrap',
            marginBottom: 0,
          }}>
            {analysisResult}
          </div>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={!analysisResult}
          style={{
            background: 'linear-gradient(90deg, #818cf8 0%, #6366f1 100%)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '1.05rem',
            border: 'none',
            borderRadius: 8,
            padding: '0.7rem 0',
            cursor: analysisResult ? 'pointer' : 'not-allowed',
            opacity: analysisResult ? 1 : 0.6,
            transition: 'opacity 0.2s',
          }}
        >
          ⬇️ Export Annotated PDF
        </button>
      </main>
      <footer style={{ color: '#a5b4fc', fontSize: '0.98rem', marginTop: 16 }}>
        &copy; {new Date().getFullYear()} Assignment AI Vulnerability Analyzer. All rights reserved.
      </footer>
    </div>
  );
}
console.log("test passed");
export default App;