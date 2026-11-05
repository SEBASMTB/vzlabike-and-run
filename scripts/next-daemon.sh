#!/bin/bash
# Persistent Next.js dev server daemon
# Uses an infinite loop to restart the server if it crashes
LOG="/tmp/next-daemon.log"
PIDFILE="/tmp/next-dev.pid"

while true; do
  cd /home/z/my-project
  echo "[$(date)] Starting Next.js dev server..." >> "$LOG"
  node_modules/.bin/next dev -p 3000 >> "$LOG" 2>&1 &
  SERVER_PID=$!
  echo "$SERVER_PID" > "$PIDFILE"
  echo "[$(date)] Server started with PID $SERVER_PID" >> "$LOG"
  
  # Wait for the server to exit
  wait $SERVER_PID 2>/dev/null
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE, restarting in 3s..." >> "$LOG"
  sleep 3
done
