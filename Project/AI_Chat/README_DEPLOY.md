# AI_Chat Deployment

Recommended target: Render Web Service.

## Render Settings

```text
Root Directory: Project/AI_Chat
Build Command: npm install
Start Command: npm start
```

`Procfile` is included for platforms that read it automatically.

## Environment Variables

Set these in Render:

```env
OPENAI_API_KEY=your_openai_api_key
ENABLE_AI_GENERATION=auto
OPENAI_CHAT_MODEL=gpt-4o-mini
ENABLE_SEMANTIC_RETRIEVAL=auto
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
MIN_SIMILARITY_SCORE=0.72
HOST=0.0.0.0
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

Do not set `PORT` manually on Render. Render provides it automatically and `index.js` already reads `process.env.PORT`.

If `OPENAI_API_KEY` is empty, the server still works with verified-source fallback answers from `trusted-knowledge.json`.

## Health Check

After deployment:

```text
GET https://your-ai-chat-server.onrender.com/api/health
```

Expected response includes:

```json
{
  "status": "ok",
  "service": "AI_Chat",
  "knowledgeSource": "trusted-knowledge.json"
}
```

## Frontend Connection

Use the deployed AI_Chat URL in the React frontend environment variables:

```env
VITE_AI_CHAT_URL=https://your-ai-chat-server.onrender.com
```
