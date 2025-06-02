source ./scripts/sources.sh

deps=(types.sh)
esbuild_file="esbuild.config.js"

run_deps

VIBE_BUNDLER=$([[ ! -z VIBE_BUNDLER ]] && echo "node" || echo "$VIBE_BUNDLER")

echo "Starting build..."
$VIBE_BUNDLER "$esbuild_file"

echo "Compiling Sass..."
npx sass --no-source-map src/styles:build

echo "Done!"
