#!/bin/sh
# Build the web app without pulling the folder out from under the running server.
set -e
cd "$(dirname "$0")/app"
EXPO_OFFLINE=1 CI=1 npx expo export -p web --output-dir dist-tmp > /tmp/expo-export.log 2>&1 || { tail -30 /tmp/expo-export.log; exit 1; }
mkdir -p dist
find dist -mindepth 1 -delete; cp -r dist-tmp/. dist/
rm -rf dist-tmp
echo "web build ok"
