import Adw from "gi://Adw?version=1";
import Gdk from "gi://Gdk?version=4.0";
import GdkPixbuf from "gi://GdkPixbuf?version=2.0";
import Gtk from "gi://Gtk?version=4.0";
import { omitObjectKeys } from "../modules/util";
import GObject, { gtype, property, register } from "gnim/gobject";
import { IconButton, isLabelButton, LabelButton, DetailedButton, isDetailedButton } from "libvibe";
import { toBoolean } from "gnim-utils";
import { createBinding, For } from "gnim";
import Pango from "gi://Pango?version=1.0";


@register({ GTypeName: "VibePageHeader" })
export class PageHeader extends Gtk.Box {

    #subs: Array<() => void> = [];

    @property(gtype<string|null>(String))
    title: string|null = null;

    @property(gtype<string|null>(String))
    description: string|null = null;

    @property(gtype<Gdk.Texture|GdkPixbuf.Pixbuf|null>(GObject.Object))
    image: Gdk.Texture|GdkPixbuf.Pixbuf|null = null;

    @property(Array)
    buttons: Array<IconButton|LabelButton|DetailedButton> = [];


    constructor(props: Partial<PageHeader.ConstructorProps>) {
        super(omitObjectKeys(props, [
            "image",
            "title",
            "description",
            "buttons"
        ]));

        const image = createBinding(this, "image");
        const title = createBinding(this, "title");
        const description = createBinding(this, "description");
        const buttons = createBinding(this, "buttons");

        const gtkPicture = <Gtk.Picture canShrink keepAspectRatio 
          $={() => {
              const img = image.peek();

              img && setWidgetImage(img);
          }}
        /> as Gtk.Picture;

        function setWidgetImage(img: Gdk.Texture|GdkPixbuf.Pixbuf): void {
            if(!img)
                return;

            if(img instanceof GdkPixbuf.Pixbuf) {
                gtkPicture.set_pixbuf(img);
                return;
            }

            gtkPicture.set_paintable(img);
        }

        this.#subs.push(
            image.subscribe(() => {
                const img = image.peek();

                if(img === null && this.image === null)
                    return;

                if(img === null && this.image !== null) {
                    gtkPicture.set_paintable(null);
                    return;
                }

                setWidgetImage(img!);
            })
        );

        this.prepend(
            <Adw.Clamp orientation={Gtk.Orientation.VERTICAL} maximumSize={128}
              visible={toBoolean(image)}>

                {gtkPicture}
            </Adw.Clamp> as Adw.Clamp
        );

        this.append(
            <Gtk.Box orientation={Gtk.Orientation.VERTICAL}>
                <Gtk.Box class="data" orientation={Gtk.Orientation.VERTICAL} valign={Gtk.Align.CENTER}>
                    <Gtk.Label xalign={0} label={title.as(s => s ?? "")} class={"title-1"} 
                      ellipsize={Pango.EllipsizeMode.END} visible={toBoolean(title)}
                    />
                    <Gtk.Label xalign={0} label={description.as(s => s ?? "")} class={"heading dimmed"}
                      visible={toBoolean(description)} ellipsize={Pango.EllipsizeMode.END}
                    />
                </Gtk.Box>
                <Gtk.Box class={"buttons"} visible={toBoolean(buttons)} spacing={4}>
                    <For each={buttons}>
                        {(button: LabelButton|IconButton|DetailedButton) =>
                            isDetailedButton(button) ?
                                <Gtk.Button class={"pill"} onClicked={() => button.onClicked?.()}>
                                    <Gtk.Box spacing={4}>
                                        <Gtk.Image iconName={button.iconName} />
                                        <Gtk.Label label={button.label} />
                                    </Gtk.Box>
                                </Gtk.Button>
                            : <Gtk.Button class={isLabelButton(button) ? "pill" : "circular"}
                                label={(button as LabelButton).label} // returns undefined if the button is not a LabelButton anyways
                                iconName={(button as IconButton).iconName} // same as the label prop
                                onClicked={() => button.onClicked?.()}
                            />
                        }
                    </For>
                </Gtk.Box>
            </Gtk.Box> as Gtk.Box
        );
    }

    vfunc_dispose(): void {
        this.#subs.forEach(sub => sub());
    }
}


export namespace PageHeader {
    export interface SignalSignatures extends Gtk.Box.SignalSignatures {}
    export interface ConstructorProps extends Gtk.Box.ConstructorProps {
        title: string;
        image: Gdk.Texture|GdkPixbuf.Pixbuf|null;
        description: string;
        buttons: Array<IconButton|LabelButton|(IconButton&LabelButton)>;
    }
}
