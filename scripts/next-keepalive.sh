#!/bin/bash
# Start Next.js and keep it running forever
cd /home/z/my-project

# Start Next.js dev server
node_modules/.bin/next dev -p 3000 &
NEXT_PID=$!
echo "Next.js PID: $NEXT_PID"
echo "$NEXT_PID" > /tmp/next-server.pid

# Wait for server to be ready
for i in $(seq 1 30); do
  if curl -s -o /dev/null http://localhost:3000/ 2>/dev/null; then
    echo "READY"
    break
  fi
  sleep 1
done

# Keep this script running by waiting on the Next.js process
wait $NEXT_PID 2>/dev/null
