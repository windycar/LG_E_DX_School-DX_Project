# Deployment Guide

This project is deployed as three services:

1. FastAPI backend
2. AI_Chat server
3. React web app

## 1. Deploy Backend

Recommended service: Render Web Service

You can deploy manually from the Render dashboard, or use the included `render.yaml` blueprint.

Blueprint services:

```text
pregnancy-care-backend
pregnancy-care-ai-chat
```

```text
Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

Required environment variables:

```env
DB_USERNAME=your-db-user
DB_PASSWORD=your-db-password
DB_HOST=your-db-host
DB_PORT=3306
DB_NAME=pregnancy_care
API_PUBLIC_BASE_URL=https://your-fastapi-server.onrender.com
BACKEND_ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

When deploying before the frontend URL exists, temporarily set:

```env
BACKEND_ALLOWED_ORIGINS=*
```

After Vercel deployment, replace it with the exact Vercel production URL.

Health check:

```text
https://your-fastapi-server.onrender.com/api/health
```

## 2. Deploy AI_Chat

Recommended service: Render Web Service

```text
Root Directory: Project/AI_Chat
Build Command: npm install
Start Command: npm start
```

Required environment variables:

```env
OPENAI_API_KEY=your-openai-api-key
ENABLE_AI_GENERATION=auto
OPENAI_CHAT_MODEL=gpt-4o-mini
ENABLE_SEMANTIC_RETRIEVAL=auto
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
MIN_SIMILARITY_SCORE=0.72
HOST=0.0.0.0
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

When deploying before the frontend URL exists, temporarily set:

```env
ALLOWED_ORIGINS=*
```

After Vercel deployment, replace it with the exact Vercel production URL.

## 3. Deploy React Web App

Recommended service: Vercel

```text
Root Directory: Project
Framework Preset: Vite
Install Command: npm install
Build Command: npm run build
Output Directory: dist
```

Required environment variables:

```env
VITE_API_BASE_URL=https://your-fastapi-server.onrender.com
VITE_AI_CHAT_URL=https://your-ai-chat-server.onrender.com
```

## 4. Demo QR

After Vercel deployment, use the Vercel production URL to create a QR code.

The QR code should point to:

```text
https://your-frontend.vercel.app
```

## 5. Arduino Demo

For the presentation, Arduino can be used as a visual device-control demo.

The web app should trigger appliance-control commands through the backend. The Arduino side can poll a lightweight backend endpoint or receive commands through your local bridge/server, depending on the hardware setup available on demo day.
