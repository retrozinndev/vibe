import Gdk from "gi://Gdk?version=4.0";
import GdkPixbuf from "gi://GdkPixbuf?version=2.0";
import Gio from "gi://Gio?version=2.0";
import Gtk from "gi://Gtk?version=4.0";
import { Accessor, createBinding, For, With } from "gnim";
import GObject, { gtype, property, register, signal } from "gnim/gobject";
import { IconButton, isIconButton, LabelButton } from "libvibe";
import { omitObjectKeys } from "../modules/util";
import { createScopedConnection, createSubscription, toBoolean } from "gnim-utils";
import Pango from "gi://Pango?version=1.0";
import { Album, Artist, Playlist, Song, SongList } from "libvibe/objects";
import Media from "../modules/media";
import { SecondaryMenu } from "./SecondaryMenu";


/** A nice widget with a card view, containing an image(optional), 
* title, description and a button list in the bottom.
* Use this to display some information for a plugin, or even an Album/Song.
*/
@register({ GTypeName: "VibeCard" })
export default class Card extends Gtk.Box {
    declare $signals: Card.SignalSignatures;

    /** signal ::clicked, emitted when the user clicks in the card(not in the buttons) */
    @signal() clicked() {}

    /** signal ::button-clicked, emitted when the user clicks in a button */
    @signal(gtype<IconButton|LabelButton>(Object))
    buttonClicked(_button: IconButton|LabelButton) {}


    /** the card's primary text */
    @property(String)
    title: string;

    /** the card's secondary text, can be null */
    @property(gtype<string|null>(String))
    description: string|null = null;

    /** the card's image in pixbuf or texture format, can be null */
    @property(gtype<GdkPixbuf.Pixbuf|Gdk.Texture|null>(GObject.Object))
    image: GdkPixbuf.Pixbuf|Gdk.Texture|null = null;

    /** the card's buttons array, can be null */
    @property(gtype<Array<IconButton|LabelButton>|null>(Array))
    buttons: Array<IconButton|LabelButton>|null = null;

    /** secondary menu, available when the user clicks the card 
      * using the `SECONDARY_BUTTON` */
    @property(gtype<SecondaryMenu|null>(SecondaryMenu))
    menu: SecondaryMenu|null = null;

    /** primary buttons horizontal alignment */
    @property(gtype<Gtk.Align>(Number))
    buttonAlign: Gtk.Align = Gtk.Align.CENTER;


    constructor(props: Card.ConstructorProps) {
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
            gestureClick, "released", () => {
                if(gestureClick.get_button() === Gdk.BUTTON_PRIMARY) 
                    this.emit("clicked");

                if(gestureClick.get_button() === Gdk.BUTTON_SECONDARY) {
                    
                }
            }
        );

        this.title = props.title;

        if(props.description !== undefined)
            this.description = props.description;

        if(props.buttons !== undefined)
            this.buttons = props.buttons;

        if(props.buttonAlign !== undefined)
            this.buttonAlign = props.buttonAlign;

        if(props.menu !== undefined)
            this.menu = props.menu;

        this.build();

        if(props.image !== undefined) {
            if(props.image instanceof GdkPixbuf.Pixbuf || props.image instanceof Gdk.Texture) {
                this.image = props.image;
                return;
            }

            let file: Gio.File = typeof props.image === "string" ?
                Gio.File.new_for_path(props.image)
            : props.image;

            if(file?.query_exists(null)) {
                try {
                    const pixbuf = GdkPixbuf.Pixbuf.new_from_file(file.peek_path()!);
                    this.image = pixbuf;
                } catch(e) {
                    console.error(`Card: Couldn't load image: ${(e as Error).message}\n${
                        (e as Error).stack}`);
                }

                return;
            }

            console.warn("Card: Couldn't load image: file inaccessible or does not exist");
        }
    }

    private build(): void {
        this.set_orientation(Gtk.Orientation.VERTICAL);
        this.prepend(
            <Gtk.Picture contentFit={Gtk.ContentFit.COVER} canShrink keepAspectRatio halign={Gtk.Align.CENTER}
              $={(self) => {
                  createSubscription(
                      createBinding(this, "image"),
                      () => {
                          if(!this.image) {
                              self.set_resource(
                                  "/io/github/retrozinndev/vibe/icons/io.github.retrozinndev.vibe-symbolic"
                              );
                              return;
                          }

                          if(this.image instanceof GdkPixbuf.Pixbuf) {
                              self.set_pixbuf(this.image);
                              return;
                          }

                          self.set_paintable(this.image);
                      }
                  );
              }} visible={toBoolean(createBinding(this, "image"))}
            /> as Gtk.Picture
        );
        
        this.append(
            <Gtk.Box orientation={Gtk.Orientation.VERTICAL}>
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
            <Gtk.Separator /> as Gtk.Widget
        );

        this.append(
            <Gtk.Box hexpand halign={createBinding(this, "buttonAlign")} 
              visible={toBoolean(createBinding(this, "buttons"))}>

                <With value={toBoolean(createBinding(this, "buttons")) as Accessor<boolean>}>
                    {hasButtons => hasButtons && 
                        <Gtk.Box>
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
                    }
                </With>
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
        menu?: SecondaryMenu
    ): Card {
        return <Card title={song.title ?? "Untitled"}
            description={song.artist.map(a => a.displayName ?? a.name).join(", ")}
            image={song.image ?? song.album?.image ?? undefined}
            buttons={buttons} onClicked={onClickedCallback}
            menu={menu}
        /> as Card;
    }

    public static new_for_album(
        album: Album,
        buttons: Card.ConstructorProps["buttons"] = [{
            iconName: "media-playback-start-symbolic",
            onClicked: () => {
                if(album.songs.length < 1)
                    return;

                Media.getDefault().playList(album, 0);
            }
        }],
        onClickedCallback?: (self: Card) => void,
        menu?: SecondaryMenu
    ): Card {
        return <Card title={album.title ?? "Untitled Album"}
          description={album.artist.map(a => a.displayName ?? a.name).join(", ")}
          image={album.image ?? undefined}
          buttons={buttons} onClicked={onClickedCallback}
          menu={menu}
        /> as Card;
    }

    public static new_for_playlist(
        list: Playlist,
        buttons: Card.ConstructorProps["buttons"] = [{
            iconName: "media-playback-start-symbolic",
            onClicked: () => {
                if(list.songs.length < 1)
                    return;

                Media.getDefault().playList(list, 0);
            }
        }],
        onClickedCallback?: (self: Card) => void,
        menu?: SecondaryMenu
    ): Card {
        return <Card title={list.title ?? "Untitled Playlist"}
          description={list.description}
          image={list.image ?? undefined}
          buttons={buttons} onClicked={onClickedCallback}
          menu={menu}
        /> as Card;
    }

    public static new_for_songlist(
        list: SongList,
        buttons: Card.ConstructorProps["buttons"] = [{
            iconName: "media-playback-start-symbolic",
            onClicked: () => {
                if(list.songs.length < 1)
                    return;

                Media.getDefault().playList(list, 0);
            }
        }],
        onClickedCallback?: (self: Card) => void,
        menu?: SecondaryMenu
    ): Card {
        if(list instanceof Album)
            return this.new_for_album(list, buttons, onClickedCallback, menu);

        if(list instanceof Playlist)
            return this.new_for_playlist(list, buttons, onClickedCallback, menu);

        return <Card title={list.title ?? "Untitled List"}
          description={list.description}
          image={list.image ?? undefined}
          buttons={buttons} onClicked={onClickedCallback}
          menu={menu}
        /> as Card;
    }

    public static new_for_artist(
        artist: Artist, 
        buttons?: Card.ConstructorProps["buttons"],
        onClickedCallback?: (self: Card) => void,
        menu?: SecondaryMenu
    ): Card {
        return <Card title={artist.displayName ?? artist.name ?? "Untitled"}
            description={artist.description}
            image={artist.image ?? undefined}
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

export namespace Card {
    export interface SignalSignatures extends Gtk.Box.SignalSignatures {
        "clicked": () => void;
        "button-clicked": (button: IconButton|LabelButton) => void;
        "notify::title": (title: string) => void;
        "notify::description": (description: string|null) => void;
        "notify::image": (image: GdkPixbuf.Pixbuf|null) => void;
        "notify::buttons": (buttons: Array<IconButton|LabelButton>|null) => void;
    }

    export type ConstructorProps = Partial<Gtk.Box.ConstructorProps> & {
        title: string;
        description?: string;
        image?: GdkPixbuf.Pixbuf|Gdk.Texture|string|Gio.File;
        buttonAlign?: Gtk.Align;
        imageHeight?: number;
        menu?: SecondaryMenu;
        buttons?: Array<IconButton | LabelButton>;
    };
}
