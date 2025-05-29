import * as esbuild from "esbuild";

await esbuild.build({
    entryPoints: [
        "src/**/*.ts"
    ],
    outdir: "build/",
    format: "esm",
    splitting: false,
    bundle: true,
    target: "firefox128",
    external: [
        "gi://*"
    ]
});
