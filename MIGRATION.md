# Migration Summary: Python Chatbot → Node.js

## Overview
The Python FastAPI chatbot service has been successfully migrated to Node.js/Express. Now the entire application runs as a single Node.js app that can be fully deployed on Vercel.

## What Changed

### New Files
- `services/chatbot.js` - Core chatbot logic (was `chatbot-service/main.py`)

### Modified Files
- `routes/chatbot.js` - Now uses local service instead of Python proxy
- `package.json` - Added `@pinecone-database/pinecone` and `groq-sdk`
- `.env.example` - Updated with new environment variables

### Removed Dependencies
- Python service no longer needed
- `CHATBOT_SERVICE_URL` environment variable no longer needed

## Environment Variables Required

### Required for Chat
```env
GROQ_API_KEY=your_groq_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=web-portfolio
PINECONE_NAMESPACE=portfolio-knowledge
```

### Required for Document Indexing (Embeddings)
**Option 1: OpenAI (Recommended)**
```env
OPENAI_API_KEY=your_openai_api_key
```

**Option 2: HuggingFace**
```env
HUGGINGFACE_API_KEY=your_huggingface_api_key
```

Without an embedding provider, the chatbot will work but document indexing won't be available.

## Features Migrated

✅ Chat streaming with SSE (Server-Sent Events)
✅ RAG (Retrieval-Augmented Generation) using Pinecone
✅ Live project data fetching from PostgreSQL
✅ Document indexing (with embedding provider)
✅ Document deletion from Pinecone
✅ Health check endpoint
✅ Rate limiting (10 requests/minute)

## Architecture

```
Client (Browser)
    ↓
Vercel Serverless Functions
    ↓
Express Routes (routes/chatbot.js)
    ↓
Chatbot Service (services/chatbot.js)
    ↓
├─→ Groq API (LLM responses)
├─→ Pinecone (vector search)
└─→ PostgreSQL (project data)
```

## Deployment to Vercel

1. Install dependencies:
```bash
npm install
```

2. Set environment variables in Vercel dashboard:
- `DATABASE_URL`
- `GROQ_API_KEY`
- `PINECONE_API_KEY`
- `PINECONE_INDEX`
- `PINECONE_NAMESPACE`
- `OPENAI_API_KEY` (optional, for embeddings)
- `SESSION_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

3. Deploy:
```bash
vercel --prod
```

## Known Limitations

### Vercel Serverless Constraints
1. **10-second timeout** on hobby plan - long LLM calls may timeout
2. **50MB response limit** - streaming helps avoid this
3. **Cold starts** - first request after deployment may be slower

### Document Indexing
- **PDF parsing** requires additional setup (not included in serverless)
- Text files (TXT, MD, JSON) work out of the box
- For PDFs, consider pre-extracting text or using an external service

## Troubleshooting

### Embeddings Not Working
If you get "No embedding provider configured":
- Add `OPENAI_API_KEY` to environment variables
- Or add `HUGGINGFACE_API_KEY`

### Pinecone Connection Errors
- Verify `PINECONE_API_KEY` is set correctly
- Check that `PINECONE_INDEX` matches your index name
- Ensure the index exists in your Pinecone dashboard

### Groq API Errors
- Verify `GROQ_API_KEY` is valid
- Check Groq dashboard for rate limits
- Default model: `llama-3.3-70b-versatile`

## Next Steps

1. ✅ Run `npm install` to install new dependencies
2. ✅ Add `OPENAI_API_KEY` to your `.env` file
3. ✅ Test locally: `npm run dev`
4. ✅ Deploy to Vercel
5. 🗑️ You can now delete the `chatbot-service/` folder if desired

## Performance Considerations

- **Project data is cached** for 60 seconds to reduce database load
- **Streaming responses** prevent timeouts and improve UX
- **Rate limiting** prevents abuse (10 req/min per IP)

## Monitoring

Check the Vercel function logs for:
- Request IDs in chatbot responses
- Pinecone query times
- Groq API latency
