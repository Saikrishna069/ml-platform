# 🚀 100% Free Production Deployment Guide (Zero Cost Forever)

This guide provides step-by-step instructions for deploying your **Enterprise ML Platform** to professional cloud platforms for **$0/month**.

---

## 🌟 Architecture (Free Tier Stack)

| Component | Platform | Free Features | Cost |
|-----------|----------|---------------|------|
| **Frontend** | [Vercel](https://vercel.com) | Global Edge CDN, Free SSL, Unlimited deploys | **$0/mo** |
| **Backend API** | [Render](https://render.com) | Free Web Service, Automatic HTTPS, Python 3.11 | **$0/mo** |
| **Database** | Render SQLite / PostgreSQL | Free tier storage & database connection | **$0/mo** |

---

## 🛠️ Step 1: Deploy Backend to Render (Free)

1. Push your project code to **GitHub**.
2. Sign up / Log in to [Render.com](https://render.com).
3. Click **New +** -> **Blueprints**.
4. Connect your GitHub repository.
5. Render will automatically detect [`render.yaml`](file:///c:/Users/RADHARAPU%20SAIKRISHNA/Downloads/datasets%20analysis/render.yaml) in the root directory.
6. Click **Apply Blueprint**.
7. Render will build and deploy your FastAPI backend automatically.
8. Copy your live backend URL (e.g., `https://ml-platform-backend.onrender.com`).

---

## ⚡ Step 2: Deploy Frontend to Vercel (Free)

1. Sign up / Log in to [Vercel.com](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository.
4. Set **Root Directory** to `frontend`.
5. Under **Environment Variables**, add:
   - Name: `VITE_API_URL`
   - Value: `https://ml-platform-backend.onrender.com` (Your Render URL)
6. Click **Deploy**.
7. Vercel will build and assign your live domain (e.g., `https://ml-platform.vercel.app`).

---

## 🔒 Verification & Live Check

- **Frontend Live URL**: `https://ml-platform.vercel.app`
- **Backend API Docs (Swagger)**: `https://ml-platform-backend.onrender.com/docs`
- **Health Check**: `https://ml-platform-backend.onrender.com/health`

---

## 🖥️ Local Live Test (Run Immediately on your machine)

To run the full stack locally with a live hot-reload server right now:

```bash
# Terminal 1: Backend
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

Open your browser at `http://localhost:5173`.
