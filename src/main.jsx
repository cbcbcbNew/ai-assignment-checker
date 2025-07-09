import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // ✅ This line must match the file you're editing
import { AuthProvider } from './AuthContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);