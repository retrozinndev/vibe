import Adw from "gi://Adw?version=1";
import Gio from "gi://Gio?version=2.0";
import GLib from "gi://GLib?version=2.0";
import Gtk from "gi://Gtk?version=4.0";

let application!: Adw.Application;
let mainLoop!: GLib.MainLoop;

function main(): void {
    const box = new Gtk.Box({
        visible: true,
        orientation: Gtk.Orientation.VERTICAL
    });

    const window = new Adw.Window({
        name: application.applicationId.split('.')[application.applicationId.split('.').length-1],
        application: application,
        visible: true,
        content: box,
        fullscreened: false,
        hideOnClose: false
    });

    const bottomPlayer = new Gtk.Box({
        visible: true,
        heightRequest: 250
    });

    box.append(bottomPlayer);

    bottomPlayer.set_hexpand(true);
    bottomPlayer.set_valign(Gtk.Align.END);
    bottomPlayer.set_orientation

    window.present();
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
