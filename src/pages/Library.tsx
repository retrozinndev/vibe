import Gtk from "gi://Gtk?version=4.0";
import { register } from "gnim/gobject";
import { Page } from "../widgets/Page";
import Tab from "../widgets/Tab";


@register({ GTypeName: "VibeLibraryPage" })
export class LibraryPage extends Page {

    constructor(tab: Tab) {
        super({
            title: "Your Library",
            id: "library",
            tab,
            content: <Gtk.Box>
            </Gtk.Box> as Gtk.Box
        });
    }
}
