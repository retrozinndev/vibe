import { setConsoleLogDomain } from "console";
import Adw from "gi://Adw?version=1";
import GLib from "gi://GLib?version=2.0";
import Gdk from "gi://Gdk?version=4.0";
import Gio from "gi://Gio?version=2.0";
import Gst from "gi://Gst?version=1.0";
import Gtk from "gi://Gtk?version=4.0";
import { Vibe } from "libvibe";
import PluginHandler from "./plugins/plugin-handler";
import Media from "./modules/media";
import { createRoot, getScope, Scope } from "gnim";
import { register } from "gnim/gobject";
import { programArgs, programInvocationName } from "system";
import { openMainWindow } from "./Window";


const libvibe = {
    vibe: await import("libvibe"),
    objects: await import("libvibe/objects"),
    plugin: await import("libvibe/plugin")
};

@register({ GTypeName: "VibeApp" })
export class App extends Adw.Application {
    private static instance: App;

    #gresource: Gio.Resource|null = null;
    #license!: string;
    #cssProvider: Gtk.CssProvider|null = null;
    #encoder!: TextEncoder;
    #decoder!: TextDecoder;
    #scope!: Scope;

    get license() { return this.#license; }

    vfunc_activate(): void {
        super.vfunc_activate();
        this.main();
    }

    vfunc_shutdown(): void {
        super.vfunc_shutdown();
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
            applicationId: "io.github.retrozinndev.vibe",
            flags: Gio.ApplicationFlags.DEFAULT_FLAGS 
        });

        setConsoleLogDomain("Vibe");

        try {
            this.#gresource = Gio.Resource.load(
                GRESOURCES_FILE.split('/').filter(s => 
                    s !== ""
                ).map(path => {
                    // support environment variables at runtime
                    if(/^\$/.test(path)) {
                        const env = GLib.getenv(path.replace(/^\$/, ""));
                        if(env === null)
                            throw new Error(
                                `Couldn't get environment variable: ${path}`
                            );

                        return env;
                    }

                    return path;
                }).join('/')
            );

            Gio.resources_register(this.#gresource);
        } catch(e) {
            this.#gresource = null;
            console.error(`Couldn't load GResource: ${e}`);
        }
    }

    public static get_default(): App {
        if(!App.instance)
            App.instance = new App();

        return App.instance;
    }

    readonly main = (): void => createRoot(() => {
        this.#scope = getScope();

        Gst.init(null);
        this.loadAssets();

        // add application's libvibe module to globalThis, so plugins can access the same instance
        Object.keys(libvibe).forEach(key => 
            Object.assign(globalThis, libvibe[key as keyof typeof libvibe])
        );

        // init libvibe
        Vibe.getDefault()
            .setMedia(Media.getDefault());

        // init plugins
        PluginHandler.getDefault();
        Vibe.getDefault().emit("initialized");

        openMainWindow();
        PluginHandler.getDefault().notify("plugin");
    });

    private loadAssets(): void {
        // add custom icons
        Gtk.IconTheme.get_for_display(
            Gdk.Display.get_default()!
        ).add_resource_path("/io/github/retrozinndev/vibe/icons");

        // load stylesheets
        Gio.resources_enumerate_children(
            "/io/github/retrozinndev/vibe/styles", null
        ).forEach(name => 
            this.addStyle(
                this.getDecoder().decode(Gio.resources_lookup_data(
                    `/io/github/retrozinndev/vibe/styles/${name}`,
                    null
                ).toArray())
            )
        );

        this.#license = this.getDecoder().decode(
            Gio.resources_lookup_data(
                "/io/github/retrozinndev/vibe/data/license",
                null
            ).toArray()
        );
    }

    public getScope(): Scope {
        return this.#scope;
    }
}

App.get_default().runAsync([ programInvocationName, ...programArgs ]);
