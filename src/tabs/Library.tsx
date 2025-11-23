import Gtk from "gi://Gtk?version=4.0";
import Tab from "../widgets/Tab";
import { register } from "gnim/gobject";
import { LibraryPage } from "../pages/Library";


@register({ GTypeName: "VibeTabLibrary" })
export default class Library extends Tab {
    constructor() {
        super({
            title: "Library",
            id: "library",
            iconName: "user-bookmarks-symbolic"
        });

        this.page = new LibraryPage(this);

        this.set_child(
            <Gtk.Box orientation={Gtk.Orientation.VERTICAL} hexpand={false} halign={Gtk.Align.START}>
            </Gtk.Box> as Gtk.Box
        );
    }
}
