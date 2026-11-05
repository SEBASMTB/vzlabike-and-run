#!/bin/bash
# Start Next.js dev server as a persistent daemon
cd /home/z/my-project

# Kill any existing server on port 3000
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null
sleep 1

# Start the dev server with nohup, redirect output, and disown
nohup npx next dev -p 3000 > /tmp/next-server.log 2>&1 &
SERVER_PID=$!
disown $SERVER_PID

echo "Server started with PID: $SERVER_PID"

# Wait for it to be ready
for i in {1..30}; do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null | grep -q "200"; then
    echo "Server is ready and responding on port 3000"
    echo $SERVER_PID > /tmp/next-server.pid
    exit 0
  fi
  sleep 1
done

echo "Server failed to start within 30 seconds"
exit 1
