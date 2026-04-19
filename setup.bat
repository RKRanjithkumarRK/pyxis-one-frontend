@echo off
echo =========================================
echo   Pyxis One — Frontend Setup
echo =========================================
echo.

:: Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Install from nodejs.org
    pause
    exit /b 1
)

:: Install dependencies
echo [1/2] Installing npm dependencies...
npm install
if errorlevel 1 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

:: Write .env.local
echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local

echo.
echo [2/2] Starting frontend dev server...
echo.
echo Frontend will run at: http://localhost:3000
echo.
start "" http://localhost:3000
npm run dev
