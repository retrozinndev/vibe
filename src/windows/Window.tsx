import Adw from "gi://Adw?version=1";
import Gtk from "gi://Gtk?version=4.0";

import { createRoot } from "gnim";
import { App } from "../app";
import Media from "../modules/media";
import NavigationTabButton from "../widgets/NavigationTabButton";
import OmniPlayer from "../widgets/OmniPlayer";


export const media = new Media();

export function openMainWindow() {
    createRoot((dispose) => {
        return <Adw.ApplicationWindow title={"Vibe"} hideOnClose={false} visible onCloseRequest={() => dispose()}
          application={App.get_default()}>

            <Gtk.Box class={"container"} orientation={Gtk.Orientation.VERTICAL}>
                <Adw.NavigationSplitView vexpand sidebarPosition={Gtk.PackType.START}>
                    {/* sidebar */}
                    <Adw.NavigationPage title={"Sidebar"} $type="sidebar">
                        <Gtk.Box orientation={Gtk.Orientation.VERTICAL} vexpand={false} spacing={6}
                          class={"sidebar-container"}>

                            <Adw.HeaderBar class={"flat"}>
                                <Gtk.Label class="heading" label="Vibe" $type="title" />
                            </Adw.HeaderBar>

                            <NavigationTabButton label={"Search"} iconName={"search-symbolic"} />
                            <NavigationTabButton label={"Library"} iconName={"user-bookmarks-symbolic"} />
                        </Gtk.Box>
                    </Adw.NavigationPage>

                    {/* page */}
                    <Adw.NavigationPage title={"Library"}>
                        <Gtk.Box class={"container"} vexpand={false} orientation={Gtk.Orientation.VERTICAL}>
                            <Adw.HeaderBar class={"flat"} />
                            <Gtk.Box class={"content"} vexpand />
                        </Gtk.Box>
                    </Adw.NavigationPage>
                </Adw.NavigationSplitView>
                <Gtk.Separator />
                <OmniPlayer />
            </Gtk.Box>
        </Adw.ApplicationWindow>;
    });
}
