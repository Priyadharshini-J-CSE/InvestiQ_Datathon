# InvertiQ – AI-Powered Crime Intelligence Platform

> Karnataka State Police | AI-Powered Crime Intelligence Platform

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Recharts |
| Backend | Node.js, Express.js, JWT, Multer |
| AI | Python, FastAPI, FAISS, Sentence Transformers, HuggingFace |

## Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### Backend
```bash
cd backend
npm install
node server.js
# → http://localhost:5000
```

### AI Layer
```bash
cd ai
pip install -r requirements.txt
uvicorn api:app --reload --port 8000
# → http://localhost:8000
# Swagger docs → http://localhost:8000/docs
```

## Demo Login

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Officer | `officer` | `officer123` |
| Investigator | `investigator` | `inv123` |

## Pages

- `/` – Overview / Landing
- `/dashboard` – Command Dashboard
- `/assistant` – AI Investigation Assistant
- `/search` – Smart Semantic Search
- `/analytics` – Crime Analytics
- `/features` – Platform Features
- `/profile/:id` – Criminal Profile

## Project Structure

```
InvertiQ/
├── frontend/        # React + Vite
├── backend/         # Express API
└── ai/              # FastAPI + RAG
```
