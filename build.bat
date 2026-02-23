@echo off
REM Electron Build Script for Windows
REM This script builds the Electron app for Windows

setlocal enabledelayedexpansion

echo Building Bachat Bazaar Electron App...
echo =======================================

REM Check if Node.js is installed
where node >nul 2>&1
if errorlevel 1 (
    echo Node.js is not installed. Please install Node.js first.
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>&1
if errorlevel 1 (
    echo npm is not installed. Please install npm first.
    exit /b 1
)

echo Step 1: Installing root dependencies...
call npm install
if errorlevel 1 goto error

echo Step 2: Installing client dependencies...
cd client
call npm install
cd ..
if errorlevel 1 goto error

echo Step 3: Installing server dependencies...
cd server
call npm install
cd ..
if errorlevel 1 goto error

echo Step 4: Building client...
call npm run client-build
if errorlevel 1 goto error

echo Step 5: Building Electron app...
if "%1"=="mac" (
    echo Building for macOS...
    call npm run electron-pack -- --mac
) else if "%1"=="win" (
    echo Building for Windows...
    call npm run electron-pack -- --win
) else (
    echo Usage: build.bat [mac^|win^]
    call npm run electron-pack -- --mac
)

if errorlevel 1 goto error

echo.
echo Build complete!
echo Output files are in the 'dist' directory.
exit /b 0

:error
echo.
echo Build failed with error code %errorlevel%
exit /b 1
