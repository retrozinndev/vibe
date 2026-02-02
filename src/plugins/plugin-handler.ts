import Adw from "gi://Adw?version=1";
import Gio from "gi://Gio?version=2.0";
import GLib from "gi://GLib?version=2.0";
import GObject from "gi://GObject?version=2.0";
import { getter, property, register } from "gnim/gobject";
import { Plugin } from "libvibe/plugin";
import { Vibe } from "libvibe";
import { PluginLocal } from "./builtin/local";
import { exportToGlobal } from "./exports";


@register({ GTypeName: "VibePluginHandler" })
export default class PluginHandler extends GObject.Object {

    private static instance: PluginHandler;

    #builtins: Array<Plugin> = [];
    #plugins: Array<Plugin> = [];
    #builtinPlugins: Array<PluginHandler.PluginConstructor> = [
        PluginLocal
    ];

    
    @getter(Array<Plugin>)
    get plugins() { return this.#plugins; }

    /** the currently active plugin */
    @property(Plugin)
    plugin!: Plugin;


    constructor() {
        super();

        if(!Vibe.pluginsDir.query_exists(null))
            Vibe.pluginsDir.make_directory_with_parents(null);

        exportToGlobal();

        this.loadPlugins();
    }

    private loadPlugins(): void {
        this.#builtinPlugins.forEach(pl =>
            this.importBultin(pl).catch(e => 
                console.error(`An error occurred in built-in plugin(${
                    pl.name}): ${e.message}\n${e.stack}`)
            ));

        Vibe.pluginsDir.enumerate_children_async(
            "standard::*", 
            Gio.FileQueryInfoFlags.NONE,
            GLib.PRIORITY_DEFAULT,
            null,
            (self, res) => {
                const items = [...(self!.enumerate_children_finish(res))]

                for(let i = 0; i < items.length; i++) {
                    const item = items[i];

                    if(!/\.js$/.test(item.get_name()))
                        continue;

                    this.importExternal(`${Vibe.pluginsDir.peek_path()!}/${item.get_name()}`).catch(e => {
                        Adw.MessageDialog.new(null, 
                            "Couldn't auto-import plugin", 
                            `An error occurred while importing the plugin "${item.get_name()}": ${e}`
                        )
                    });
                }
            }
        );

        this.plugin = this.#plugins[0]; // TODO: save last-used plugin and load it here
    }

    async importExternal(file: string|Gio.File): Promise<Plugin> {
        file = typeof file === "string" ?
            Gio.File.new_for_path(file)
        : file;

        if(!file.query_exists(null))
            throw new Error("Provided file does not exist")

        const pluginFile = Gio.File.new_for_path(`${Vibe.pluginsDir.peek_path()!}/${file.get_basename()}`);

        // copy plugin file if not already on plugins dir
        if(file.peek_path()! !== pluginFile.peek_path()!) 
            file.copy(pluginFile, Gio.FileCopyFlags.OVERWRITE, null, null);

        return new Promise((resolve, reject) => {
            import(`file://${pluginFile.peek_path()}`).then((mod: PluginHandler.Module) => {
                const ExtPluginClass = mod.VibePlugin ?? mod.default;
                
                if(typeof ExtPluginClass === "function") {
                    try {
                        const plugin = new ExtPluginClass();

                        console.log("Imported plugin: " + plugin.prettyName + "!");
                        plugin.status = "init";
                        this.#plugins.push(plugin);
                        this.notify("plugins");

                        plugin.status = "ok";

                        resolve(plugin);
                        return;
                    } catch(e) {
                        reject(new Error(`Failed to create instance for plugin module ${pluginFile.get_basename()
                            }: ${(e as Error).message}`)
                        );
                        return;
                    }
                }

                reject(new Error(`Failed to find a plugin implementation in js module: ${pluginFile.get_basename()
                    }. "VibePlugin" or "default" constructor could not be found`));
                return;
            });
        });
    }

    async importModule(file: Gio.File): Promise<any> {
        try {
            return await import(`file://${file.peek_path()}`);
        } catch(e) {
            console.error(e);
        }

        return null;
    }

    async importBultin(plugin: PluginHandler.PluginConstructor): Promise<void> {
        const pl = new plugin();
        pl.status = "init";
        this.#builtins.push(pl);
        this.#plugins.push(pl);
        this.notify("plugins");
        pl.status = "ok";
    }

    public isBuiltin(plugin: Plugin): boolean {
        return this.#builtins.filter(p => p.id === plugin.id)[0] !== undefined;
    }

    public static getDefault(): PluginHandler {
        if(!this.instance)
            this.instance = new PluginHandler();

        return this.instance;
    }
}

export namespace PluginHandler {
    /** plugins don't have constructor params, so we need a new type */
    export type PluginConstructor = new () => Plugin;
    export type Module = {
        default?: PluginHandler.PluginConstructor;
        VibePlugin?: PluginHandler.PluginConstructor;
    };
}

