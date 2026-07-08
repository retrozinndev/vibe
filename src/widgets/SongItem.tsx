import Gtk from "gi://Gtk?version=4.0";
import { createBinding, createComputed, This } from "gnim";
import { getter, property, register } from "gnim/gobject";
import { Song } from "libvibe/objects";
import { omitObjectKeys } from "../modules/util";
import Gdk from "gi://Gdk?version=4.0";
import { LabelButton, Vibe } from "libvibe";
import { Menu } from "./Menu";
import { Image } from "./Image";
import GObject from "gi://GObject?version=2.0";
import Pango from "gi://Pango?version=1.0";


// TODO
/** SongItem is a widget that behaves like a list item to a ListBox,
  * but has special functions and integrated widgets: play/pause 
  * button, song/album art(image), song name, album name, popover if
  * clicked with secondary mouse button, containing more actions:
  * go to album, go to artist and more... 
  */
@register({ GTypeName: "VibeSongItem" })
export default class SongItem extends Gtk.Box {
    declare readonly $signals: SongItem.SignalSignatures;
    declare readonly $readableProperties: SongItem.ReadableProperties;
    declare readonly $readWriteProperties: SongItem.ReadWriteProperties;
    declare readonly $constructOnlyProperties: SongItem.ConstructOnlyProperties;

    #song: Song;
    #menu: Menu;

    /** extra options when clicking with the secondary mouse button */
    @property(Array)
    buttons: Array<LabelButton> = [];

    @getter(Song)
    get song() { return this.#song; }

    constructor(props: Partial<GObject.ConstructorProps<SongItem>> = {}) {
        super(omitObjectKeys(props, ["song", "buttons"]));

        if(!props.song)
            throw new Error("No song was specified for SongItem widget");

        this.#song = props.song;
        if(props.buttons)
            this.buttons = props.buttons;

        this.add_css_class("song-item");
        this.#menu = <Menu buttons={createBinding(this, "buttons")} /> as Menu;

        void (
            <This this={this as SongItem}>
                <Gtk.GestureClick button={0} onReleased={(gesture: Gtk.GestureClick, __: number, x: number, y: number) => {
                    if(gesture.get_current_button() !== Gdk.BUTTON_SECONDARY)
                        return;

                    const [, bounds] = this.compute_bounds(this.parent!);
                    this.#menu.set_pointing_to(
                        new Gdk.Rectangle({
                            width: bounds.get_width(),
                            height: bounds.get_height(),
                            x, 
                            y
                        })
                    );

                    this.#menu.popup();

                    const id = this.#menu.connect("closed", () => {
                        this.#menu.disconnect(id);
                        this.#menu.set_pointing_to(null);
                    });
                }} />
                <Gtk.CenterBox orientation={Gtk.Orientation.HORIZONTAL} hexpand>
                    <Gtk.Box spacing={8} $type="start">
                        <Gtk.Button class={"play flat"} onClicked={() => {
                            Vibe.getDefault().media.playSong(this.#song, 0);
                        }} iconName={"media-playback-start-symbolic"} />

                        <Image image={createComputed(() => {
                              const image = createBinding(this, "song", "image")();
                              const albumImage = createBinding(this, "song", "album", "image")();

                              return image ?? albumImage ?? null!;
                          })}
                          canShrink keepAspectRatio
                        />

                        <Gtk.Box class={"data"} orientation={Gtk.Orientation.VERTICAL}>
                            <Gtk.Label label={props.song.title ?? "No Title"} xalign={0} 
                              wrap wrapMode={Pango.WrapMode.WORD_CHAR}
                            />
                            <Gtk.Label label={props.song.artist?.map(artist =>
                                    artist.displayName ?? artist.name ?? "Unknown Artist"
                                ).join(", ")
                              } xalign={0} class={"dimmed body"}
                              ellipsize={Pango.EllipsizeMode.END}
                            />
                        </Gtk.Box>
                    </Gtk.Box>
                    <Gtk.Box spacing={8} $type="end">
                        <Gtk.Button iconName={"plus-circle-outline-symbolic"} // TODO change to test-pass icon if already added to a playlist
                          onClicked={() => {
                              // TODO open popover to select which playlist to add the song to
                              // PlaylistPopover widget will be used here
                              // tmp feature
                              Vibe.getDefault().media.queue.add(this.#song);
                          }}
                        />
                        <Gtk.Button iconName={"view-more-symbolic"}
                          onClicked={(self: Gtk.Button) => {
                              const [, bounds] = self.compute_bounds(this);

                              this.#menu.set_pointing_to(new Gdk.Rectangle({
                                  x: bounds.get_x(),
                                  y: bounds.get_y(),
                                  width: bounds.get_width(),
                                  height: bounds.get_height()
                              }));

                              if(this.#menu.is_visible()) {
                                  this.#menu.popdown();
                                  return;
                              }

                              this.#menu.popup();
                              
                              const id = this.#menu.connect("closed", () => {
                                  this.#menu.disconnect(id);
                                  this.#menu.set_pointing_to(null);
                              });
                          }}
                        />
                    </Gtk.Box>
                </Gtk.CenterBox>
                {this.#menu}
            </This>
        );
    }
}

export namespace SongItem {
    export interface SignalSignatures extends Gtk.Box.SignalSignatures {}
    export interface ConstructOnlyProperties extends Gtk.Box.ConstructOnlyProperties {
        song: Song;
    }
    export interface ReadableProperties extends Gtk.Box.ReadableProperties {
        song: Song;
    }
    export interface ReadWriteProperties extends Gtk.Box.ReadWriteProperties {
        buttons: Array<LabelButton>;
    }
}
