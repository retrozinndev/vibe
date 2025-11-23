import Gtk from "gi://Gtk?version=4.0";
import { getter, property, register } from "gnim/gobject";
import { Song } from "libvibe/objects";
import { omitObjectKeys } from "../modules/util";
import { Page } from "./Page";
import { PageModal } from "libvibe/interfaces";
import { createBinding, For } from "gnim";



/** secondary menu when clicking with the secondary mouse button in a song */
@register({ GTypeName: "VibeSongPopover" })
export default class extends Gtk.Popover {
    #song: Song;

    @getter(Song)
    get song() { return this.#song; }

    @property(Array<Gtk.Button>)
    extraButtons: Array<Gtk.Button> = [];

    constructor(props: {
        song: Song;
        extraButtons?: Array<Gtk.Button>;
    } & Partial<Gtk.Popover.ConstructorProps>) {
        super(omitObjectKeys(props, ["song"]));

        this.#song = props.song;
        if(props.extraButtons && props.extraButtons.length > 0)
            this.extraButtons = props.extraButtons;

        this.add_css_class("menu");
        this.set_child(
            <Gtk.ListBox>
                <Gtk.Button label={"Go to Album"} visible={Boolean(props.song.album)} />
                {props.song.artist && props.song.artist.length > 0 &&
                    props.song.artist.map(artist => 
                        <Gtk.Button label={`Go to ${artist.displayName ?? artist.name}`}
                          onClicked={() => {
                              new Page({
                                  modal: PageModal.ARTIST,
                                  content: artist,
                                  title: artist.displayName ?? artist.name
                              });
                          }}
                        />
                    )
                }
                <Gtk.Separator visible={createBinding(this, "extraButtons").as(btns =>
                    btns.length > 0
                )} />
                <For each={createBinding(this, "extraButtons")}>
                    {(button: Gtk.Button) => button}
                </For>
            </Gtk.ListBox> as Gtk.ListBox
        );
    }
}
