import Gio from "gi://Gio?version=2.0";
import Gdk from "gi://Gdk?version=4.0";
import Gtk from "gi://Gtk?version=4.0";
import Adw from "gi://Adw?version=1";


abstract class Styler {
    protected static app: Adw.Application;
    protected static display: Gdk.Display;
    protected static styles: Map<number, Gtk.CssProvider> = new Map();

    public static init(app: Adw.Application): void {
        this.app = app;
        
        const window = this.app.get_windows()[0];
        if(!window)
            throw new Error("Couldn't find a valid window for application");

        this.display = window.get_display();
        const cssPath = `${this.appIdToResourcePath(this.app.get_application_id()!)}/css`;
        if(!Gio.resources_has_children(cssPath))
            return;

        const names = Gio.resources_enumerate_children(cssPath, Gio.ResourceLookupFlags.NONE);
        for(const name of names) {
            this.loadResource(`${cssPath}/${name}`);
        }
    }

    public static loadResource(path: string): number {
        const css = Gtk.CssProvider.new();
        css.load_from_resource(path);

        Gtk.StyleContext.add_provider_for_display(
            this.display, css, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
        );

        const id = this.genID().next().value;
        this.styles.set(id, css);
        return id;
    }

    public static load(css: string): number {
        const prov = Gtk.CssProvider.new();
        prov.load_from_string(css);

        Gtk.StyleContext.add_provider_for_display(
            this.display, prov, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
        );

        const id = this.genID().next().value;
        this.styles.set(id, prov);
        return id;
    }

    public static remove(id: number): boolean {
        if(!this.styles.has(id))
            return false;

        const css = this.styles.get(id)!;
        Gtk.StyleContext.remove_provider_for_display(
            this.display, css
        );

        this.styles.delete(id);
        return true;
    }

    protected static *genID(): Generator<number, number, number> {
        let id = 0;

        while(true)
            yield id++;
    }

    protected static appIdToResourcePath(appId: string): string {
        return `/${appId.replace(/\./g, '/')}`;
    }
}

export default Styler;
