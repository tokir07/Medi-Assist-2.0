# MediAssist 2.0 — Production Vendor Deployment Guide (Render)

This guide provides the complete setup for deploying **MediAssist 2.0** to **Render** (`render.com`), locking in Render as the single unified vendor for hosting the **Frontend Web Application**, **FastAPI Backend Service**, and **Managed PostgreSQL Database**.

---

## Architecture & Locked-In Vendor Infrastructure

| Component | Technology | Render Service Type | Production Build / Run Command |
| :--- | :--- | :--- | :--- |
| **Database** | PostgreSQL 16 | Managed PostgreSQL | Automated Managed Database |
| **Backend** | Python 3.11 / FastAPI | Web Service | `pip install -r backend/requirements.txt`<br>`cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Frontend** | Vite + React + TypeScript | Static Site | `cd frontend && npm install && npm run build`<br>Publish directory: `frontend/dist` |

---

## 1. Environment Variables Configuration

### Backend Environment Variables (`backend/.env`)

Configure the following variables in the **Render Web Service Environment Settings**:

| Variable Name | Description / Recommended Value | Example Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string (auto-wired via Render Blueprint or Internal Connection String) | `postgresql://postgres:password@dpg-xxx-a:5432/mediassist` |
| `JWT_SECRET_KEY` | High-entropy secret key for signing JWT tokens | `generate_random_64_char_secret_key` |
| `JWT_ALGORITHM` | Algorithm used for JWT signing | `HS256` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime in minutes (default 7 days) | `10080` |
| `AI_PROVIDER` | AI Service Gateway Provider (`openrouter` or `mock`) | `openrouter` |
| `OPENROUTER_API_KEY` | OpenRouter API key for LLM pre-consultation & summaries | `sk-or-v1-xxxxxxxxxxxxxxxxxxxx` |
| `OPENROUTER_BASE_URL` | OpenRouter endpoint | `https://openrouter.ai/api/v1` |
| `OPENROUTER_MODEL` | Default AI Model identifier | `openai/gpt-4o-mini` |
| `OPENROUTER_HTTP_REFERER` | Site domain header sent to OpenRouter | `https://mediassist.onrender.com` |
| `OPENROUTER_APP_NAME` | Site app name header sent to OpenRouter | `MediAssist` |
| `STT_PROVIDER` | Speech-to-Text provider (`openai`, `groq`, or `mock`) | `mock` (or `openai` if API key set) |
| `TTS_PROVIDER` | Text-to-Speech provider (`openai` or `mock`) | `mock` (or `openai` if API key set) |
| `AI_TIMEOUT_SECONDS` | Maximum timeout for AI gateway calls | `30` |
| `AI_MAX_RETRIES` | Max retries for AI calls | `2` |
| `CORS_ORIGINS` | JSON list or allowed origins for Cross-Origin Requests | `["https://mediassist-frontend.onrender.com"]` |

---

### Frontend Environment Variables (`frontend/.env`)

Configure in the **Render Static Site Environment Settings**:

| Variable Name | Description | Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | Complete public URL to the deployed FastAPI backend API root | `https://mediassist-backend.onrender.com/api` |

---

## 2. Deployment Instructions on Render Vendor

### Method A: One-Click Blueprint Deployment (Recommended)

MediAssist 2.0 includes a production-ready `render.yaml` Blueprint file at the repository root.

1. Push your code to a **GitHub** or **GitLab** repository.
2. Sign in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** in the top-right corner and select **Blueprint**.
4. Connect your MediAssist 2.0 repository.
5. Render will automatically detect `render.yaml` and prompt you to create 3 connected resources:
   - **`mediassist-db`** (Managed PostgreSQL Database)
   - **`mediassist-backend`** (Python FastAPI Web Service)
   - **`mediassist-frontend`** (Static Web Application)
6. Fill in `OPENROUTER_API_KEY` when prompted in the environment variable input phase.
7. Click **Apply**. Render will build and deploy all services automatically!

---

### Method B: Step-by-Step Manual UI Deployment

If you prefer deploying services individually through the Render Dashboard:

#### Step 1: Deploy the Database (PostgreSQL)
1. Click **New +** -> **PostgreSQL**.
2. **Name**: `mediassist-db`
3. **Database Name**: `mediassist`
4. **User**: `postgres`
5. **Region**: Select your nearest region (e.g., Singapore, Oregon, Frankfurt).
6. **Plan**: Free or Starter.
7. Click **Create Database**.
8. Copy the **Internal Database URL** (e.g., `postgresql://postgres:password@dpg-xxx-a:5432/mediassist`).

---

#### Step 2: Deploy the Backend API (FastAPI)
1. Click **New +** -> **Web Service**.
2. Connect your Git repository.
3. Configuration:
   - **Name**: `mediassist-backend`
   - **Environment**: `Python`
   - **Region**: Same region as database.
   - **Branch**: `main`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Expand **Advanced** -> **Environment Variables**:
   - Add `DATABASE_URL` with the Internal Database URL from Step 1.
   - Add `JWT_SECRET_KEY` (generate a random secure string).
   - Add `OPENROUTER_API_KEY` (your key).
   - Add `CORS_ORIGINS` = `["*"]` (or update after deploying frontend).
5. Click **Create Web Service**. Once deployed, copy your backend URL (e.g., `https://mediassist-backend.onrender.com`).

---

#### Step 3: Deploy the Frontend (Vite + React Static Site)
1. Click **New +** -> **Static Site**.
2. Connect your Git repository.
3. Configuration:
   - **Name**: `mediassist-frontend`
   - **Branch**: `main`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `./frontend/dist`
4. Expand **Environment Variables**:
   - Add `VITE_API_URL` = `https://mediassist-backend.onrender.com/api`
5. Expand **Redirects / Rewrites**:
   - Add Rule: **Rewrite**
   - **Source**: `/*`
   - **Destination**: `/index.html`
6. Click **Create Static Site**.

---

## 3. Database Initialization & Seeding

When the database is provisioned for the first time, run the seed script to create initial schema tables and populate default system records (Admin, Doctor, and Patient accounts).

### Running Seed via Render Shell (One-Time Execution):
1. In Render Dashboard, navigate to **`mediassist-backend`**.
2. Click **Shell** tab on the left sidebar.
3. Run the following command:
   ```bash
   python backend/seed.py
   ```
4. Output will confirm creation of initial test credentials:
   - **System Admin**: `admin@mediassist` / `Password123!`
   - **Doctor Account**: `doctor@mediassist.test` / `Doctor@123`
   - **Patient Account**: `patient@mediassist.test` / `Patient@123`

---

## 4. Verification & Health Checks

Once deployment completes, verify the setup using these endpoints:

1. **Backend Root Health Check**:
   ```
   GET https://mediassist-backend.onrender.com/
   ```
   Expected response:
   ```json
   {
     "app": "MediAssist API",
     "status": "running",
     "docs": "/docs",
     "health": "/api/auth/health"
   }
   ```

2. **Interactive OpenAPI / Swagger Documentation**:
   ```
   https://mediassist-backend.onrender.com/docs
   ```

3. **Frontend Application**:
   Navigate to `https://mediassist-frontend.onrender.com` in your browser. Test logging in with `patient@mediassist.test` / `Patient@123` or `doctor@mediassist.test` / `Doctor@123`.

---

## 5. Security & Maintenance Best Practices

- **Enable Auto-Deploy**: Render automatically deploys new commits pushed to the `main` branch.
- **SSL / HTTPS**: Render automatically provisions free TLS/SSL certificates for custom domains and `*.onrender.com` subdomains.
- **CORS Protection**: Update `CORS_ORIGINS` in your backend environment variables to strictly restrict API access to `["https://mediassist-frontend.onrender.com"]`.
