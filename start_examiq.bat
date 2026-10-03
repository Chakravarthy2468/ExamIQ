@echo off
echo =======================================
echo      Starting ExamIQ Project
echo =======================================

echo.
echo [1/2] Preparing Backend...
cd backend
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)
echo Installing requirements...
call venv\Scripts\activate.bat
pip install -r requirements.txt
echo Starting backend server in a new window...
start "ExamIQ Backend" cmd /k "venv\Scripts\activate.bat & uvicorn app.main:app --reload"

echo.
echo [2/2] Preparing Frontend...
cd ../frontend
echo Installing node modules...
call npm install
echo Starting frontend server in a new window...
start "ExamIQ Frontend" cmd /k "npm run dev"

cd ..
echo.
echo Both servers are starting up! 
echo Keep the two new windows open to keep the servers running.
echo You can safely close this window.
pause
