# FastAPI Backend Deployment

Recommended target: Render Web Service.

## Render Settings

```text
Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

`Procfile` is also included for platforms that read it automatically.

## Environment Variables

Set these in the hosting dashboard:

```env
DB_USERNAME=campus_25KDT_LG_3
DB_PASSWORD=your_db_password
DB_HOST=project-db-campus.smhrd.com
DB_PORT=3307
DB_NAME=campus_25KDT_LG_3
API_PUBLIC_BASE_URL=https://your-fastapi-server.onrender.com
BACKEND_ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

For quick test deployment, `BACKEND_ALLOWED_ORIGINS=*` can be used, but a real deployment should use the exact frontend URL.

## Health Check

After deploy:

```text
GET https://your-fastapi-server.onrender.com/api/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "FastAPI backend"
}
```

## Frontend Connection

Use the deployed backend URL in `Project` frontend environment variables:

```env
VITE_API_BASE_URL=https://your-fastapi-server.onrender.com
```
