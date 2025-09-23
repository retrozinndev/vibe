
set -e

output="./build"
esbuild="esbuild"

while getopts r:o:e:c:bdh args; do
    case "$args" in
        r) 
            gresources_target=${OPTARG}
            ;;
        b) 
            keep_gresource=true
            ;;
        o)
            output=${OPTARG}
            ;;
        e)
            esbuild=${OPTARG}
            ;;
        d)
            is_devel=true
            ;;
        h)
            echo "\
Vibe's build script. 
Please use \`build:release\` for release builds.

Options: 
  -r \$file: specify gresource's target path (default: \`\$output/resources.gresource\`)
  -o \$path: specify the build's output directory (default: \`./build\`)
  -e \$exec: specify where's the esbuild binary (default: \`env esbuild\`)
  -b: only target gresource in the build, keeping the file in the output dir
  -d: enable developer mode in the build
  -h: show this help message"
            exit 0
            ;;
    esac
done

sh ./scripts/clean.sh

mkdir -p $output

echo "[info] compiling sass in \`./build/resources/style.css\`"
sass --no-source-map -I ./resources/styles resources/styles/style.scss build/resources/style.css

echo "[info] compiling gresource"
gres_target=`[[ "$keep_gresource" ]] && echo -n "$output/resources.gresource" || \
    echo -n "${gresources_target:-$output/resources.gresource}"`
[[ ! "$keep_gresource" ]] && mkdir -p `dirname "$gres_target"`
glib-compile-resources resources.gresource.xml \
    --sourcedir . \
    --target "$gres_target"

echo "[info] bundling project"
find ./src/**/*.ts* | sed -e 's/.*/import ".&";/' > $output/concat.ts
$esbuild --bundle $output/concat.ts \
    --outfile=$output/vibe.js \
    --source-root=./src \
    --sourcemap=inline \
    --format="esm" \
    --target=firefox128 \
    --external:"gi://*" \
    --external:"resource://*" \
    --external:"console" \
    --external:"system" \
    --external:"gettext" \
    --define:"DEVEL=`[[ $is_devel ]] && echo -n true || echo -n false`" \
    --define:"VIBE_VERSION='`cat package.json | jq -r .version`'" \
    --define:"GRESOURCES_FILE='${gresources_target:-$output/resources.gresource}'" 

echo "[info] creating executable"
echo -en "\
#!/usr/bin/bash

runtime_dir=\${XDG_RUNTIME_DIR:-\"/run/user/\$(id -u)\"}/vibe
file=\"\$runtime_dir/app.js\"

mkdir -p \"\$runtime_dir\"

echo -n '`cat $output/vibe.js | base64`' | base64 --decode > \"\$file\"
gjs -m \"\$file\"
" > $output/vibe
chmod +x $output/vibe
