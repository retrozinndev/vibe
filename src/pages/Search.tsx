import { Page } from "../widgets/Page";
import { createBinding, createRoot } from "gnim";
import { Section as SectionType, Vibe } from "libvibe";
import { createScopedConnection } from "gnim-utils";
import PluginHandler from "../plugins/plugin-handler";
import Gtk from "gi://Gtk?version=4.0";
import { register } from "gnim/gobject";
import Adw from "gi://Adw?version=1";
import Section from "../widgets/Section";
import { Plugin } from "libvibe/plugin";


@register({ GTypeName: "VibeSearchPage" })
export class Search extends Page {

    #promise: Promise<any>|null = null;

    constructor() {
        super({
            title: "Search anything",
            id: "search",
            iconName: "system-search-symbolic",
            tabName: "Search",
            content: <Gtk.Box class={"page-search"} orientation={Gtk.Orientation.VERTICAL}
              hexpand vexpand
            /> as Gtk.Box
        });

        const searchEntry = <Gtk.SearchEntry placeholderText={createBinding(
                PluginHandler.getDefault(), "plugin", "prettyName"
            )(name => `Search on ${name}...`)
          } widthRequest={600} halign={Gtk.Align.CENTER} searchDelay={300}
          onSearchChanged={(self) => this.reload(self, sectionList, stack)}
        /> as Gtk.SearchEntry;

        const sectionList = <Gtk.ListBox selectionMode={Gtk.SelectionMode.NONE} 
          class={"results"}
        /> as Gtk.ListBox;

        const stack = <Gtk.Stack transitionType={Gtk.StackTransitionType.CROSSFADE} hexpand vexpand>
            <Gtk.StackPage name={"spinner"} child={
                <Adw.Spinner /> as Adw.Spinner
            } />
            <Gtk.StackPage name={"not-found"} child={
                <Adw.StatusPage title={"No results for your seach :("} iconName={"system-search-symbolic"}
                  description={"You can try tinkering your search a little bit for better results!"}
                /> as Adw.StatusPage
            } />
            <Gtk.StackPage name={"empty"} child={
                <Adw.StatusPage title={"Search your library here!"}
                  iconName={"system-search-symbolic"}
                  description={`Search media from the ${PluginHandler.getDefault().plugin.prettyName} plugin.`}
                /> as Adw.StatusPage
            } />
            <Gtk.StackPage name={"results"} child={
                sectionList
            } />
        </Gtk.Stack> as Gtk.Stack;
        
        stack.set_visible_child_name("empty");
        (this.content as Gtk.Box).prepend(searchEntry);
        (this.content as Gtk.Box).append(stack);


        createScopedConnection(this, "refresh", () => this.reload(
            searchEntry, sectionList, stack
        ));

        this.reload(searchEntry, sectionList, stack);
    }

    reload(entry: Gtk.SearchEntry, listbox: Gtk.ListBox, stack: Gtk.Stack): void {
        if(!this.is_visible())
            this.set_visible(true);

        if(entry.text.trim().length < 1) {
            stack.set_visible_child_name("empty");
            listbox.remove_all();
            return;
        }

        const plugin = PluginHandler.getDefault().plugin;

        if(!plugin.isImplemented("search")) {
            this.set_visible(false);
            listbox.remove_all();
            stack.set_visible_child_name("empty");

            Vibe.getDefault().addDialog({
                title: "Unsupported",
                content: `The ${plugin.prettyName} does not support searching :(\nMaybe it's just a non-content plugin?`
            });

            return;
        }

        this.buildResults(plugin.search(entry.get_text()), listbox, stack);
    }

    buildResults(
        promise: ReturnType<typeof Plugin.prototype.search>,
        listbox: Gtk.ListBox,
        stack: Gtk.Stack
    ): void {
        function buildSection(item: SectionType): Section {
            return createRoot((dispose) => {
                return <Section {...item} onDestroy={() => dispose()}
                /> as Section;
            });
        }

        if(this.#promise) {
            Promise.reject.call(this.#promise); // maybe this works...?
            this.#promise = null;
        }

        stack.set_visible_child_name("spinner");

        if(!promise || (Array.isArray(promise) && promise.length < 1)) {
            listbox.remove_all();
            stack.set_visible_child_name("not-found");
            return;
        }

        if(promise instanceof Promise) {
            promise.then((sections) => {
                listbox.remove_all();
                if(!sections || sections.length < 1) {
                    stack.set_visible_child_name("not-found");
                    return;
                }

                stack.set_visible_child_name("results");
                sections?.forEach(sect => listbox.prepend(buildSection(sect)));
            }).catch(console.error);
            return;
        }
    }
}
