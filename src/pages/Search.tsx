import { PageModal } from "libvibe/interfaces";
import { Page } from "../widgets/Page";
import Tab from "../widgets/Tab";
import { createBinding, createRoot, getScope, Scope } from "gnim";
import { Album, Artist, Playlist, Song, SongList } from "libvibe/objects";
import { Section as SectionType, Vibe } from "libvibe";
import { createScopedConnection, createSubscription } from "gnim-utils";
import PluginHandler from "../plugins/plugin-handler";
import Gtk from "gi://Gtk?version=4.0";
import { register } from "gnim/gobject";
import Adw from "gi://Adw?version=1";
import Card from "../widgets/Card";
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

        function buildResultWidget(item: Song|SongList|Artist|SectionType): Card|Section {
            let scope!: Scope;
            const widget = createRoot(() => {
                scope = getScope();
                if(item instanceof Song)
                    return Card.new_for_song(
                        item, undefined, () => Vibe.getDefault().addPage({
                            modal: PageModal.SONG, 
                            content: item,
                            title: item.title ?? "Song"
                        })
                    );

                if(item instanceof SongList) {
                    const modal = (item instanceof Album ?
                        PageModal.ALBUM
                    : PageModal.PLAYLIST) as PageModal.PLAYLIST;

                    return Card.new_for_songlist(
                        item, undefined, () => Vibe.getDefault().addPage({
                            modal,
                            content: item as Playlist,
                            title: item.title ?? "Untitled List"
                        })
                    );
                }

                if(item instanceof Artist)
                    return Card.new_for_artist(
                        item, undefined, () => Vibe.getDefault().addPage({
                            modal: PageModal.ARTIST,
                            content: item,
                            title: item.name
                        })
                    );

                return <Section {...item} /> as Section;
            });

            scope.run(() => createScopedConnection(
                widget, "destroy", () => scope.dispose()
            ));

            return widget;
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
                results.then(res => 
                    res?.forEach(item => listbox.insert(buildResultWidget(item), -1))
                ).catch(e => {
                    console.error(e);
                });

                return;
            }

            results.forEach(item => listbox.insert(buildResultWidget(item), -1));
        }

        this.get_content_widget().append(
            <Gtk.Box class={"page-search"} orientation={Gtk.Orientation.VERTICAL}
              hexpand>

                <Gtk.SearchEntry class={"search-entry"} searchDelay={300} 
                  placeholderText={`Search on ${PluginHandler.getDefault().plugin.prettyName}...`}
                  widthRequest={600} halign={Gtk.Align.CENTER}
                  onSearchChanged={(self) => onSearchChanged(self)}
                />

                <Gtk.ListBox class={"results"}>
                    
                </Gtk.ListBox>
            </Gtk.Box> as Gtk.Box
        );
    }

}
