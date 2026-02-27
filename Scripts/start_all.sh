#!/bin/bash

# Configuration
LOG_DIR="./logs"
mkdir -p $LOG_DIR

echo "======================================"
echo "    BlockVote Startup Sequence"
echo "======================================"

# 1. Start Ganache (Blockchain)
echo "[1/3] Starting Ganache locally on port 8545..."
npx ganache-cli --port 8545 --networkId 1337 --deterministic > $LOG_DIR/ganache_output.log 2>&1 &
GANACHE_PID=$!
echo $GANACHE_PID > $LOG_DIR/ganache.pid
echo "      -> Ganache PID: $GANACHE_PID"
sleep 2 # Wait for ganache to init

# 2. Start Backend (FastAPI)
echo "[2/3] Starting FastAPI Backend on port 8000..."
cd backend
# Check if venv exists and activate it, otherwise run globally
if [ -d "venv" ]; then
    source venv/bin/activate || source venv/Scripts/activate
fi
uvicorn app.main:app --host 0.0.0.0 --port 8000 > ../$LOG_DIR/backend_output.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../$LOG_DIR/backend.pid
cd ..
echo "      -> Backend PID: $BACKEND_PID"
sleep 2

# 3. Start Frontend (React)
echo "[3/3] Starting React Frontend on port 3000..."
cd frontend
npm start > ../$LOG_DIR/frontend_output.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../$LOG_DIR/frontend.pid
cd ..
echo "      -> Frontend PID: $FRONTEND_PID"

echo "======================================"
echo "All BlockVote services are running in the background."
echo "Use 'bash Scripts/check_status.sh' to verify."
echo "Use 'bash Scripts/stop_all.sh' to terminate."
echo "======================================"
