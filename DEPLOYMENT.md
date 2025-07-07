# Deployment Guide for Vercel

## Quick Setup

### 1. Environment Variables

Before deploying, you need to set up your environment variables in Vercel:

1. Go to your Vercel dashboard
2. Create a new project or select your existing project
3. Go to **Settings** → **Environment Variables**
4. Add the following variable:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Your Google Gemini API key
   - **Environment**: Production, Preview, and Development

### 2. Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Deploy
vercel

# Follow the prompts to link your project
```

#### Option B: Using GitHub Integration
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Configure environment variables
6. Deploy

### 3. Verify Deployment

After deployment, your app should be available at your Vercel URL. Test the following:

1. **File Upload**: Try uploading a .txt file
2. **Analysis**: Click "Analyze" to test the AI analysis
3. **PDF Export**: Test the PDF export functionality

## Troubleshooting

### API Calls Not Working

If your API calls are failing:

1. **Check Environment Variables**:
   - Ensure `GEMINI_API_KEY` is set in Vercel
   - Verify the API key is valid

2. **Check API Routes**:
   - Your API routes should be at `/api/analyze` and `/api/extract`
   - Test with a simple curl command:
   ```bash
   curl -X POST https://your-app.vercel.app/api/analyze \
     -H "Content-Type: application/json" \
     -d '{"text":"test assignment"}'
   ```

3. **Check Vercel Logs**:
   - Go to your Vercel dashboard
   - Click on your project
   - Go to "Functions" tab
   - Check for any error logs

### CORS Issues

If you're getting CORS errors:

1. The API routes include CORS headers
2. Check that your `vercel.json` has the correct CORS configuration
3. Ensure you're not making requests from a different domain

### File Upload Issues

The current implementation uses client-side text extraction:

- **TXT files**: Full support
- **PDF files**: Basic text extraction (may not work perfectly)
- **DOCX files**: Placeholder support

For better file support, consider implementing server-side processing.

## Production Considerations

### Security
- Never expose your API keys in client-side code
- Use environment variables for all sensitive data
- Consider implementing rate limiting

### Performance
- The current implementation is optimized for Vercel's serverless functions
- Consider implementing caching for repeated requests
- Monitor your API usage and costs

### File Processing
- For production use, consider implementing proper PDF and DOCX parsing
- You might want to use services like AWS S3 for file storage
- Implement proper file size limits

## Monitoring

After deployment, monitor:

1. **Vercel Analytics**: Check your app's performance
2. **Function Logs**: Monitor API route performance
3. **Error Tracking**: Set up error monitoring
4. **API Usage**: Monitor your Gemini API usage

## Support

If you encounter issues:

1. Check the Vercel documentation
2. Review the function logs in your Vercel dashboard
3. Test locally first using `npm run dev`
4. Ensure all environment variables are properly set 