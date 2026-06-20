set -e

skip_gresource=
gresource_target=
output="./build"
is_devel=true
version=`cat package.json | jq -r .version`
head=`command -v git 2>&1 > /dev/null && git rev-parse HEAD || echo $version`
udate=`date +%s`
appname="vibe"
appid="io.github.retrozinndev.Vibe"
entryfile=src/app.ts
srcroot=src

while getopts :g:o:rhj arg; do
    case "$arg" in
        g)
            gresource_target=${OPTARG}
            ;;
        j)
            skip_gresource=true
            ;;
        o)
            output=${OPTARG}
            ;;
        r)
            unset is_devel
            socket_support=true
            ;;
        h | ?)
            echo "\
$appname's build script. 
use the \"-r\" flag for release builds.

options: 
  -g \$file: tell $appname which path to search for the gresource (default: \`./build/gresource\`)
  -o \$path: build output directory (where build output is stored. default: \`./build\`)
  -j: skip gresource compiling step (useful for nix)
  -r: make a release build
  -h: show this help message"
            exit 0
            ;;
    esac
done

gresource_target=${gresource_target:-"$output/gresource"}

if [[ -d $output ]] && [[ ! -z `ls -A -w1 $output` ]]; then
    echo "[info] cleaning up"
    rm -r $output/*
else
    mkdir -p $output
fi

echo "[info] bundling"
{
    echo -e "#!/usr/bin/gjs -m\n"
    esbuild --bundle $entryfile \
      --source-root=$srcroot \
      --sourcemap=inline \
      --format="esm" \
      --target=firefox128 \
      --external:"gi://*" \
      --external:"resource://*" \
      --external:"console" \
      --external:"system" \
      --external:"gettext" \
      --define:"DEVEL=${is_devel:-"false"}" \
      --define:"VERSION='$version'" \
      --define:"GRESOURCE='$gresource_target'" \
      --define:"BUILD_DATE=$udate" \
      --define:"HEAD='$head'"

} > $output/$appname.js
sass data/styles/* $output/style.css

if [[ -z $skip_gresource ]]; then
    echo "[info] compiling gresource"
    glib-compile-resources data/$appid.gresource.xml \
        --sourcedir ./data \
        --target $output/gresource
fi

echo "[info] creating executable"
echo -en "\
#!/usr/bin/bash

mkdir -p \"\$XDG_RUNTIME_DIR/$appname\"
echo -n '`cat $output/$appname.js | base64`' | base64 --decode > \"\$XDG_RUNTIME_DIR/$appname/$appname\"
chmod +x "\$XDG_RUNTIME_DIR/$appname/$appname"

exec \$XDG_RUNTIME_DIR/$appname/$appname \$@
" > $output/$appname
chmod +x $output/$appname

