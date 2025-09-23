set -e

socket_support=true

while getopts o:r:e:hn args; do
    case "$args" in 
        o)
            outdir=${OPTARG}
            ;;
        r)
            gresource_file=${OPTARG}
            ;;
        e)
            bin_target=${OPTARG}
            ;;
        n)
            unset socket_support
            ;;
        ? | h)
            echo "\
Vibe's automated release-build script.

help:
  'literal': the argument should have environment variables sent as a literal string, 
  they're replaced at runtime.
  'default': argument's default value, they're used if none are provided.

options:
  -r \$file: gresource's target path (literal; kept in \$output; default: /usr/share/vibe/resources.gresource)
  -n: disable socket communication support(use the slower remote instance communication)
  -o \$path: build output path (default: \`./build/release\`)
  -e: set desktop entry's executable target (literal; default: /usr/bin/vibe)
  -h: show this help message"
            exit 0
            ;;
    esac
done

# send literal variable name, so it's interpreted at runtime
bash ./scripts/build.sh -o "${outdir:-./build/release}" -b -r "${gresource_file:-/usr/share/vibe/resources.gresource}"

echo "[info] making desktop entry"
entry=`cat ./resources/io.github.retrozinndev.vibe.desktop`
bin_target=${bin_target:-'/usr/bin/vibe'}
echo -n "${entry/'$VIBE_BINARY'/${bin_target/'$'/'\\\$'}}" > ${outdir:-./build/release}/io.github.retrozinndev.vibe.desktop
