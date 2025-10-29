import Adw from "gi://Adw?version=1";
import Gdk from "gi://Gdk?version=4.0";
import GdkPixbuf from "gi://GdkPixbuf?version=2.0";
import Gtk from "gi://Gtk?version=4.0";
import { createBinding, For } from "gnim";
import { getter, gtype, property, register, signal } from "gnim/gobject";
import { IconButton, isIconButton, isLabelButton, LabelButton } from "libvibe";
import { createScopedConnection, omitObjectKeys } from "../modules/util";


@register({ GTypeName: "VibeSmallCard" })
export default class SmallCard extends Adw.Bin {
    declare $signals: Adw.Bin.SignalSignatures & {
        "clicked": () => void;
        "button-clicked": (button: IconButton|LabelButton) => void;
    };

    #image: GdkPixbuf.Pixbuf|null = null;

    @signal()
    clicked() {};

    @signal(gtype<IconButton|LabelButton>(Object))
    buttonClicked(_button: IconButton|LabelButton) {}

    @property(String)
    title: string;

    @property(Array<IconButton|LabelButton>)
    buttons: Array<IconButton|LabelButton> = [];

    @getter(gtype<GdkPixbuf.Pixbuf|null>(GdkPixbuf.Pixbuf))
    get image() { return this.#image; }


    constructor(props: {
        title: string;
        image?: GdkPixbuf.Pixbuf;
        buttons?: Array<IconButton|LabelButton>;
    } & Partial<Adw.Bin.ConstructorProps>) {
        super(omitObjectKeys(props, [
            "title",
            "image",
            "buttons"
        ]));

        const gestureClick = Gtk.GestureClick.new();

        this.title = props.title;
        if(props.image !== undefined)
            this.#image = props.image;

        if(props.buttons !== undefined)
            this.buttons.push(...props.buttons);

        this.add_css_class("opaque");
        this.set_hexpand(false);
        this.add_controller(gestureClick);

        createScopedConnection(
            gestureClick, "released", () => {
                if(gestureClick.get_button() === Gdk.BUTTON_PRIMARY)
                    this.emit("clicked");
            }
        );


        this.set_child(
            <Gtk.Box>
                <Gtk.CenterBox hexpand>
                    <Gtk.Box $type="start">
                        {this.#image && 
                            <Gtk.Image $={(self) => self.set_from_pixbuf(this.#image)} />
                        }
                        <Gtk.Label label={createBinding(this, "title")} xalign={0} 
                          yalign={.5}
                        />
                    </Gtk.Box>
                    <Gtk.Box class={"linked"}>
                        <For each={createBinding(this, "buttons")}>
                            {(button: IconButton|LabelButton) => 
                                <Gtk.Button label={isLabelButton(button) ?
                                      button.label : undefined
                                  } iconName={isIconButton(button) ?
                                      button.iconName : undefined
                                  } onClicked={() => {
                                      this.emit("button-clicked", button);
                                      button.onClicked?.();
                                  }}
                                />
                            }
                        </For>
                    </Gtk.Box>
                </Gtk.CenterBox>
            </Gtk.Box> as Gtk.Box
        );
    }

    connect<Signal extends keyof typeof this.$signals>(
        signal: Signal, callback: (typeof this.$signals)[Signal]
    ): number {
        return super.connect(signal, callback);
    }

    emit<Signal extends keyof typeof this.$signals>(
        signal: Signal, ...parameters: Parameters<(typeof this.$signals)[Signal]>
    ): void {
        super.emit(signal, ...parameters);
    }
}
