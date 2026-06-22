import "./pkg";
import { setConsoleLogDomain } from "console";
import Adw from "gi://Adw?version=1";
import GLib from "gi://GLib?version=2.0";
import Gio from "gi://Gio?version=2.0";
import { createRoot, getScope, Scope } from "gnim";
import { register } from "gnim/gobject";
import PluginHandler from "./plugins/plugin-handler";
import { Vibe } from "libvibe";
import { programArgs, programInvocationName } from "system";
import Window from "./Window";
import Media from "./modules/media";
import { Page } from "./widgets/Page";
import { Page as VibePage } from "libvibe/interfaces";
import { Dialog } from "./widgets/Dialog";
import Mpris from "./modules/mpris";
import Styler from "./modules/styler";


@register({ GTypeName: "Vibe" })
export class App extends Adw.Application {
    private static instance: App;

    #license!: string;
    #mainWindow!: Adw.ApplicationWindow;
    #scope!: Scope;

    get scope() { return this.#scope; }
    get license() { return this.#license; }

    vfunc_activate(): void {
        createRoot(() => this.main());
    }

    constructor() {
        super({
            version: VERSION,
            applicationId: "io.github.retrozinndev.Vibe",
            flags: Gio.ApplicationFlags.DEFAULT_FLAGS 
        });

        setConsoleLogDomain("Vibe");
        GLib.set_application_name("Vibe");
        GLib.set_prgname("vibe");

        try {
            const gres = Gio.resource_load(
                GRESOURCE.split('/').filter(s => 
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
                }).join('/').replace(/^./, (c) => !/^(\/|\.)/.test(c) ? `/${c}` : c)
            );

            Gio.resources_register(gres);
        } catch(e) {
            console.error(`Couldn't load GResource: ${e}`);
        }
    }

    public static get_default(): App {
        if(!App.instance)
            App.instance = new App();

        return App.instance;
    }

    private main(): void {
        this.#scope = getScope();
        this.init();

        const vibe = new Vibe(); // auto-added as default
        this.#mainWindow = Window.getDefault(this);
        vibe.setApplicationWindow(this.#mainWindow);
        vibe.setDialogConstructor(Dialog as Vibe.DialogConstructor);

        Styler.init(this);
        // init libvibe
        vibe.setData(
            new Media(),
            Window.getDefault().getPages(),
            Page as new <T extends VibePage.Type>(props: VibePage.ConstructorProps<T>) => Page<T>,
            Window.getDefault().getToastOverlay()
        );

        // init plugins
        PluginHandler.getDefault();
        //PluginHandler.getDefault().notify("plugin");
        Mpris.init();

        Window.getDefault().init();
        vibe.emit("initialized");

        const id = (this as App).connect("shutdown", () => {
            this.#scope.dispose();
            Mpris.stop();
            this.disconnect(id);
        });
    }

    private init(): void {
        this.#license = new TextDecoder("utf-8").decode(
            Gio.resources_lookup_data(
                "/io/github/retrozinndev/Vibe/data/license",
                Gio.ResourceLookupFlags.NONE
            ).toArray()
        );
    }

    public get_main_window(): Adw.ApplicationWindow {
        return this.#mainWindow;
    }
}

App.get_default().runAsync([ programInvocationName, ...programArgs ]);
