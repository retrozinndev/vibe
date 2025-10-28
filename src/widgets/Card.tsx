import Adw from "gi://Adw?version=1";
import GdkPixbuf from "gi://GdkPixbuf?version=2.0";
import Gio from "gi://Gio?version=2.0";
import Gtk from "gi://Gtk?version=4.0";
import { createBinding, For } from "gnim";
import { gtype, property, register, signal } from "gnim/gobject";
import { IconButton, isIconButton, LabelButton } from "libvibe";
import { createSubscription, omitObjectKeys, toBoolean } from "../modules/util";


interface CardSignalSignatures extends Adw.Bin.SignalSignatures {
    "clicked": () => void;
    "button-clicked": (button: IconButton|LabelButton) => void;
    "notify::title": (title: string) => void;
    "notify::description": (description: string|null) => void;
    "notify::image": (image: GdkPixbuf.Pixbuf|null) => void;
    "notify::buttons": (buttons: Array<IconButton|LabelButton>|null) => void;
}

/** A nice widget with a card view, containing an image(optional), 
* title, description and a button list in the bottom.
* Use this to display some information for a plugin, or even an Album/Song.
*/
@register({ GTypeName: "Card" })
export default class Card extends Adw.Bin {
    declare $signals: CardSignalSignatures;

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

    constructor(props: {
        title: string;
        description?: string;
        image?: GdkPixbuf.Pixbuf|string|Gio.File;
        buttons?: Array<IconButton | LabelButton>;
    } & Partial<Adw.Bin.ConstructorProps>) {
        super({
            cssName: "page",
            ...omitObjectKeys(props, [
                "title",
                "description",
                "image",
                "buttons"
            ])
        });

        this.title = props.title;

        if(props.description !== undefined)
            this.description = props.description;

        if(props.buttons !== undefined)
            this.buttons = props.buttons;

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
            <Gtk.Box hexpand={false} vexpand={false}>
                {this.image !== null && 
                    <Gtk.Image $={(self) => {
                        createSubscription(
                            createBinding(this, "image"),
                            () => this.image &&
                                self.set_from_pixbuf(this.image)
                        );
                    }} />
                }
                
                <Gtk.Label label={createBinding(this, "title")} 
                  visible={toBoolean(createBinding(this, "title"))}
                  class={"heading"} xalign={0}
                />
                <Gtk.Label label={createBinding(this, "description").as(s => s ?? "")}
                  visible={toBoolean(createBinding(this, "description"))}
                  class={"caption dimmed"} xalign={0}
                />
                <Gtk.Separator />
                <Gtk.FlowBox hexpand homogeneous={true} visible={toBoolean(
                    createBinding(this, "buttons")
                )}>
                    <For each={createBinding(this, "buttons").as(b => b!)}>
                        {(button: IconButton|LabelButton) =>
                            <Gtk.Button iconName={isIconButton(button) ?
                                button.iconName : undefined
                              } label={!isIconButton(button) ?
                                button.label : undefined
                              }
                            />
                        }
                    </For>
                </Gtk.FlowBox>
            </Gtk.Box> as Gtk.Box
        );
    }

    emit<
        Signal extends keyof CardSignalSignatures,
        Args extends Parameters<CardSignalSignatures[Signal]>
    >(signal: Signal, ...args: Args): void {
        super.emit(signal, ...args);
    }

    connect<
        Signal extends keyof CardSignalSignatures,
        Callback extends CardSignalSignatures[Signal]
    >(signal: Signal, callback: Callback): number {
        return super.connect(signal, callback);
    }
}
