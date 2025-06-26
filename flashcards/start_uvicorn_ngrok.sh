#!/bin/bash

# Start Uvicorn on port 8000 in the background
uvicorn src.ai_generation:app --host 0.0.0.0 --port 8000 &
UVICORN_PID=$!  # Store the PID of the Uvicorn process

# Start ngrok with a reserved subdomain
ngrok http --url=https://marlin-excited-gibbon.ngrok-free.app 8000 & # Start ngrok in the background
NGROK_PID=$!      # Store the PID of the ngrok process

# Function to clean up the processes
cleanup() {
    echo "Stopping Uvicorn and ngrok..."
    kill -TERM "$UVICORN_PID" 2>/dev/null
    kill -TERM "$NGROK_PID" 2>/dev/null
    wait "$UVICORN_PID" 2>/dev/null
    wait "$NGROK_PID" 2>/dev/null
    echo "Stopped."
}

# Trap the EXIT signal to ensure cleanup occurs on script exit
trap cleanup EXIT

# Wait for user input or other conditions to terminate the script
echo "Press [CTRL+C] to stop."
while true; do
    sleep 1  # Keep the script running
done