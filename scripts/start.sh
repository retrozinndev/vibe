source ./scripts/sources.sh

deps=(build.sh)
run_deps

echo "Starting app"
gjs -m "../build/main.js"
