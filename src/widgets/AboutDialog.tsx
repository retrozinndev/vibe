import Adw from "gi://Adw?version=1";
import { type App } from "../app";
import Gtk from "gi://Gtk?version=4.0";


export default () => {
    const dialog = Adw.AboutDialog.new();

    dialog.set_application_name("Vibe");
    dialog.set_application_icon("folder-music-symbolic");
    dialog.set_version(Adw.Application.get_default()!.version!);
    dialog.set_license_type(Gtk.License.BSD_3);
    dialog.set_developer_name("retrozinndev");
    dialog.set_developers(["João Dias"]);
    dialog.set_website("https://github.com/retrozinndev/vibe");
    dialog.present((Adw.Application.get_default() as App).get_main_window());

    return dialog;
};
