import Gtk from "gi://Gtk?version=4.0";
import Tab from "../widgets/Tab";
import { register } from "gnim/gobject";


@register({ GTypeName: "VibeTabLibrary" })
export default class Library extends Tab {
    constructor() {
        super({
            tabName: "Library",
            title: "Your Library",
            iconName: "user-bookmarks-symbolic"
        });

        this.set_child(
            <Gtk.Box orientation={Gtk.Orientation.VERTICAL} hexpand={false} halign={Gtk.Align.START}>
            </Gtk.Box> as Gtk.Box
        );
    }
}
