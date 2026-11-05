#!/bin/bash
# Keep-alive script that restarts the Next.js server if it dies
cd /home/z/my-project

while true; do
  # Check if server is running on port 3000
  if ! curl -s -o /dev/null --connect-timeout 2 http://localhost:3000/ 2>/dev/null; then
    echo "[$(date)] Server not responding, (re)starting..."
    # Kill any leftover processes
    pkill -f "next dev" 2>/dev/null
    pkill -f "next-server" 2>/dev/null
    sleep 2
    
    # Start the server
    npx next dev -p 3000 &
    SERVER_PID=$!
    disown $SERVER_PID
    
    # Wait for it to be ready
    for i in $(seq 1 30); do
      if curl -s -o /dev/null --connect-timeout 2 http://localhost:3000/ 2>/dev/null; then
        echo "[$(date)] Server READY (PID: $SERVER_PID)"
        break
      fi
      sleep 1
    done
  fi
  
  sleep 5
done
