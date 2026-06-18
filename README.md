# Audito — LLM Privacy Leakage Auditing Platform

Detect data memorization and privacy leakage in large language models.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Recharts |
| Backend | FastAPI, Python 3.11 |
| Database | PostgreSQL (SQLAlchemy ORM) |
| Cache / Queue | Redis + Celery |
| AI/ML | sentence-transformers, FAISS, PyTorch |
| Reports | ReportLab PDF |

---

## Local Development (Docker — recommended)

### Prerequisites
- Docker Desktop installed and running
- Git

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/yourname/audito.git
cd audito

# 2. Set a secret key
echo "SECRET_KEY=your-secret-key-here" > .env

# 3. Start everything
docker compose up --build

# Frontend → http://localhost:3000
# Backend  → http://localhost:8000
# API docs → http://localhost:8000/docs
```

That's it. Docker will:
- Start PostgreSQL and create tables automatically
- Start Redis
- Build and start the FastAPI backend
- Build and start the Celery worker
- Build and start the Next.js frontend

---

## Local Development (Manual)

### Backend

```bash
cd backend

# 1. Create virtualenv
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set environment variables
cp .env.example .env
# Edit .env — fill in DATABASE_URL and SECRET_KEY

# 4. Start PostgreSQL and Redis (or use Docker just for these)
docker run -d -p 5432:5432 -e POSTGRES_USER=audito -e POSTGRES_PASSWORD=audito_pass -e POSTGRES_DB=audito postgres:16-alpine
docker run -d -p 6379:6379 redis:7-alpine

# 5. Start the API
uvicorn main:app --reload
# → http://localhost:8000/docs

# 6. In a separate terminal, start the Celery worker
celery -A workers.celery_app worker --loglevel=info
```

### Frontend

```bash
cd frontend
npm install
# Edit .env.local if needed (default points to localhost:8000)
npm run dev
# → http://localhost:3000
```

---

## Deployment

### Step 1 — Neon (PostgreSQL)

1. Go to https://neon.tech → create a free account
2. Create a new project called `audito`
3. Copy the connection string — looks like:
   ```
   postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/audito?sslmode=require
   ```
4. Save this — you'll use it as `DATABASE_URL`

---

### Step 2 — Upstash (Redis)

1. Go to https://upstash.com → create a free account
2. Create a new Redis database (region: same as your backend)
3. Copy the `REDIS_URL` — looks like:
   ```
   rediss://default:xxxxx@xxx.upstash.io:6379
   ```

---

### Step 3 — Railway (Backend + Celery Worker)

1. Go to https://railway.app → connect your GitHub account
2. Click **New Project → Deploy from GitHub repo**
3. Select your repo, set root directory to `/backend`
4. Railway auto-detects the Dockerfile

**Set these environment variables in Railway:**

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon connection string |
| `REDIS_URL` | Your Upstash Redis URL |
| `SECRET_KEY` | A random 32+ character string |
| `ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` |

5. Click **Deploy**
6. Once deployed, copy your Railway URL — e.g. `https://audito-backend.up.railway.app`

**Deploy the Celery Worker (second Railway service):**

1. In the same Railway project, click **+ New Service → GitHub Repo** (same repo)
2. Set root directory to `/backend`
3. Override the start command:
   ```
   celery -A workers.celery_app worker --loglevel=info --concurrency=2
   ```
4. Set the same environment variables as the backend service

---

### Step 4 — Vercel (Frontend)

1. Go to https://vercel.com → connect your GitHub account
2. Click **New Project → Import** your repo
3. Set root directory to `/frontend`
4. Add environment variable:
   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_API_URL` | Your Railway backend URL (e.g. `https://audito-backend.up.railway.app`) |
5. Click **Deploy**

**Important:** After deploying, go to your Railway backend → Environment Variables and update:
- Add `ALLOWED_ORIGINS=https://your-vercel-app.vercel.app`

Then update `backend/main.py` CORS to read from env:
```python
allow_origins=[os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")]
```

---

## Environment Variables Reference

### Backend `.env`

```env
DATABASE_URL=postgresql://user:pass@host:5432/audito
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-random-secret-key-at-least-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
UPLOAD_DIR=uploads
FAISS_INDEX_DIR=faiss_indexes
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Project Structure

```
audito/
├── frontend/                    # Next.js 15 app
│   ├── app/
│   │   ├── (auth)/login/        # Sign in page
│   │   ├── (auth)/register/     # Register page
│   │   ├── dashboard/           # Analytics dashboard
│   │   ├── projects/            # Project list + detail
│   │   ├── audits/              # Audit history
│   │   └── notifications/       # Notifications
│   ├── components/
│   │   ├── layout/              # Sidebar, AppShell
│   │   └── ui/                  # Button, Card, Badge, Input, ProgressBar
│   ├── lib/                     # API client, auth helpers, utils
│   └── types/                   # TypeScript types
│
├── backend/
│   ├── api/routes/              # FastAPI route handlers
│   ├── models/                  # SQLAlchemy DB models
│   ├── services/                # Audit orchestrator
│   ├── detection/               # Exact match + sensitive data engines
│   ├── similarity/              # FAISS semantic similarity engine
│   ├── membership/              # Membership inference engine
│   ├── exposure/                # Canary exposure engine
│   ├── scoring/                 # Risk scoring engine
│   ├── reports/                 # PDF report generator
│   ├── workers/                 # Celery tasks
│   ├── utils/                   # Auth, logger, dataset loader
│   └── main.py                  # FastAPI app entry point
│
└── docker-compose.yml
```

---

## How It Works

1. User creates a project (model name + description)
2. User uploads two datasets:
   - **Reference dataset** — potential training data (CSV/JSON/TXT)
   - **Generated outputs** — model responses to audit
3. User clicks **Run audit**
4. Backend launches a Celery background task that runs 6 engines:
   - **Exact Match** — string + n-gram + Levenshtein comparison
   - **Semantic Similarity** — sentence-transformers embeddings + FAISS search
   - **Membership Inference** — token frequency + n-gram phrase overlap
   - **Canary Exposure** — regex + exact string detection of secret strings
   - **Sensitive Data** — regex patterns for emails, SSNs, API keys, etc.
   - **Risk Scoring** — weighted combination → 0-100 score + Low/Medium/High/Critical
5. Results appear in real-time on the project page (3s polling)
6. User can download a PDF report

---

## Generating a Secret Key

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```
