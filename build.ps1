# Electron Build Script for Windows (PowerShell)
# This script builds the Electron app for Windows

param(
    [ValidateSet('mac', 'win')]
    [string]$Platform
)

# Enable error handling
$ErrorActionPreference = "Stop"

Write-Host "Building Bachat Bazaar Electron App..." -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# Check if Node.js is installed
$nodeVersion = node --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green

# Check if npm is installed
$npmVersion = npm --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "npm is not installed. Please install npm first." -ForegroundColor Red
    exit 1
}

Write-Host "npm version: $npmVersion" -ForegroundColor Green
Write-Host ""

try {
    Write-Host "Step 1: Installing root dependencies..." -ForegroundColor Yellow
    npm install
    
    Write-Host "Step 2: Installing client dependencies..." -ForegroundColor Yellow
    Push-Location client
    npm install
    Pop-Location
    
    Write-Host "Step 3: Installing server dependencies..." -ForegroundColor Yellow
    Push-Location server
    npm install
    Pop-Location
    
    Write-Host "Step 4: Building client..." -ForegroundColor Yellow
    npm run client-build
    
    Write-Host "Step 5: Building Electron app..." -ForegroundColor Yellow
    
    if ($Platform -eq 'mac') {
        Write-Host "Building for macOS..." -ForegroundColor Cyan
        npm run electron-pack -- --mac
    } elseif ($Platform -eq 'win') {
        Write-Host "Building for Windows..." -ForegroundColor Cyan
        npm run electron-pack -- --win
    } else {
        Write-Host "Usage: .\build.ps1 -Platform [mac|win]" -ForegroundColor Yellow
        Write-Host "Building for Windows (default)..." -ForegroundColor Cyan
        npm run electron-pack -- --win
    }
    
    Write-Host ""
    Write-Host "Build complete!" -ForegroundColor Green
    Write-Host "Output files are in the 'dist' directory." -ForegroundColor Green
}
catch {
    Write-Host "Build failed: $_" -ForegroundColor Red
    exit 1
}
