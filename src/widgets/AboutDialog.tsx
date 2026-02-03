import Adw from "gi://Adw?version=1";
import { App } from "../app";


export default () => {
    const dialog = Adw.AboutDialog.new();

    dialog.set_application_name("Vibe");
    dialog.set_application_icon("folder-music-symbolic");
    dialog.set_version(App.get_default().version);
    dialog.set_license(App.get_default().license);
    dialog.set_developer_name("retrozinndev");
    dialog.set_developers(["João Dias"]);
    dialog.set_website("https://github.com/retrozinndev/vibe");
    dialog.present(App.get_default().get_main_window());

    return dialog;
};
