#!/bin/bash
set -e

# Start backend
cd /app/backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 &

# Start frontend
cd /app/frontend
yarn install
yarn start
