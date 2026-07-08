import Gdk from "gi://Gdk?version=4.0";
import Gtk from "gi://Gtk?version=4.0";
import GObject from "gi://GObject?version=2.0";
import { Accessor, createBinding, For, This } from "gnim";
import { getter, gtype, property, register, setter, signal } from "gnim/gobject";
import { IconButton, isIconButton, LabelButton, Vibe } from "libvibe";
import { omitObjectKeys } from "../modules/util";
import { toBoolean } from "gnim-utils";
import Pango from "gi://Pango?version=1.0";
import { Album, Artist, Playlist, Song, SongList } from "libvibe/objects";
import { Image as VibeImage } from "libvibe/utils";
import { Menu } from "./Menu";
import { Image } from "./Image";
import Graphene from "gi://Graphene?version=1.0";


/** A nice widget with a card view, containing an image(optional), 
* title, description and a button list in the bottom.
* Use this to display some information for a plugin, or even an Album/Song.
*/
@register({ GTypeName: "VibeCard" })
class Card extends Gtk.Box {
    declare readonly $signals: Card.SignalSignatures;
    declare readonly $readWriteProperties: Card.ReadWriteProperties;

    /** signal ::clicked, emitted when the user clicks in the card(not in the buttons) */
    @signal(Number, Number) clicked(_: number, __: number) {}

    /** signal ::menu-request, emitted when the secondary menu is triggered by a secondary click */
    @signal(Number, Number) menuRequest(_x: number, _y: number) {
        if(!this.menu)
            return;

        this.menu.popup();
    }

    /** signal ::button-clicked, emitted when the user clicks in a button */
    @signal(gtype<IconButton|LabelButton>(Object))
    buttonClicked(_button: IconButton|LabelButton) {}

    #menu: Menu|null = null;

    @property(gtype<Song|Artist|Album|Playlist|SongList|null>(GObject.Object))
    object: Song|Artist|Album|Playlist|SongList|null = null;

    /** the card's primary text */
    @property(String)
    title: string = "New Card";

    /** the card's secondary text, can be null */
    @property(gtype<string|null>(String))
    description: string|null = null;

    /** the card's image, can be null */
    @property(gtype<VibeImage|null>(GObject.Object))
    image: VibeImage|null = null;

    /** the card's buttons array, can be null */
    @property(gtype<Array<IconButton|LabelButton>|null>(Array))
    buttons: Array<IconButton|LabelButton> = [];

    /** secondary menu, available when the user clicks the card 
      * using the mouse's `SECONDARY_BUTTON` */
    @getter(gtype<Menu|null>(Gtk.Popover))
    get menu() { return this.#menu; }

    @setter(gtype<Menu|null>(Gtk.Popover))
    set menu(newValue: Menu|null) {
        if(this.#menu?.parent === this) {
            this.menu!.is_visible() &&
                this.menu!.popdown();

            this.remove(this.menu!);
        }

        this.#menu = newValue;
        (this as Card).notify("menu");

        this.#menu &&
            this.append(this.#menu);
    }

    /** primary buttons horizontal alignment */
    @property(gtype<Gtk.Align>(Number))
    buttonAlign: Gtk.Align = Gtk.Align.CENTER;


    constructor(props: Partial<GObject.ConstructorProps<Card>>) {
        super({
            cssName: "card",
            cssClasses: ["card"],
            ...omitObjectKeys(props, [
                "title",
                "buttonAlign",
                "description",
                "image",
                "menu",
                "object",
                "buttons"
            ])
        });

        if(props.title !== undefined)
            this.title = props.title;

        if(props.description !== undefined)
            this.description = props.description;

        if(props.buttons !== undefined)
            this.buttons = props.buttons;

        if(props.buttonAlign !== undefined)
            this.buttonAlign = props.buttonAlign;

        if(props.menu)
            this.menu = props.menu;

        void (
            <This this={this as Card} orientation={Gtk.Orientation.VERTICAL}>
                <Image image={createBinding(this, "image") as Accessor<VibeImage>} canShrink
                  keepAspectRatio visible={toBoolean(createBinding(this, "image"))}
                />
                <Gtk.Box orientation={Gtk.Orientation.VERTICAL} vexpand>
                    <Gtk.Label label={createBinding(this, "title")} 
                      visible={toBoolean(createBinding(this, "title"))}
                      class={"heading"} ellipsize={Pango.EllipsizeMode.END} 
                      xalign={0}
                    />
                    <Gtk.Label label={createBinding(this, "description").as(s => s ?? "")}
                      visible={toBoolean(createBinding(this, "description"))}
                      class={"caption dimmed"} ellipsize={Pango.EllipsizeMode.END} xalign={0}
                    />
                </Gtk.Box>
                <Gtk.Separator visible={toBoolean(createBinding(this, "buttons"))} />
                <Gtk.Box hexpand halign={createBinding(this, "buttonAlign")} 
                  visible={toBoolean(createBinding(this, "buttons"))}>

                    <For each={createBinding(this, "buttons").as(b => b!)}>
                        {(button: IconButton|LabelButton) =>
                            <Gtk.Button iconName={isIconButton(button) ?
                                button.iconName : undefined
                              } label={!isIconButton(button) ?
                                button.label : undefined
                              } onClicked={() => {
                                  (this as Card).emit("button-clicked", button);
                                  button.onClicked?.();
                              }} class={"flat"}
                            />
                        }
                    </For>
                </Gtk.Box>

                <Gtk.GestureClick button={0}
                  onReleased={(click: Gtk.GestureClick, _: number, xx: number, yy: number) => {
                      const { x, y } = this.compute_point(
                          this,
                          new Graphene.Point({ x: xx, y: yy })
                      )[1];

                      switch(click.get_current_button()) {
                        case Gdk.BUTTON_PRIMARY: {
                            (this as Card).emit("clicked", x, y);
                            return;
                        };

                        case Gdk.BUTTON_SECONDARY: {
                          // emit menu-request for plugin
                          if(this.object && this.object.plugin && this.#menu) {
                              this.object.plugin.emit("menu-request", this.object, this.#menu);
                              Vibe.getDefault().emit("menu-request", this.object, this.#menu);
                          }

                          (this as Card).emit("menu-request", x, y);
                        };
                      }
                  }}
                />
            </This>
        );
    }
}

namespace Card {
    export interface SignalSignatures extends Gtk.Box.SignalSignatures {
        "clicked"(x: number, y: number): void;
        "menu-request"(x: number, y: number): void;
        "button-clicked"(button: IconButton|LabelButton): void;
        "notify::title"(): void;
        "notify::description"(): void;
        "notify::image"(): void;
        "notify::buttons"(): void;
    }

    export interface ReadWriteProperties extends Gtk.Box.ReadWriteProperties {
        "title": string;
        "description": string;
        "image": VibeImage;
        "button-align": Gtk.Align;
        "object": Song|Album|Artist|Playlist|SongList;
        "menu": Menu;
        "buttons": Array<IconButton | LabelButton>;
    };
}

export default Card;
