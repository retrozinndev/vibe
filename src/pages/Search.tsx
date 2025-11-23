import { PageModal } from "libvibe/interfaces";
import { Page } from "../widgets/Page";
import Tab from "../widgets/Tab";
import { createBinding, createState } from "gnim";
import { Artist, Song, SongList } from "libvibe/objects";
import { Section as SectionType } from "libvibe";
import { createSubscription } from "gnim-utils";
import PluginHandler from "../plugins/plugin-handler";
import Gtk from "gi://Gtk?version=4.0";
import { register } from "gnim/gobject";


@register({ GTypeName: "VibeSearchPage" })
export class SearchPage extends Page<PageModal.CUSTOM> {

    constructor(tab: Tab) {
        super({
            modal: PageModal.CUSTOM,
            title: "Search anything",
            id: "search",
            tab
        });

        
        const [impl, setImplements] = createState(false);
        const [results, setResults] = createState([] as Array<Song|Artist|SongList|SectionType>);

        createSubscription(
            createBinding(PluginHandler.getDefault(), "plugin"),
            () => this.set_visible(
                PluginHandler.getDefault().plugin.isImplemented("search")
            )
        );

        this.get_content_widget().append(
            <Gtk.Box class={"page-search"} orientation={Gtk.Orientation.VERTICAL}>
                <Gtk.SearchEntry class={"search-entry"} searchDelay={300} 
                  placeholderText={"Start typing..."}
                  onSearchChanged={(self) => {
                      const plugin = PluginHandler.getDefault().plugin;
                      if(!plugin.implements.search) {
                          impl.get() && setImplements(false);
                          return;
                      }

                      !impl.get() && setImplements(true);
                      const res = plugin.search!(self.text);
                      if(res instanceof Promise) {
                          // TODO: finish implementation
                      }
                  }}
                />

                <Gtk.Box class={"results"}>
                    
                </Gtk.Box>
            </Gtk.Box> as Gtk.Box
        );
    }

}
