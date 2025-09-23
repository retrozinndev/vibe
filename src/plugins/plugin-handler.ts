import Adw from "gi://Adw?version=1";
import Gio from "gi://Gio?version=2.0";
import GLib from "gi://GLib?version=2.0";
import { Plugin } from "libvibe";
import { App } from "../app";
import { PluginLocal } from "./builtin/local";
import { getter, register } from "gnim/gobject";
import GObject from "gi://GObject?version=2.0";


/** this is only for type's sake, so it works correctly when importing a plugin.
    * you should not instantiate this class (or use this as a base)! */
class FinalPlugin extends Plugin {
    constructor() { super({ name: "FinalPlugin" }); }
}

// external and builtin plugins don't have constructor parameters, so that's what FinalPlugin is for,
// to type these plugins. Plugin is just a base class to create plugins.

@register({ GTypeName: "VibePluginHandler" })
export default class PluginHandler extends GObject.Object {

    private static instance: PluginHandler;
    #builtinPlugins: Array<typeof FinalPlugin> = [
        PluginLocal
    ];

    #plugins: Array<Plugin> = [];
    #currentPlugin!: Plugin;
    
    readonly pluginsDir = Gio.File.new_for_path(`${App.dataDir}/plugins`);

    /** the currently active plugin */
    @getter(Plugin)
    get plugin() { return this.#currentPlugin; }


    constructor() {
        super();

        if(!this.pluginsDir.query_exists(null))
            this.pluginsDir.make_directory_with_parents(null);

        this.#builtinPlugins.forEach(pl =>
            this.importBultin(pl));

        this.pluginsDir.enumerate_children_async(
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

                    this.importPlugin(`${this.pluginsDir.peek_path()!}/${item.get_name()}`).catch(e => {
                        Adw.MessageDialog.new(null, 
                            "Couldn't auto-import plugin", 
                            `An error occurred while importing the plugin "${item.get_name()}": ${e}`
                        )
                    });
                }
            }
        );

        this.#currentPlugin = this.#plugins[0]; // TODO: save last-used plugin and load it here
    }

    async importPlugin(file: string|Gio.File): Promise<FinalPlugin> {
        file = typeof file === "string" ?
            Gio.File.new_for_path(file)
        : file;

        if(!file.query_exists(null))
            throw new Error("Provided file does not exist")

        this.pluginsDir.make_directory_with_parents(null);
        const pluginFile = Gio.File.new_for_path(`${this.pluginsDir}/${file.get_basename()!}`);
        file.copy(pluginFile, Gio.FileCopyFlags.OVERWRITE, null, null); // TODO: implement progress bar; do this asynchronously
        

        const plugin: {
            VibePlugin: typeof FinalPlugin; // without constructor parameters! (TODO: type implementation)
        } = await import(pluginFile.get_path()!);

        const instance = new plugin.VibePlugin();
        instance.status = "init";
        this.#plugins.push(instance);
        instance.status = "ok";

        return instance;
    }

    async importBultin(Plugin: typeof FinalPlugin|any): Promise<void> {
        const pl = new Plugin();
        pl.status = "init";
        this.#plugins.push(pl);
        pl.status = "ok";
    }

    public static getDefault(): PluginHandler {
        if(!this.instance)
            this.instance = new PluginHandler();

        return this.instance;
    }
}
