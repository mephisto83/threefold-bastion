#!/bin/bash

# Maximum number of retries (optional, set to 0 for infinite)
MAX_RETRIES=100
count=0

echo "🔥 Starting robust Firebase deployment..."

while [ $count -lt $MAX_RETRIES ]; do
  echo "----------------------------------------"
  echo "Attempt $((count+1)) of $MAX_RETRIES"
  echo "----------------------------------------"
  
  # Run firebase deploy
  firebase deploy
  
  # Check exit code
  if [ $? -eq 0 ]; then
    echo "✅ Deployment completed successfully!"
    exit 0
  else
    echo "❌ Deployment failed or timed out."
    echo "🔄 Retrying in 5 seconds..."
    sleep 5
    count=$((count+1))
  fi
done

echo "❌ Failed after $MAX_RETRIES attempts."
exit 1
