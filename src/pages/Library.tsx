import Gtk from "gi://Gtk?version=4.0";
import Page from "../widgets/Page";
import { register } from "gnim/gobject";


@register({ GTypeName: "VibePageLibrary" })
export default class Library extends Page {
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
