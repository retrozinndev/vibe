import esbuild from "esbuild";

esbuild.buildSync({
    entryPoints: [
        "src/**/*.ts"
    ],
    outdir: "build/",
    format: "esm",
    splitting: false,
    bundle: true,
    sourcemap: "inline",
    target: "firefox128",
    external: [
        "gi://*",
        "system",
        "gettext",
        "resource://*"
    ]
});
