file="${1:-./build/vibe}"

function start() {
    echo "[info] starting"
    exec "$file"
}

if [[ -f $file ]]; then
    start
else
    echo "[error] can't start project: no executable found on default directory"
    echo "[tip] specify the executable path: start \"\$path\""
    exit 1
fi
