set -e

builddir="${1:-./build}"

if [[ -d $builddir ]]; then
    echo "[info] cleaning build dir: \"$builddir\""
    rm -r "$builddir"
else
    echo "[info] build dir doesn't exist or is not accessible, skipped"
fi
