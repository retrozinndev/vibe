import Adw from "gi://Adw?version=1";
import Gtk from "gi://Gtk?version=4.0";
import { createBinding } from "gnim";
import { getter, property, register } from "gnim/gobject";
import { Song } from "libvibe/objects";
import { omitObjectKeys } from "../modules/util";
import { createScopedConnection } from "gnim-utils";
import Gdk from "gi://Gdk?version=4.0";
import { Vibe } from "libvibe";
import GdkPixbuf from "gi://GdkPixbuf?version=2.0";
import { Menu } from "./Menu";


// TODO
/** SongItem is a widget that behaves like a list item to a ListBox,
  * but has special functions and integrated widgets: play/pause 
  * button, song/album art(image), song name, album name, popover if
  * clicked with secondary mouse button, containing more actions:
  * go to album, go to artist and more... 
  */
@register({ GTypeName: "VibeSongItem" })
export default class extends Adw.Bin {
    #song: Song;

    /** extra options when clicking with the secondary mouse button */
    @property(Array<Gtk.Button>)
    buttons: Array<Gtk.Button> = [];

    @getter(Song)
    get song() { return this.#song; }

    constructor(props: {
        song: Song;
        buttons?: Array<Gtk.Button>;
    } & Partial<Adw.Bin.ConstructorProps>) {
        super(omitObjectKeys(props, ["song", "buttons"]));

        this.#song = props.song;
        if(props.buttons)
            this.buttons = props.buttons;

        const image = props.song.image ?? props.song.album?.image;
        const popover = <Menu buttons={createBinding(this, "buttons")} /> as Menu;

        const click = Gtk.GestureClick.new();
        this.add_controller(click);

        createScopedConnection(
            click, "released", (_, x, y) => {
                if(click.get_current_button() !== Gdk.BUTTON_SECONDARY)
                    return;

                popover.set_pointing_to(
                    new Gdk.Rectangle({
                        width: this.get_allocation().width,
                        height: this.get_allocation().height,
                        x, 
                        y
                    })
                );

                popover.popup();

                const id = popover.connect("closed", () => {
                    popover.disconnect(id);
                    popover.set_pointing_to(null);
                });
            }
        );

        this.set_child(
            <Gtk.Box>
                <Gtk.CenterBox orientation={Gtk.Orientation.HORIZONTAL}>
                    <Gtk.Box spacing={8} $type="start">
                        <Gtk.Button class={"play"} onClicked={() => {
                            Vibe.getDefault().media.playSong(this.#song, 0);
                        }} iconName={"media-playback-start-symbolic"} />

                        {image && 
                            <Gtk.Picture contentFit={Gtk.ContentFit.CONTAIN} 
                              widthRequest={64}
                              $={(self) => {
                                  if(image instanceof GdkPixbuf.Pixbuf) {
                                      self.set_pixbuf(image);
                                      return;
                                  }

                                  self.set_paintable(image);
                              }}
                            />
                        }

                        <Gtk.Box class={"data"} orientation={Gtk.Orientation.VERTICAL}>
                            <Gtk.Label label={props.song.title ?? "No Title"} xalign={0} />
                            <Gtk.Label label={props.song.artist?.map(artist =>
                                artist.displayName ?? artist.name ?? "Unknown Artist"
                            ).join(", ")} xalign={0} class={"dimmed body"} />
                        </Gtk.Box>
                    </Gtk.Box>
                    <Gtk.Box spacing={8} $type="end">
                        <Gtk.Button iconName={"plus-circle-outline-symbolic"} // TODO change to test-pass icon if already added to a playlist
                          onClicked={() => {
                              // TODO open popover to select which playlist to add the song to
                              // PlaylistPopover widget will be used here
                          }}
                        />
                        <Gtk.Button iconName={"view-more-symbolic"}
                          onClicked={(self) => {
                              popover.set_pointing_to(self.get_allocation());
                              popover.popup();
                              
                              const id = popover.connect("closed", () => {
                                  popover.disconnect(id);
                                  popover.set_pointing_to(null);
                              });
                          }}
                        />
                    </Gtk.Box>
                </Gtk.CenterBox>
                {popover}
            </Gtk.Box> as Gtk.Box
        );
    }
}
