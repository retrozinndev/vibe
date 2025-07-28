import Adw from "gi://Adw?version=1";
import Gtk from "gi://Gtk?version=4.0";
import Gdk from "gi://Gdk?version=4.0";

import { application } from "../main";
import { createRoot } from "gnim";


export function startMainWindow() {
    const cssProvider = Gtk.CssProvider.new();
    cssProvider.load_from_string(`
        .bg-secondary {
            background-color: @accent-bg-color;
        }
    `);

    Gtk.StyleContext.add_provider_for_display(
        Gdk.Display.get_default()!,
        cssProvider,
        Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
    );

    createRoot(() => {
        const window = <Adw.Window title={"Vibe"} application={application} hideOnClose={false}
          visible>
            <Gtk.Box class={"container"} orientation={Gtk.Orientation.VERTICAL}>
                <Adw.HeaderBar showEndTitleButtons showStartTitleButtons />
                <Gtk.Box orientation={Gtk.Orientation.VERTICAL}>
                    <Gtk.Box class={"main-box"} hexpand vexpand>
                        <Adw.NavigationSplitView>
                            <Adw.HeaderBar showEndTitleButtons={false} titleWidget={
                                <Gtk.Label class={"title"} label={"Abas"} /> as Gtk.Label
                            } />
                        </Adw.NavigationSplitView>
                    </Gtk.Box>
                    <Gtk.Separator />
                    <Gtk.Box class={"bg-secondary bottom-player"} hexpand vexpand={false}
                      valign={Gtk.Align.END}>

                        <Gtk.CenterBox hexpand>
                            <Gtk.Box class={"start"} $type="start" />
                            <Gtk.Box class={"center"} halign={Gtk.Align.CENTER} $type="center"
                              spacing={6}>

                                <Gtk.Button class={"previous"} vexpand={false}
                                  iconName={"media-skip-backward-symbolic"} 
                                />
                                <Gtk.Button class={"pause"}
                                  iconName={"media-playback-pause-symbolic"}
                                />
                                <Gtk.Button class={"next"} vexpand={false}
                                  iconName={"media-skip-forward-symbolic"} 
                                />
                            </Gtk.Box>
                            <Gtk.Box class={"end"} $type="end" />
                        </Gtk.CenterBox>
                    </Gtk.Box>
                </Gtk.Box>
            </Gtk.Box>
        </Adw.Window> as Adw.Window;

        return window;
    });
}
