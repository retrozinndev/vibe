import Adw from "gi://Adw?version=1";
import Gio from "gi://Gio?version=2.0";
import GLib from "gi://GLib?version=2.0";
import GObject from "gi://GObject?version=2.0";
import { getter, property, register } from "gnim/gobject";
import { Plugin } from "libvibe/plugin";
import { Vibe } from "libvibe";
import { PluginLocal } from "./builtin/local";
import { exportToGlobal } from "./exports";


/** this is only for type's sake, so it works correctly when importing a plugin.
    * you should not instantiate this class (or use this as a base)! */
class FinalPlugin extends Plugin {
    constructor() { super({ name: "FinalPlugin" }); }
}
// external and builtin plugins don't have constructor params, that's what FinalPlugin is for.

@register({ GTypeName: "VibePluginHandler" })
export default class PluginHandler extends GObject.Object {

    private static instance: PluginHandler;
    #builtinPlugins: Array<typeof FinalPlugin> = [
        PluginLocal
    ];

    #builtins: Array<Plugin> = [];
    #plugins: Array<Plugin> = [];
    
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

                    this.importPlugin(`${Vibe.pluginsDir.peek_path()!}/${item.get_name()}`).catch(e => {
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

    async importPlugin(file: string|Gio.File): Promise<FinalPlugin> {
        file = typeof file === "string" ?
            Gio.File.new_for_path(file)
        : file;

        if(!file.query_exists(null))
            throw new Error("Provided file does not exist")

        const pluginFile = Gio.File.new_for_path(`${Vibe.pluginsDir.peek_path()!}/${file.get_basename()!}`);
        file.copy(pluginFile, Gio.FileCopyFlags.OVERWRITE, null, null); // TODO: implement progress bar; do this asynchronously

        const module: {
            default: typeof FinalPlugin;
            VibePlugin: typeof FinalPlugin;
        } = (await import(pluginFile.get_path()!));

        const Plugin = module.default ?? module.VibePlugin;

        if(!Plugin) {
            const error = "Could not import plugin: class `VibePlugin`(or `_VibePlugin`) not found / not exported";
            Adw.MessageDialog.new(null, "An error occurred", error);

            throw new Error(error);
        }

        const instance = new Plugin();

        console.log("imported plugin: " + instance.name + "!");
        instance.status = "init";
        this.#plugins.push(instance);
        this.notify("plugins");
        instance.status = "ok";

        return instance;
    }

    async importBultin(plugin: typeof FinalPlugin): Promise<void> {
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
