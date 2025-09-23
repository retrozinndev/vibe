import GLib from "gi://GLib?version=2.0";
import Gdk from "gi://Gdk?version=4.0";
import Gtk from "gi://Gtk?version=4.0";
import Adw from "gi://Adw?version=1";
import Gio from "gi://Gio?version=2.0";

import { createRoot, getScope, Scope } from "gnim";
import { register } from "gnim/gobject";
import { programArgs, programInvocationName } from "system";
import { openMainWindow } from "./windows/Window";
import { setConsoleLogDomain } from "console";
import { Vibe } from "libvibe";


@register({ GTypeName: "VibeApp" })
export class App extends Adw.Application {
    private static instance: App;

    public static dataDir = `${GLib.get_user_data_dir()}/vibe`;
    public static cacheDir = `${GLib.get_user_cache_dir()}/vibe`;
    public static runtimeDir = `${GLib.get_user_runtime_dir()}/vibe`;

    readonly #socketFile = Gio.File.new_for_path(`${App.runtimeDir}/socket.sock`);
    #socketService!: Gio.SocketService;
    #socketAdress!: Gio.UnixSocketAddress;
    #gresource: Gio.Resource|null = null;
    #cssProvider: Gtk.CssProvider|null = null;
    #encoder!: TextEncoder;
    #decoder!: TextDecoder;
    #scope!: Scope;

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
            applicationId: "io.github.retrozinndev.Vibe",
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

    public main(): void {
        Adw.init();
        Gtk.init();

        this.loadAssets();

        // init socket
        const runtimeDir = Gio.File.new_for_path(App.runtimeDir);
        if(!runtimeDir.query_exists(null))
            runtimeDir.make_directory_with_parents(null);

        if(this.#socketFile.query_exists(null))
            this.#socketFile.delete(null);

        const socketPath = this.#socketFile.peek_path()!;

        this.#socketService = Gio.SocketService.new();
        this.#socketAdress = Gio.UnixSocketAddress.new(socketPath);
        this.#socketService.add_address(
            this.#socketAdress,
            Gio.SocketType.STREAM,
            Gio.SocketProtocol.DEFAULT,
            null
        );

        this.#socketService.connect("incoming", (_, conn) => {
            const inStream = Gio.DataInputStream.new(conn.get_input_stream()),
                outStream = conn.get_output_stream();

            inStream.read_upto_async('\x00', -1, GLib.PRIORITY_DEFAULT, null, (self, res) => {
                const [input, len] = self!.read_upto_finish(res);

                if(len < 1) // no input provided
                    return;

                console.log(`Input received from socket: "${input}"`);
                outStream.write_bytes_async(
                    this.getEncoder().encode("Server received request!"),
                    GLib.PRIORITY_DEFAULT,
                    null,
                    (_, res) => {
                        const byteLength = outStream.write_bytes_finish(res);

                        if(byteLength < 1) {
                            console.error("An error occurred and the bytes sent to the client were less than 1 (corrupted)");
                            return;
                        }
                    }
                );
            });

            return true; // stop connection on end
        });

        // init libvibe (socket communication)
        const libvibe = new Vibe({ enableSocket: false });
        Vibe.setDefault(libvibe); // so plugins can access `Vibe.getDefault()` without creating another instance

        createRoot(() => {
            this.#scope = getScope();
            openMainWindow();
        });
    }

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
    }

    public getScope(): Scope {
        return this.#scope;
    }
}

App.get_default().runAsync([ programInvocationName, ...programArgs ]);
