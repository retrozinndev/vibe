import { PageModal } from "libvibe/interfaces";
import { Page } from "../widgets/Page";
import Tab from "../widgets/Tab";
import { createBinding, createRoot } from "gnim";
import { Section as SectionType, Vibe } from "libvibe";
import { createSubscription } from "gnim-utils";
import PluginHandler from "../plugins/plugin-handler";
import Gtk from "gi://Gtk?version=4.0";
import { register } from "gnim/gobject";
import Adw from "gi://Adw?version=1";
import Section from "../widgets/Section";


@register({ GTypeName: "VibeSearchPage" })
export class SearchPage extends Page<PageModal.CUSTOM> {

    constructor(tab: Tab) {
        super({
            modal: PageModal.CUSTOM,
            title: "Search anything",
            id: "search",
            tab
        });

        createSubscription(
            createBinding(PluginHandler.getDefault(), "plugin"),
            () => this.set_visible(
                PluginHandler.getDefault().plugin.isImplemented("search")
            )
        );

        function buildResultWidget(item: SectionType): Section {
            return createRoot((dispose) => {
                return <Section {...item} onDestroy={() => dispose()}
                /> as Section;
            });
        }

        function onSearchChanged(entry: Gtk.SearchEntry): void {
            if(entry.text.trim().length < 1)
                return;

            const listbox = entry.get_parent()!.get_last_child() as Gtk.ListBox;
            const plugin = PluginHandler.getDefault().plugin;

            if(!plugin.isImplemented("search")) {
                listbox.remove_all();
                listbox.append(
                    <Gtk.Stack>
                        <Adw.StatusPage iconName={"system-search-symbolic"} title={"Search is not supported"} 
                          description={`The search feature is not implemented by the ${plugin.prettyName
                            } plugin. Go ask the dev for an implementation!`}
                        />
                    </Gtk.Stack> as Gtk.Stack
                );

                return;
            }

            const results = plugin.search(entry.get_text());

            if(!results) {
                Vibe.getDefault().toastNotify(`No results found in ${
                    PluginHandler.getDefault().plugin.prettyName
                }`);

                return;
            }

            if(results instanceof Promise) {
                results.then(res => {
                    listbox.remove_all();
                    res?.forEach(item => listbox.insert(buildResultWidget(item), -1))
                }).catch(e => {
                    console.error(e);
                });

                return;
            }

            listbox.remove_all();
            results.forEach(item => listbox.insert(buildResultWidget(item), -1));
        }

        this.get_content_widget().append(
            <Gtk.Box class={"page-search"} orientation={Gtk.Orientation.VERTICAL} hexpand>

                <Gtk.SearchEntry class={"search-entry"} searchDelay={300} 
                  placeholderText={`Search on ${PluginHandler.getDefault().plugin.prettyName}...`}
                  widthRequest={600} halign={Gtk.Align.CENTER}
                  onSearchChanged={(self) => onSearchChanged(self)}
                />

                <Gtk.ListBox class={"results"} selectionMode={Gtk.SelectionMode.NONE} />
            </Gtk.Box> as Gtk.Box
        );
    }

}
