#!/bin/bash

# Electron Build Script for macOS and Windows
# This script builds the Electron app for both platforms

set -e  # Exit on error

# Navigate to the root directory
cd "$(dirname "$0")/.."

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

echo -e "${YELLOW}Step 4: Generating Prisma Client...${NC}"
cd server
npx prisma generate
cd ..

echo -e "${YELLOW}Step 5: Building React Client...${NC}"
npm run client-build

echo -e "${YELLOW}Step 5: Building Electron app...${NC}"

# Platform selection
if [ "$1" == "mac" ]; then
    echo -e "${YELLOW}Building for macOS...${NC}"
    npm run electron-pack -- --mac
elif [ "$1" == "win" ]; then
    echo -e "${YELLOW}Building for Windows...${NC}"
    npm run electron-pack -- --win
else
    echo -e "${YELLOW}Usage: $0 [mac|win]${NC}"
    echo -e "${YELLOW}Building for current platform (macOS)...${NC}"
    npm run electron-pack -- --mac
fi

echo -e "${GREEN}Build complete!${NC}"
echo -e "${YELLOW}Output files are in the 'dist' directory.${NC}"
