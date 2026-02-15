#!/bin/bash
echo "Starting POS Offline Mode..."
# Ensure dependencies are installed (optional, can be slow)
# npm install

# Start the application in the background
npm run dev &

# Wait for a few seconds for the server to spin up
sleep 5

# Open the browser to the local POS URL
open http://localhost:5173

echo "POS is now running at http://localhost:5173"
wait

