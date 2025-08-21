import Gdk from "gi://Gdk?version=4.0";
import Gtk from "gi://Gtk?version=4.0";
import Adw from "gi://Adw?version=1";
import Gio from "gi://Gio?version=2.0";

import { createRoot, getScope, Scope } from "gnim";
import { register } from "gnim/gobject";
import { programArgs, programInvocationName } from "system";
import { startMainWindow } from "./windows/Window";
import { setConsoleLogDomain } from "console";


export { App };
@register({ GTypeName: "VibeApp" })
class App extends Adw.Application {
    private static instance: App;

    #encoder!: TextEncoder;
    #decoder!: TextDecoder;
    #cssProvider: Gtk.CssProvider|null = null;
    #scope!: Scope;
    #gresource!: Gio.Resource;

    vfunc_activate(): void {
        super.vfunc_activate();
        this.main();
    }

    vfunc_shutdown(): void {
        super.vfunc_activate();
        this.#scope.dispose();
    }

    public resetStyle(): void {
        if(!this.#cssProvider)
            return;

        Gtk.StyleContext.remove_provider_for_display(
            Gdk.Display.get_default()!,
            this.#cssProvider
        );

        this.#cssProvider = null;
    }

    public addStyle(stylesheet: string): void {
        this.resetStyle();

        this.#cssProvider = Gtk.CssProvider.new();
        this.#cssProvider.load_from_bytes(
            new TextEncoder().encode(stylesheet)
        );

        Gtk.StyleContext.add_provider_for_display(
            Gdk.Display.get_default()!,
            this.#cssProvider,
            Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
        );
    }

    public getEncoder(): TextEncoder {
        if(!this.#encoder)
            this.#encoder = new TextEncoder();

        return this.#encoder;
    }

    public getDecoder(): TextDecoder {
        if(!this.#decoder)
            this.#decoder = new TextDecoder();

        return this.#decoder;
    }

    constructor() {
        super({
            version: VIBE_VERSION,
            applicationId: "io.github.retrozinndev.Vibe",
            flags: Gio.ApplicationFlags.DEFAULT_FLAGS
        });

        setConsoleLogDomain("Vibe");

        try {
            this.#gresource = Gio.Resource.load(GRESOURCES_FILE);
            Gio.resources_register(this.#gresource);
        } catch(e) {
            console.error(`Couldn't load GResource: ${e}`);
        }
    }

    public static get_default(): App {
        if(!App.instance)
            App.instance = new App();

        return App.instance;
    }

    public main(): void {
        try {
            Adw.init();
            Gtk.init();
        } catch(e) {
            console.error(`Failed to initialize either GTK or Adwaita, expect issues\n${e}`);
        }

        createRoot(() => {
            this.#scope = getScope();
            startMainWindow();
        });
    }

    public getScope(): Scope {
        return this.#scope;
    }
}

App.get_default().runAsync([ programInvocationName, ...programArgs ]);
