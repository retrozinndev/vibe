set -e

echo -n "Clean \`$(pwd)/build/\`? [y/n] "
read answer

if [[ $answer =~ "y" ]]; then
    rm -rf "$(pwd)/build"
    exit 0
fi

echo "Skipped"
