import Gdk from "gi://Gdk?version=4.0";
import Gtk from "gi://Gtk?version=4.0";
import { Accessor, createBinding, createComputed, For } from "gnim";
import GObject, { getter, gtype, property, register, setter, signal } from "gnim/gobject";
import { IconButton, isIconButton, LabelButton } from "libvibe";
import { omitObjectKeys } from "../modules/util";
import { createScopedConnection, toBoolean } from "gnim-utils";
import Pango from "gi://Pango?version=1.0";
import { Album, Artist, Playlist, Song, SongList } from "libvibe/objects";
import { Image as VibeImage } from "libvibe/utils";
import Media from "../modules/media";
import { Menu } from "./Menu";
import { Image } from "./Image";


/** A nice widget with a card view, containing an image(optional), 
* title, description and a button list in the bottom.
* Use this to display some information for a plugin, or even an Album/Song.
*/
@register({ GTypeName: "VibeCard" })
class Card extends Gtk.FlowBoxChild {
    declare $signals: Card.SignalSignatures;

    /** signal ::clicked, emitted when the user clicks in the card(not in the buttons) */
    @signal(Number, Number) clicked(_: number, __: number) {}

    /** signal ::menu-request, emitted when the secondary menu is triggered by a secondary click */
    @signal(Number, Number) menuRequest(x: number, y: number) {
        if(!this.menu)
            return;

        this.menu.set_pointing_to(new Gdk.Rectangle({
            x, y,
            width: this.#box.get_allocated_width(),
            height: this.#box.get_allocated_height()
        }));
    }

    /** signal ::button-clicked, emitted when the user clicks in a button */
    @signal(gtype<IconButton|LabelButton>(Object))
    buttonClicked(_button: IconButton|LabelButton) {}

    #menu: Menu|null = null;
    #box: Gtk.Box;

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
        if(this.#menu?.parent === this.#box) {
            this.menu?.is_visible() &&
                this.menu?.popdown();

            this.#box.remove(this.menu!);
        }

        this.#menu = newValue;
        this.notify("menu");

        this.#menu &&
            this.#box.append(this.#menu);
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
                "buttons"
            ])
        });

        const gestureClick = Gtk.GestureClick.new();
        
        this.add_controller(gestureClick);
        createScopedConnection(
            gestureClick, "released", (_, x, y) => {
                if(gestureClick.get_button() === Gdk.BUTTON_PRIMARY) 
                    this.emit("clicked", x, y);

                if(gestureClick.get_button() === Gdk.BUTTON_SECONDARY) {
                    this.emit("menu-request", x, y);
                }
            }
        );

        if(props.title !== undefined)
            this.title = props.title;

        if(props.description !== undefined)
            this.description = props.description;

        if(props.buttons !== undefined)
            this.buttons = props.buttons;

        if(props.buttonAlign !== undefined)
            this.buttonAlign = props.buttonAlign;

        if(props.menu !== undefined)
            this.menu = props.menu;


        this.set_child(
            this.#box = <Gtk.Box orientation={Gtk.Orientation.VERTICAL}>
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
                                  this.emit("button-clicked", button);
                                  button.onClicked?.();
                              }} class={"flat"}
                            />
                        }
                    </For>
                </Gtk.Box>
            </Gtk.Box> as Gtk.Box
        );
    }


    public static new_for_song(
        song: Song, 
        buttons: Card.ConstructorProps["buttons"] = [{
            iconName: "media-playback-start-symbolic",
            onClicked: () => {
                Media.getDefault().playSong(song, 0);
            }
        }],
        onClickedCallback?: (self: Card) => void,
        menu?: Menu
    ): Card {
        return <Card title={createBinding(song, "title")(s => s ?? "Untitled")}
            description={createBinding(song, "artist")(arts =>
                arts.map(a => a.displayName ?? a.name).join(", "))
            } image={createComputed(() => {
                const image = createBinding(song, "image")();
                const albumImage = createBinding(song, "album", "image")();

                return image ?? albumImage ?? null!; // let's trick typescript lol
            })}
            buttons={buttons} onClicked={onClickedCallback}
            menu={menu}
        /> as Card;
    }

    public static new_for_album(
        album: Album,
        buttons: Card.ConstructorProps["buttons"] = [{
            iconName: "media-playback-start-symbolic",
            onClicked: () => {
                if(album.length < 1)
                    return;

                Media.getDefault().playList(album, 0);
            }
        }],
        onClickedCallback?: (self: Card) => void,
        menu?: Menu
    ): Card {
        return <Card title={createBinding(album, "title").as(s => s ?? "Untitled Album")}
          description={createBinding(album, "artist")(arts => 
                arts.map(a => a.displayName ?? a.name).join(", "))
          } image={createBinding(album, "image") as Accessor<VibeImage>}
          buttons={buttons} onClicked={onClickedCallback}
          menu={menu}
        /> as Card;
    }

    public static new_for_playlist(
        list: Playlist,
        buttons: Card.ConstructorProps["buttons"] = [{
            iconName: "media-playback-start-symbolic",
            onClicked: () => {
                if(list.length < 1)
                    return;

                Media.getDefault().playList(list, 0);
            }
        }],
        onClickedCallback?: (self: Card) => void,
        menu?: Menu
    ): Card {
        return <Card title={createBinding(list, "title").as(s => s ?? "Untitled Playlist")}
          description={createBinding(list, "description") as Accessor<string>}
          image={createBinding(list, "image") as Accessor<VibeImage>}
          buttons={buttons} onClicked={onClickedCallback}
          menu={menu}
        /> as Card;
    }

    public static new_for_songlist(
        list: SongList,
        buttons: Card.ConstructorProps["buttons"] = [{
            iconName: "media-playback-start-symbolic",
            onClicked: () => {
                if(list.length < 1)
                    return;

                Media.getDefault().playList(list, 0);
            }
        }],
        onClickedCallback?: (self: Card) => void,
        menu?: Menu
    ): Card {
        if(list instanceof Album)
            return this.new_for_album(list, buttons, onClickedCallback, menu);

        if(list instanceof Playlist)
            return this.new_for_playlist(list, buttons, onClickedCallback, menu);

        return <Card title={createBinding(list, "title").as(s => s ?? "Untitled List")}
          description={createBinding(list, "description") as Accessor<string>}
          image={createBinding(list, "image") as Accessor<VibeImage>}
          buttons={buttons} onClicked={onClickedCallback}
          menu={menu}
        /> as Card;
    }

    public static new_for_artist(
        artist: Artist, 
        buttons?: Card.ConstructorProps["buttons"],
        onClickedCallback?: (self: Card) => void,
        menu?: Menu
    ): Card {
        return <Card title={createComputed(() => {
              const displayName = createBinding(artist, "displayName")();
              const name = createBinding(artist, "name")();

              return displayName ?? name ?? "Unknown Artist";
          })}
          description={createBinding(artist, "description") as Accessor<string>}
          image={createBinding(artist, "image") as Accessor<VibeImage>}
          buttons={buttons} onClicked={onClickedCallback}
          menu={menu}
        /> as Card;
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
    export interface SignalSignatures extends Gtk.FlowBoxChild.SignalSignatures {
        "clicked": (x: number, y: number) => void;
        "menu-request": (x: number, y: number) => void;
        "button-clicked": (button: IconButton|LabelButton) => void;
        "notify::title": () => void;
        "notify::description": () => void;
        "notify::image": () => void;
        "notify::buttons": () => void;
    }

    export interface ConstructorProps extends Gtk.FlowBoxChild.ConstructorProps {
        title: string;
        description: string;
        image: VibeImage;
        buttonAlign: Gtk.Align;
        imageHeight: number;
        menu: Menu;
        buttons: Array<IconButton | LabelButton>;
    };
}

export default Card;
