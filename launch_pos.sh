#!/bin/bash
echo "Starting POS Offline Mode..."
# Ensure dependencies are installed (optional, can be slow)
# npm install

# Start the application in the background
npm run dev &

# Wait for a few seconds for the server to spin up
sleep 5

# Open the browser to the local POS URL
# Open Chrome in App mode with Kiosk Printing enabled (Silent Printing)
# We use a separate user-data-dir to ensure flags work even if Chrome is already open
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --kiosk-printing \
  --app=http://localhost:5173 \
  --user-data-dir="$HOME/.pos-chrome-profile"

echo "POS is now running at http://localhost:5173"
wait

