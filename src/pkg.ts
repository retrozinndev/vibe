// @ts-ignore
const Package = imports.package;

Package.init({
    name: "io.github.retrozinndev.Vibe",
    prefix: "/usr",
    datadir: "/share",
    libdir: "/lib",
    version: VERSION
});

Package.require({
    "Adw": "1",
    "Gtk": "4.0",
    "Gly": "2",
    "GlyGtk4": "2"
});
