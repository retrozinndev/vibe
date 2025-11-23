import Gtk from "gi://Gtk?version=4.0";
import { register } from "gnim/gobject";
import { PageModal } from "libvibe/interfaces";
import { Page } from "../widgets/Page";
import Tab from "../widgets/Tab";


@register({ GTypeName: "VibeLibraryPage" })
export class LibraryPage extends Page<PageModal.CUSTOM> {

    constructor(tab: Tab) {
        super({
            modal: PageModal.CUSTOM,
            title: "Your Library",
            id: "library",
            tab
        });

        this.get_content_widget().append(
            <Gtk.Box>
            </Gtk.Box> as Gtk.Box
        );
    }
}
