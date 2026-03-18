@echo off
chcp 65001 >nul
echo ================================================
echo   LRV Inmobiliaria — Iniciando aplicacion...
echo ================================================
echo.

:: ── Backend Node.js ──────────────────────────────
echo [1/2] Backend Node.js  (puerto 4000)
if not exist "d:\Programacion\LRV\backend-node\node_modules" (
  echo     Instalando dependencias...
  cd /d "d:\Programacion\LRV\backend-node"
  call npm install
)
start "LRV Backend" cmd /k "cd /d d:\Programacion\LRV\backend-node && node server.js"

timeout /t 2 /nobreak >nul

:: ── Frontend Vite ─────────────────────────────────
echo [2/2] Frontend Vite    (puerto 5173)
if not exist "d:\Programacion\LRV\node_modules" (
  echo     Instalando dependencias del frontend...
  cd /d "d:\Programacion\LRV"
  call npm install
)
start "LRV Frontend" cmd /k "cd /d d:\Programacion\LRV && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ================================================
echo   Listo! Abriendo el navegador...
echo   Admin: http://localhost:5173/admin/login
echo   API:   http://localhost:4000/api/health
echo ================================================
echo.
start http://localhost:5173
