import Gdk from "gi://Gdk?version=4.0";
import Gtk from "gi://Gtk?version=4.0";
import { Accessor, createBinding, For } from "gnim";
import GObject, { getter, gtype, property, register, setter, signal } from "gnim/gobject";
import { IconButton, isIconButton, LabelButton, Vibe } from "libvibe";
import { omitObjectKeys } from "../modules/util";
import { createScopedConnection, toBoolean } from "gnim-utils";
import Pango from "gi://Pango?version=1.0";
import { Album, Artist, Playlist, Song, SongList } from "libvibe/objects";
import { Image as VibeImage } from "libvibe/utils";
import { Menu } from "./Menu";
import { Image } from "./Image";
import Media from "../modules/media";
import { App } from "../app";


/** A nice widget with a card view, containing an image(optional), 
* title, description and a button list in the bottom.
* Use this to display some information for a plugin, or even an Album/Song.
*/
@register({ GTypeName: "VibeCard" })
class Card extends Gtk.Box {
    declare $signals: Card.SignalSignatures;

    /** signal ::clicked, emitted when the user clicks in the card(not in the buttons) */
    @signal(Number, Number) clicked(_: number, __: number) {}

    /** signal ::menu-request, emitted when the secondary menu is triggered by a secondary click */
    @signal(Number, Number) menuRequest(xx: number, yy: number) {
        if(!this.menu)
            return;

        /* TODO: fix this thing
        const [, { x, y }] = this.compute_point(
            App.get_default().get_main_window(),
            new Graphene.Point({ x: xx, y: yy })
        );

        this.menu.set_pointing_to(new Gdk.Rectangle({
            x, y,
            width: this.get_allocated_width(),
            height: this.get_allocated_height()
        }));
        */
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
        this.notify("menu");

        this.#menu &&
            this.append(this.#menu);
    }

    /** primary buttons horizontal alignment */
    @property(gtype<Gtk.Align>(Number))
    buttonAlign: Gtk.Align = Gtk.Align.CENTER;


    constructor(props: Partial<Card.ConstructorProps>) {
        super({
            cssName: "card",
            ...omitObjectKeys(props, [
                "title",
                "description",
                "image",
                "menu",
                "object",
                "buttons"
            ])
        });

        const clickPrimary = Gtk.GestureClick.new(),
            clickSecondary = Gtk.GestureClick.new();

        clickSecondary.set_button(Gdk.BUTTON_PRIMARY);
        clickSecondary.set_button(Gdk.BUTTON_SECONDARY);
        
        createScopedConnection(
            clickPrimary, "released", (_, xx, yy) => {
                const [, x, y] = this.translate_coordinates(
                    App.get_default().get_main_window(),
                    xx, yy
                );

                this.emit("clicked", x, y);
            }
        );

        createScopedConnection(
            clickSecondary, "released", (_, x, y) => {
                this.emit("menu-request", x, y);

                // emit menu-request for plugin
                if(this.object && this.object.plugin && this.#menu) {
                    this.object.plugin.emit("menu-request", this.object, this.#menu);
                    Vibe.getDefault().emit("menu-request", this.object, this.#menu);
                }
            }
        );

        this.add_controller(clickPrimary);
        this.add_controller(clickSecondary);

        if(props.title !== undefined)
            this.title = props.title;

        if(props.description !== undefined)
            this.description = props.description;

        if(props.buttons !== undefined)
            this.buttons = props.buttons;

        if(props.buttonAlign !== undefined)
            this.buttonAlign = props.buttonAlign;

        this.menu = props.menu ?? new Menu({
            buttons: [{
                label: "Play",
                onClicked: () => this.object &&
                    Media.playObject(this.object)
            }]
        });

        this.set_orientation(Gtk.Orientation.VERTICAL);
        this.prepend(
            <Image image={createBinding(this, "image") as Accessor<VibeImage>} canShrink
              keepAspectRatio visible={toBoolean(createBinding(this, "image"))}
            /> as Image
        );

        this.append(
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
            </Gtk.Box> as Gtk.Box
        );

        this.append(
            <Gtk.Separator visible={toBoolean(createBinding(this, "buttons"))} /> as Gtk.Separator
        );

        this.append(
            <Gtk.Box hexpand halign={createBinding(this, "buttonAlign")} 
              visible={toBoolean(createBinding(this, "buttons"))}>

                <For each={createBinding(this, "buttons").as(b => b!)}>
                    {(button: IconButton|LabelButton) =>
                        <Gtk.Button iconName={isIconButton(button) ?
                            button.iconName : undefined
                          } label={!isIconButton(button) ?
                            button.label : undefined
                          } onClicked={() => {
                              this.emit("button-clicked", button);
                              button.onClicked?.();
                          }} class={"flat"}
                        />
                    }
                </For>
            </Gtk.Box> as Gtk.Box
        );
    }

    emit<
        Signal extends keyof typeof this.$signals,
        Args extends Parameters<(typeof this.$signals)[Signal]>
    >(signal: Signal, ...args: Args): void {
        super.emit(signal, ...args);
    }

    connect<
        Signal extends keyof typeof this.$signals,
        Callback extends (typeof this.$signals)[Signal]
    >(signal: Signal, callback: Callback): number {
        return super.connect(signal, callback);
    }
}

namespace Card {
    export interface SignalSignatures extends Gtk.Box.SignalSignatures {
        "clicked": (x: number, y: number) => void;
        "menu-request": (x: number, y: number) => void;
        "button-clicked": (button: IconButton|LabelButton) => void;
        "notify::title": () => void;
        "notify::description": () => void;
        "notify::image": () => void;
        "notify::buttons": () => void;
    }

    export interface ConstructorProps extends Gtk.Box.ConstructorProps {
        title: string;
        description: string;
        image: VibeImage;
        buttonAlign: Gtk.Align;
        imageHeight: number;
        object: Song|Album|Artist|Playlist|SongList;
        menu: Menu;
        buttons: Array<IconButton | LabelButton>;
    };
}

export default Card;
