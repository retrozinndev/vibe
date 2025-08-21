import Adw from "gi://Adw?version=1";
import Gtk from "gi://Gtk?version=4.0";

import { createRoot } from "gnim";
import { App } from "../app";


export function startMainWindow() {
    createRoot((dispose) => 
        <Adw.Window title={"Vibe"} hideOnClose={false} visible onCloseRequest={() => dispose()}
          application={App.get_default()}>

            <Gtk.Box class={"container"} orientation={Gtk.Orientation.VERTICAL}>
                <Adw.HeaderBar showEndTitleButtons showStartTitleButtons />
                <Gtk.Box orientation={Gtk.Orientation.VERTICAL}>
                    <Gtk.Box class={"main-box"} hexpand vexpand>
                        <Adw.NavigationSplitView vexpand>
                            <Gtk.Box class={"header"} vexpand={false}>
                                <Gtk.Label class={"title"} label={"Abas"} hexpand 
                                  halign={Gtk.Align.CENTER} 
                                />
                            </Gtk.Box>
                        </Adw.NavigationSplitView>
                    </Gtk.Box>
                    <Gtk.Separator />
                    <Gtk.Box class={"bg-secondary bottom-player"} hexpand vexpand={false}
                      valign={Gtk.Align.END} heightRequest={64}>

                        <Gtk.CenterBox hexpand vexpand={false} valign={Gtk.Align.CENTER}>
                            <Gtk.Box class={"start"} $type="start" />
                            <Gtk.Box class={"center"} halign={Gtk.Align.CENTER} $type="center"
                              spacing={6}>

                                <Gtk.Button class={"previous"} vexpand={false}
                                  iconName={"media-skip-backward-symbolic"} 
                                />
                                <Gtk.Button class={"pause "}
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
        </Adw.Window>
    );
}
