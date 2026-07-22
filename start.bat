@echo off
echo ============================================================
echo  InvestiQ AI - Starting All Services
echo ============================================================
echo.

echo [1/3] Starting Python RAG API on port 5001...
start "InvestiQ Python API" cmd /k "cd /d %~dp0model && python api.py"

timeout /t 4 /nobreak >nul

echo [2/3] Starting Node.js Backend on port 5000...
start "InvestiQ Node Backend" cmd /k "cd /d %~dp0backend && npm run dev"

timeout /t 2 /nobreak >nul

echo [3/3] Starting React Frontend on port 3000...
start "InvestiQ Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ============================================================
echo  All services starting:
echo    Python API  -> http://localhost:5001/health
echo    Node API    -> http://localhost:5000
echo    Frontend    -> http://localhost:3000
echo ============================================================
