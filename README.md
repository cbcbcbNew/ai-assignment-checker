# AI Assignment Vulnerability Analyzer

A React application that analyzes assignment prompts for AI vulnerability using Google's Gemini API. The app helps educators assess how easily their assignments can be solved by AI tools and provides actionable feedback to make assignments more authentic and AI-resistant.

## Features

- 🔐 **User Authentication** - Secure login and registration system
- 📄 Support for .txt files (PDF and DOCX support coming soon)
- 🧠 AI-powered vulnerability analysis using Gemini API
- 📊 Risk assessment with detailed scoring
- 💡 Actionable improvement suggestions
- 📱 Modern, responsive UI
- 📄 PDF export functionality
- 🔒 Protected API endpoints

## Authentication System

The application now includes a complete user authentication system:

- **User Registration**: Create new accounts with email and password
- **User Login**: Secure authentication with JWT tokens
- **Protected Routes**: Analysis features require authentication
- **Session Management**: Automatic token refresh and logout
- **Database Storage**: SQLite database for user management

## Local Development

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Gemini API key

### Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd ai-assignment-checker
```

2. Install dependencies:
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..
```

3. Set up environment variables:
Create a `.env` file in the backend directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_jwt_secret_key_here
```

4. Start the development servers:
```bash
# Start backend (in one terminal)
cd backend && npm start

# Start frontend (in another terminal)
npm run dev
```

The app will be available at `http://localhost:5173` and the backend at `http://localhost:8080`

## Deployment

### Backend (Render)
1. Deploy the `backend/` folder as a Node.js web service on [Render](https://render.com/).
2. Set the environment variables:
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `JWT_SECRET`: A secure random string for JWT signing
3. The backend will be available at `https://your-backend.onrender.com` (or similar).

### Frontend (Vercel)
1. Deploy the root project (React/Vite) to [Vercel](https://vercel.com/).
2. Set the environment variable `VITE_API_BASE_URL` to your Render backend URL (e.g., `https://your-backend.onrender.com`).
3. All API calls will be routed to your backend.

---

A React application that analyzes assignment prompts for AI vulnerability using Google's Gemini API. The app helps educators assess how easily their assignments can be solved by AI tools and provides actionable feedback to make assignments more authentic and AI-resistant.

## Features

- 📄 Support for .txt, .pdf, and .docx files
- 🧠 AI-powered vulnerability analysis using Gemini API
- 📊 Risk assessment (Low/Medium/High/Critical)
- 💡 Actionable improvement suggestions
- 📱 Modern, responsive UI
- 📄 PDF export functionality

## Local Development

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Gemini API key

### Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd ai-assignment-checker
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

4. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Deployment to Vercel

### Prerequisites

- Vercel account
- Google Gemini API key

### Steps

1. **Install Vercel CLI** (optional but recommended):
```bash
npm i -g vercel
```

2. **Set up environment variables in Vercel**:
   - Go to your Vercel dashboard
   - Create a new project or select existing one
   - Go to Settings → Environment Variables
   - Add `GEMINI_API_KEY` with your API key

3. **Deploy**:
   ```bash
   vercel
   ```
   
   Or connect your GitHub repository to Vercel for automatic deployments.

### Environment Variables

Make sure to set the following environment variable in your Vercel project:

- `GEMINI_API_KEY`: Your Google Gemini API key

### API Routes

The application includes the following API routes:

**Authentication Endpoints:**
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile (protected)

**Analysis Endpoints:**
- `POST /api/analyze` - Analyzes assignment text for AI vulnerability (protected)
- `POST /api/extract` - Extracts text from uploaded files (simplified for Vercel)

## File Support

- **TXT files**: Full support with direct text extraction
- **PDF files**: Basic text extraction (for production, consider using pdf.js)
- **DOCX files**: Placeholder support (for production, consider using mammoth.js)

## Architecture

- **Frontend**: React with Vite
- **Backend**: Vercel serverless functions
- **AI**: Google Gemini API
- **Styling**: Inline styles with modern design
- **File Processing**: Client-side text extraction

## Troubleshooting

### Common Issues

1. **API calls failing on Vercel**:
   - Ensure `GEMINI_API_KEY` is set in Vercel environment variables
   - Check that the API routes are properly configured in `vercel.json`

2. **File upload issues**:
   - The current implementation uses client-side text extraction
   - For better PDF/DOCX support, consider implementing server-side processing

3. **CORS errors**:
   - CORS headers are configured in the API routes
   - If issues persist, check the `vercel.json` configuration

### Development vs Production

- **Development**: Uses Vite dev server with proxy to local API
- **Production**: Uses Vercel serverless functions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
