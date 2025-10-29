import Adw from "gi://Adw?version=1";
import Gdk from "gi://Gdk?version=4.0";
import GdkPixbuf from "gi://GdkPixbuf?version=2.0";
import Gio from "gi://Gio?version=2.0";
import Gtk from "gi://Gtk?version=4.0";
import { createBinding, For } from "gnim";
import { gtype, property, register, signal } from "gnim/gobject";
import { IconButton, isIconButton, LabelButton } from "libvibe";
import { createScopedConnection, createSubscription, omitObjectKeys, toBoolean } from "../modules/util";
import Pango from "gi://Pango?version=1.0";


/** A nice widget with a card view, containing an image(optional), 
* title, description and a button list in the bottom.
* Use this to display some information for a plugin, or even an Album/Song.
*/
@register({ GTypeName: "VibeCard" })
export default class Card extends Adw.Bin {
    declare $signals: Adw.Bin.SignalSignatures & {
        "clicked": () => void;
        "button-clicked": (button: IconButton|LabelButton) => void;
        "notify::title": (title: string) => void;
        "notify::description": (description: string|null) => void;
        "notify::image": (image: GdkPixbuf.Pixbuf|null) => void;
        "notify::buttons": (buttons: Array<IconButton|LabelButton>|null) => void;
    };

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

    /** the card's image in pixbuf format, can be null */
    @property(gtype<GdkPixbuf.Pixbuf|null>(GdkPixbuf.Pixbuf))
    image: GdkPixbuf.Pixbuf|null = null;

    /** the card's buttons array, can be null */
    @property(gtype<Array<IconButton|LabelButton>|null>(Array<IconButton|LabelButton>))
    buttons: Array<IconButton|LabelButton>|null = null;

    @property(gtype<Gtk.Align>(Number))
    buttonAlign: Gtk.Align = Gtk.Align.CENTER;

    constructor(props: {
        title: string;
        description?: string;
        image?: GdkPixbuf.Pixbuf|string|Gio.File;
        buttonAlign?: Gtk.Align;
        buttons?: Array<IconButton | LabelButton>;
    } & Partial<Adw.Bin.ConstructorProps>) {
        super({
            ...omitObjectKeys(props, [
                "title",
                "description",
                "image",
                "buttons"
            ])
        });

        const gestureClick = Gtk.GestureClick.new();
        
        this.add_css_class("card");
        this.add_controller(gestureClick);
        createScopedConnection(
            gestureClick, "released", () => {
                if(gestureClick.get_button() === Gdk.BUTTON_PRIMARY) 
                    this.emit("clicked");
            }
        )

        this.title = props.title;

        if(props.description !== undefined)
            this.description = props.description;

        if(props.buttons !== undefined)
            this.buttons = props.buttons;

        if(props.buttonAlign !== undefined)
            this.buttonAlign = props.buttonAlign;

        this.build();

        if(props.image !== undefined) {
            if(props.image instanceof GdkPixbuf.Pixbuf) {
                this.image = props.image;
                return;
            }

            let file: Gio.File = typeof props.image === "string" ?
                Gio.File.new_for_path(props.image)
            : props.image;

            if(file.query_exists(null)) {
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
        this.set_child(
            <Gtk.Box orientation={Gtk.Orientation.VERTICAL}>
                <Gtk.Picture contentFit={Gtk.ContentFit.COVER}
                  $={(self) => {
                      createSubscription(
                          createBinding(this, "image"),
                          () => this.image ?
                              self.set_pixbuf(this.image)
                          : self.set_resource(
                              "/io/github/retrozinndev/vibe/icons/io.github.retrozinndev.vibe-symbolic"
                          )
                      );
                  }} visible={toBoolean(createBinding(this, "image"))}
                />
                
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
                </Gtk.Box>
                <Gtk.Separator />
                <Gtk.FlowBox hexpand visible={toBoolean(
                    createBinding(this, "buttons")
                )} halign={createBinding(this, "buttonAlign")}>
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
                </Gtk.FlowBox>
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
