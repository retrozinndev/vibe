import Gtk from "gi://Gtk?version=4.0";
import { createBinding, createState } from "gnim";
import { register } from "gnim/gobject";
import { Section as SectionType } from "libvibe";
import { Song, SongList, Artist } from "libvibe/objects";
import PluginHandler from "../plugins/plugin-handler";
import Tab from "../widgets/Tab";
import { createSubscription } from "gnim-utils";


@register({ GTypeName: "VibeTabSearch" })
export default class Search extends Tab {
    
    constructor() {
        super({
            title: "Search anything",
            iconName: "system-search-symbolic",
            tabName: "Search"
        });

        const [impl, setImplements] = createState(false);
        const [results, setResults] = createState([] as Array<Song|Artist|SongList|SectionType>);

        createSubscription(
            createBinding(PluginHandler.getDefault(), "plugin"),
            () => this.set_visible(
                PluginHandler.getDefault().plugin.isImplemented("search")
            )
        );

        this.set_child(
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
                          // TODO: finish implementation as soon as the CLARO DNS 
                          // gets back to working as usual.
                      }
                  }}
                />

                <Gtk.Box class={"results"}>
                    
                </Gtk.Box>
            </Gtk.Box> as Gtk.Box
        );
    }
}
