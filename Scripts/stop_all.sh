#!/bin/bash

LOG_DIR="./logs"

echo "======================================"
echo "    Stopping BlockVote Services"
echo "======================================"

# Function to kill process if PID file exists
kill_service() {
    SERVICE_NAME=$1
    PID_FILE="$LOG_DIR/$2.pid"

    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null; then
            echo "Stopping $SERVICE_NAME (PID: $PID)..."
            kill $PID
            rm "$PID_FILE"
        else
            echo "$SERVICE_NAME is not running (PID $PID dead)."
            rm "$PID_FILE"
        fi
    else
        echo "$SERVICE_NAME process track file not found."
    fi
}

kill_service "Frontend (React)" "frontend"
kill_service "Backend (FastAPI)" "backend"
kill_service "Blockchain (Ganache)" "ganache"

# Failsafe port cleanup (Windows via WSL / Linux)
echo "Running failsafe port cleanup..."
kill -9 $(lsof -t -i:3000) 2>/dev/null
kill -9 $(lsof -t -i:8000) 2>/dev/null
kill -9 $(lsof -t -i:8545) 2>/dev/null

echo "======================================"
echo "All BlockVote services have been stopped."
echo "======================================"
