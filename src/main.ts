import Adw from "gi://Adw?version=1";
import Gio from "gi://Gio?version=2.0";
import GLib from "gi://GLib?version=2.0";

import { startMainWindow } from "./windows/Window";


export let application!: Adw.Application;
export let mainLoop!: GLib.MainLoop;

function main(): void {
    startMainWindow();
}

function run(): void {
    const loop = GLib.MainLoop.new(null, false);
    mainLoop = loop;

    const app = new Adw.Application({
        applicationId: "io.github.retrozinndev.Vibe",
        version: "0.0.1",
        flags: Gio.ApplicationFlags.DEFAULT_FLAGS
    });

    app.register(null);
    if(!app.isRegistered) {
        app.quit();
        loop.is_running() && loop.quit();
    }

    application = app;
    app.connect("activate", main);
    app.run([imports.system.programInvocationName, ...ARGV]);

    loop.run();
}

run();
