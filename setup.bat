@echo off
setlocal enabledelayedexpansion
title AppForge Setup
color 0A

echo.
echo  ============================================
echo    AppForge - Complete Setup Script
echo  ============================================
echo.
echo  This will:
echo    1. Install all npm packages
echo    2. Generate Prisma client
echo    3. Create SQLite database
echo    4. Seed demo data
echo    5. Start the dev server
echo.
echo  Press any key to start...
pause > nul

cd /d "%~dp0"
echo.
echo  Working directory: %CD%
echo.

REM ── Step 1: npm install ────────────────────────────────────────
echo [1/5] Installing packages (may take 3-5 minutes)...
echo       Running: npm install --legacy-peer-deps
echo.
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: npm install failed!
    echo  Try running manually: npm install --legacy-peer-deps
    pause
    exit /b 1
)
echo.
echo  [1/5] DONE - Packages installed
echo.

REM ── Step 2: prisma generate ────────────────────────────────────
echo [2/5] Generating Prisma client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: prisma generate failed!
    pause
    exit /b 1
)
echo  [2/5] DONE - Prisma client generated
echo.

REM ── Step 3: prisma db push ─────────────────────────────────────
echo [3/5] Creating SQLite database (prisma/dev.db)...
call npx prisma db push --accept-data-loss
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: prisma db push failed!
    pause
    exit /b 1
)
echo  [3/5] DONE - Database created
echo.

REM ── Step 4: seed ───────────────────────────────────────────────
echo [4/5] Seeding demo data...
call npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" prisma/seed.ts
if %errorlevel% neq 0 (
    echo.
    echo  WARNING: Seeding failed - you can still register manually
    echo  To seed later: npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" prisma/seed.ts
)
echo  [4/5] DONE - Demo data seeded
echo.

REM ── Step 5: dev server ─────────────────────────────────────────
echo  ============================================
echo    Setup complete!
echo  ============================================
echo.
echo  Demo login:
echo    URL:      http://localhost:3000/login
echo    Email:    demo@appforge.dev
echo    Password: password123
echo.
echo  Starting development server...
echo  Press Ctrl+C to stop
echo.
call npm run dev
