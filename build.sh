#!/bin/bash

# Electron Build Script for macOS and Windows
# This script builds the Electron app for both platforms

set -e  # Exit on error

echo "Building Bachat Bazaar Electron App..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we have Node.js and npm
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed. Please install npm first.${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Installing root dependencies...${NC}"
npm install

echo -e "${YELLOW}Step 2: Installing client dependencies...${NC}"
cd client
npm install
cd ..

echo -e "${YELLOW}Step 3: Installing server dependencies...${NC}"
cd server
npm install
cd ..

echo -e "${YELLOW}Step 4: Building client...${NC}"
npm run client-build

echo -e "${YELLOW}Step 5: Building Electron app...${NC}"

# Platform selection
if [ "$1" == "mac" ]; then
    echo -e "${YELLOW}Building for macOS...${NC}"
    npm run electron-pack -- --mac
elif [ "$1" == "win" ]; then
    echo -e "${YELLOW}Building for Windows...${NC}"
    npm run electron-pack -- --win
elif [ "$1" == "all" ]; then
    echo -e "${YELLOW}Building for all platforms...${NC}"
    npm run electron-pack -- --mac --win
else
    echo -e "${YELLOW}Usage: $0 [mac|win|all]${NC}"
    echo -e "${YELLOW}Building for current platform (macOS)...${NC}"
    npm run electron-pack
fi

echo -e "${GREEN}Build complete!${NC}"
echo -e "${YELLOW}Output files are in the 'dist' directory.${NC}"
