import Adw from "gi://Adw?version=1";
import Gdk from "gi://Gdk?version=4.0";
import GdkPixbuf from "gi://GdkPixbuf?version=2.0";
import Gtk from "gi://Gtk?version=4.0";
import { createBinding, For } from "gnim";
import GObject, { gtype, property, register, signal } from "gnim/gobject";
import { IconButton, isIconButton, isLabelButton, LabelButton } from "libvibe";
import { createScopedConnection, toBoolean } from "gnim-utils";
import Pango from "gi://Pango?version=1.0";
import { omitObjectKeys } from "../modules/util";


@register({ GTypeName: "VibeSmallCard" })
export default class SmallCard extends Adw.Bin {
    declare $signals: Adw.Bin.SignalSignatures & {
        "clicked": () => void;
        "button-clicked": (button: IconButton|LabelButton) => void;
    };

    @signal()
    clicked() {};

    @signal(gtype<IconButton|LabelButton>(Object))
    buttonClicked(_button: IconButton|LabelButton) {}

    @property(String)
    title: string;

    @property(Array<IconButton|LabelButton>)
    buttons: Array<IconButton|LabelButton> = [];

    @property(gtype<GdkPixbuf.Pixbuf|Gdk.Texture|null>(GObject.Object))
    image: GdkPixbuf.Pixbuf|Gdk.Texture|null = null;


    constructor(props: {
        title: string;
        image?: GdkPixbuf.Pixbuf|Gdk.Texture;
        buttons?: Array<IconButton|LabelButton>;
    } & Partial<Adw.Bin.ConstructorProps>) {
        super({
            cssName: "smallcard",
            ...omitObjectKeys(props, [
                "title",
                "image",
                "buttons"
            ])
        });

        const gestureClick = Gtk.GestureClick.new();

        this.title = props.title;
        if(props.image !== undefined)
            this.image = props.image;

        if(props.buttons !== undefined)
            this.buttons.push(...props.buttons);

        this.add_controller(gestureClick);

        createScopedConnection(
            gestureClick, "released", () => {
                if(gestureClick.get_button() === Gdk.BUTTON_PRIMARY)
                    this.emit("clicked");
            }
        );


        this.set_child(
            <Gtk.CenterBox>
                <Gtk.Box $type="start">
                    <Gtk.Image pixelSize={24} class={"art"}
                      $={(self) => {
                          if(!this.image) {
                              self.set_from_resource(
                                  "/io/github/retrozinndev/vibe/icons/io.github.retrozinndev.vibe-symbolic.svg"
                              );
                              return;
                          }

                          if(this.image instanceof GdkPixbuf.Pixbuf) {
                              self.set_from_pixbuf(this.image);
                              return;
                          }

                          self.set_from_paintable(this.image);
                      }} 
                    />
                    <Gtk.Label label={createBinding(this, "title")} xalign={0} 
                      ellipsize={Pango.EllipsizeMode.END}
                    />
                </Gtk.Box>
                <Gtk.Box class={"linked buttons"} visible={toBoolean(createBinding(this, "buttons"))} $type="end">
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
            </Gtk.CenterBox> as Gtk.CenterBox
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
