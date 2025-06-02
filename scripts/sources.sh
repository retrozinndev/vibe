scripts_dir="scripts"

function run_deps() {
    [[ -z $deps ]] && return

    for dep in ${deps[@]}; do
        echo "Running dependency \"$(echo "$dep" | sed -e 's/\.sh$//')\"..."
        sh "$scripts_dir/$dep" $@
    done
}
