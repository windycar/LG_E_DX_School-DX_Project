
  # Pregnancy Support App

  This is a code bundle for Pregnancy Support App. The original project is available at https://www.figma.com/design/wVprXREGHxxmrLxPsnH6np/Pregnancy-Support-App.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

## Deployment Setup

Create an environment file for local development:

```powershell
Copy-Item .env.example .env
```

For Vercel or another static hosting service, set these environment variables in the hosting dashboard:

```env
VITE_API_BASE_URL=https://your-fastapi-server.onrender.com
VITE_AI_CHAT_URL=https://your-ai-chat-server.onrender.com
```

Build command:

```powershell
npm run build
```

Output directory:

```text
dist
```

The React app is static, but the app features require the FastAPI backend and AI_Chat server to be deployed separately.

## Vercel Setup

Use these settings when creating the Vercel project:

```text
Root Directory: Project
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

Add these environment variables after the backend services are deployed:

```env
VITE_API_BASE_URL=https://your-fastapi-server.onrender.com
VITE_AI_CHAT_URL=https://your-ai-chat-server.onrender.com
```

`vercel.json` is included so direct page refreshes route back to the React app instead of returning 404.
  
