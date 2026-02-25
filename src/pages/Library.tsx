import Gtk from "gi://Gtk?version=4.0";
import { register } from "gnim/gobject";
import { Page } from "../widgets/Page";


@register({ GTypeName: "VibeLibraryPage" })
export class Library extends Page {

    constructor() {
        super({
            title: "Your Library",
            id: "library",
            iconName: "user-bookmarks-symbolic",
            tabName: "Library",
            content: <Gtk.Box>
            </Gtk.Box> as Gtk.Box
        });
    }
}
