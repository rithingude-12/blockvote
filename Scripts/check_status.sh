#!/bin/bash

LOG_DIR="./logs"

echo "======================================"
echo "    BlockVote Services Status"
echo "======================================"

check_service() {
    SERVICE_NAME=$1
    PID_FILE="$LOG_DIR/$2.pid"
    PORT=$3

    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null; then
            echo -e "[\033[32mACTIVE\033[0m] $SERVICE_NAME is running on PID $PID (Port $PORT)"
        else
            echo -e "[\033[31mDEAD\033[0m]   $SERVICE_NAME crashed but PID file exists."
        fi
    else
        echo -e "[\033[33mOFFLINE\033[0m] $SERVICE_NAME is not running."
    fi
}

check_service "Ganache (Blockchain) " "ganache" "8545"
check_service "FastAPI (Backend)    " "backend" "8000"
check_service "React (Frontend)     " "frontend" "3000"

echo "======================================"
